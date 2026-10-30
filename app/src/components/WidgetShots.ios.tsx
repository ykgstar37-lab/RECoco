// 홈 화면 위젯에 띄울 기록 그림을 굽는다 (iOS).
// 위젯은 앱의 양식 코드를 못 돌리므로, 앱이 영수증을 화면 뒤에 몰래 그려 PNG 로 찍고
// 앱·위젯 공용 폴더(widgetsDirectory)에 넣은 뒤 그 경로를 위젯에 넘긴다.
//  - 크게 보기 ⋯ 에서 '위젯 목록에 넣기' 한 기록만
//  - 기록 내용이 바뀌면(고치기) 다시 굽는다. 안 쓰는 그림은 지운다
//  - 한 장 구울 때마다 위젯에 바로 넘긴다 (다 굽기 전에도 뜨게)
// 화면 안(왼쪽 위)에 그리고 같은 주황 판으로 덮는다 — 홈은 overflow: hidden 이라 화면 밖에 그리면 잘려서 못 찍는다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { Directory, File } from 'expo-file-system';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { initWidgetBg, useWidgetBg, useWidgetCalib } from '../lib/widgetBg';
import { defaultPickName, initWidgetPicks, setWidgetStatus, useWidgetPickNames, useWidgetPicks, widgetStatus } from '../lib/widgetPicks';
import { RecordPaper } from '../templates';
import { COLORS } from '../theme';
import type { RecoRecord } from '../types';
import type { WidgetProps } from '../widgets/RecordWidgets';

/** 그릴 폭(pt)과 구운 그림 폭(px) — 위젯 메모리(약 30MB)를 넘지 않게 작게 */
const DRAW_W = 320;
const SHOT_W = 600;
/** 사진·폰트가 다 그려질 때까지 기다리는 시간 */
const SETTLE_MS = 700;
/** 찍기가 이보다 오래 걸리면 그 기록은 건너뛴다 (멈춰서 위젯이 영영 비지 않게) */
const CAPTURE_TIMEOUT_MS = 8000;
const MANIFEST_KEY = 'recoco.widget.shots.v1';

type Manifest = Record<string, { key: string; uri: string }>;

// 위젯 모듈이 없는 옛 빌드(OTA 로 이 코드만 받은 앱)에서는 아무것도 안 한다 — 불러오기만 해도 꺼지니까 미리 확인하고 늦게 부른다
type WidgetsApi = { dir: string; widgets: { updateSnapshot(props: WidgetProps): void }[] };
const api: WidgetsApi | null = (() => {
  if (!requireOptionalNativeModule('ExpoWidgets')) return null;
  try {
    const { widgetsDirectory } = require('expo-widgets') as typeof import('expo-widgets');
    const { RollWidget, SmallWidget } = require('../widgets/RecordWidgets') as typeof import('../widgets/RecordWidgets');
    return { dir: widgetsDirectory, widgets: [SmallWidget, RollWidget] };
  } catch (e) {
    setWidgetStatus(`위젯 모듈을 못 불러왔어요: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
})();

/** 이 앱에 위젯 기능이 들어 있는지 (새 빌드부터) */
export const hasWidgets = !!api;

/** 기록 내용이 바뀌었는지 보는 짧은 지문 */
function keyOf(r: RecoRecord) {
  const s = JSON.stringify(r);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('시간 초과')), ms))]);
}

export function WidgetShots({ records }: { records: RecoRecord[] }) {
  const picks = useWidgetPicks();
  const names = useWidgetPickNames();
  const bg = useWidgetBg();
  const calib = useWidgetCalib();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ref = useRef<View>(null);
  const pushed = useRef('');
  const failed = useRef(0);

  useEffect(() => {
    if (!api) return;
    initWidgetPicks().catch(() => {});
    initWidgetBg().catch(() => {});
    AsyncStorage.getItem(MANIFEST_KEY)
      .then((raw) => setManifest(raw ? (JSON.parse(raw) as Manifest) : {}))
      .catch(() => setManifest({}));
  }, []);

  const picked = useMemo(() => picks.map((id) => records.find((r) => r.id === id)).filter((r): r is RecoRecord => !!r), [picks, records]);
  const wanted = useMemo(() => {
    const map = new Map<string, RecoRecord>();
    for (const r of picked) map.set(r.id, r);
    return [...map.values()];
  }, [picked]);

  // 다음에 구울 기록 (없거나 내용이 바뀐 것)
  const job = manifest ? wanted.find((r) => manifest[r.id]?.key !== keyOf(r)) : undefined;
  const left = manifest ? wanted.filter((r) => manifest[r.id]?.key !== keyOf(r)).length : 0;

  // 굽고 → 공용 폴더로 옮기고 → 목록 갱신 (그러면 다음 job 으로 넘어간다)
  useEffect(() => {
    if (!api || !job || !size || !manifest) return;
    let alive = true;
    const timer = setTimeout(async () => {
      const key = keyOf(job);
      const next: Manifest = { ...manifest };
      try {
        const tmp = await withTimeout(
          captureRef(ref, {
            format: 'png',
            result: 'tmpfile',
            width: SHOT_W,
            height: Math.round((SHOT_W * size.height) / size.width),
          }),
          CAPTURE_TIMEOUT_MS,
        );
        const dir = new Directory(api!.dir);
        if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
        const dest = new File(dir, `${job.id}-${key}.png`);
        if (dest.exists) dest.delete();
        new File(tmp.startsWith('file://') ? tmp : `file://${tmp}`).move(dest);
        const old = manifest[job.id];
        if (old?.uri && old.uri !== dest.uri) {
          try {
            new File(old.uri).delete();
          } catch {}
        }
        next[job.id] = { key, uri: dest.uri };
      } catch (e) {
        // 못 찍은 기록은 이번 실행에서는 건너뛴다 (지문만 남겨 무한 반복을 막는다, 그림은 없음)
        failed.current += 1;
        setWidgetStatus(`그림 굽기 실패 ${failed.current}장: ${errText(e)}`);
        next[job.id] = { key, uri: '' };
      }
      if (!alive) return;
      setSize(null);
      setManifest(next);
      AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(next)).catch(() => {});
    }, SETTLE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [job, size, manifest]);

  // 안 쓰는 그림 지우기 (다 구운 뒤에)
  useEffect(() => {
    if (!manifest || job) return;
    const keep = new Set(wanted.map((r) => r.id));
    const stale = Object.keys(manifest).filter((id) => !keep.has(id));
    if (!stale.length) return;
    const next = { ...manifest };
    for (const id of stale) {
      try {
        if (next[id].uri) new File(next[id].uri).delete();
      } catch {}
      delete next[id];
    }
    setManifest(next);
    AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(next)).catch(() => {});
  }, [manifest, job, wanted]);

  // 구운 만큼 위젯에 넘긴다 (바뀐 게 있을 때만). 아직 굽는 중이면 빈 위젯에 몇 장 남았는지 보인다
  useEffect(() => {
    if (!api || !manifest) return;
    const uriOf = (r: RecoRecord) => {
      const m = manifest[r.id];
      return m && m.key === keyOf(r) ? m.uri : '';
    };
    const props: WidgetProps = {
      picked: picked.map((r) => ({ id: r.id, title: names[r.id] || defaultPickName(r), uri: uriOf(r) })).filter((p) => !!p.uri),
      index: 0,
      // 못 구운 게 있으면 그 까닭을 빈 위젯에 그대로 띄운다 (기기에서 원인 찾기용)
      status: left ? `기록 그림을 만드는 중이에요 (${left}장 남음)` : failed.current ? widgetStatus() : '',
      bg,
      calib,
    };
    const sig = JSON.stringify(props);
    if (sig === pushed.current) return;
    pushed.current = sig;
    try {
      api.widgets.forEach((w) => w.updateSnapshot(props));
      const bgText = [bg.small && '작은', bg.large && '큰'].filter(Boolean).join('·');
      const at = new Date().toTimeString().slice(0, 8);
      if (!failed.current)
        setWidgetStatus(`${at} 위젯에 넘김: ${props.picked.length}장${left ? ` · ${left}장 굽는 중` : ''}${bgText ? ` · 배경 ${bgText}` : ''}${calib ? ' · 하얀 판' : ''}`);
    } catch (e) {
      setWidgetStatus(`위젯에 넘기기 실패: ${errText(e)}`);
    }
  }, [manifest, left, picked, names, bg, calib]);

  if (!api || !job) return null;
  return (
    <View style={styles.stage} pointerEvents="none">
      {/* 바탕 없이 영수증만 — 위젯의 투명 바탕에서 모양 그대로 보이게 */}
      <View
        key={job.id}
        ref={ref}
        collapsable={false}
        style={{ width: DRAW_W }}
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        <RecordPaper record={job} width={DRAW_W} />
      </View>
      {/* 굽는 동안 보이지 않게 홈 바탕색으로 덮는다 (찍기는 영수증 뷰만 따로 그려서 덮개는 안 찍힌다) */}
      <View style={styles.cover} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', top: 0, left: 0 },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.orange },
});
