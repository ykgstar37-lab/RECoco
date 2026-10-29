// 홈 화면 위젯에 띄울 기록 그림을 굽는다 (iOS).
// 위젯은 앱의 양식 코드를 못 돌리므로, 앱이 영수증을 화면 뒤에 몰래 그려 PNG 로 찍고
// 앱·위젯 공용 폴더(widgetsDirectory)에 넣은 뒤 그 경로를 위젯에 넘긴다.
//  - 최근 기록 RECENT 장 + 크게 보기에서 '위젯에 넣기' 한 기록
//  - 기록 내용이 바뀌면(고치기) 다시 굽는다. 안 쓰는 그림은 지운다
// 화면 오른쪽 바깥에 그린다 — 찍기는 그 뷰만 따로 그려서 화면 밖이어도 된다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { initWidgetPicks, useWidgetPicks } from '../lib/widgetPicks';
import { RecordPaper } from '../templates';
import type { RecoRecord } from '../types';
import { RollWidget, SmallWidget } from '../widgets/RecordWidgets';

/** 최근 기록 몇 장까지 */
const RECENT = 12;
/** 그릴 폭(pt)과 구운 그림 폭(px) — 위젯 메모리(약 30MB)를 넘지 않게 작게 */
const DRAW_W = 320;
const SHOT_W = 600;
/** 사진·폰트가 다 그려질 때까지 기다리는 시간 */
const SETTLE_MS = 700;
const MANIFEST_KEY = 'recoco.widget.shots.v1';

type Manifest = Record<string, { key: string; uri: string }>;

/** 기록 내용이 바뀌었는지 보는 짧은 지문 */
function keyOf(r: RecoRecord) {
  const s = JSON.stringify(r);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const byNewest = (a: RecoRecord, b: RecoRecord) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function WidgetShots({ records }: { records: RecoRecord[] }) {
  const picks = useWidgetPicks();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const ref = useRef<View>(null);
  const pushed = useRef('');

  useEffect(() => {
    initWidgetPicks().catch(() => {});
    AsyncStorage.getItem(MANIFEST_KEY)
      .then((raw) => setManifest(raw ? (JSON.parse(raw) as Manifest) : {}))
      .catch(() => setManifest({}));
  }, []);

  const recent = useMemo(() => [...records].sort(byNewest).slice(0, RECENT), [records]);
  const picked = useMemo(() => picks.map((id) => records.find((r) => r.id === id)).filter((r): r is RecoRecord => !!r), [picks, records]);
  const wanted = useMemo(() => {
    const map = new Map<string, RecoRecord>();
    for (const r of [...recent, ...picked]) map.set(r.id, r);
    return [...map.values()];
  }, [recent, picked]);

  // 다음에 구울 기록 (없거나 내용이 바뀐 것)
  const job = manifest ? wanted.find((r) => manifest[r.id]?.key !== keyOf(r)) : undefined;

  // 굽고 → 공용 폴더로 옮기고 → 목록 갱신 (그러면 다음 job 으로 넘어간다)
  useEffect(() => {
    if (!job || !size || !manifest) return;
    let alive = true;
    const timer = setTimeout(async () => {
      const key = keyOf(job);
      let next: Manifest = { ...manifest };
      try {
        const tmp = await captureRef(ref, {
          format: 'png',
          result: 'tmpfile',
          width: SHOT_W,
          height: Math.round((SHOT_W * size.height) / size.width),
        });
        const dir = new Directory(widgetsDirectory);
        if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
        const dest = new File(dir, `${job.id}-${key}.png`);
        if (dest.exists) dest.delete();
        new File(tmp).move(dest);
        const old = manifest[job.id];
        if (old && old.uri !== dest.uri) new File(old.uri).delete();
        next[job.id] = { key, uri: dest.uri };
      } catch {
        // 못 찍은 기록은 이번 실행에서는 건너뛴다 (지문만 남겨 무한 반복을 막는다, 그림은 없음)
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

  // 다 구웠으면: 안 쓰는 그림을 지우고 위젯에 넘긴다 (바뀐 게 있을 때만)
  useEffect(() => {
    if (!manifest || job) return;
    const keep = new Set(wanted.map((r) => r.id));
    const stale = Object.keys(manifest).filter((id) => !keep.has(id));
    if (stale.length) {
      const next = { ...manifest };
      for (const id of stale) {
        try {
          if (next[id].uri) new File(next[id].uri).delete();
        } catch {}
        delete next[id];
      }
      setManifest(next);
      AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(next)).catch(() => {});
      return;
    }
    const uriOf = (r: RecoRecord) => manifest[r.id]?.uri;
    const props = {
      recent: recent.map(uriOf).filter((u): u is string => !!u),
      picked: picked.map(uriOf).filter((u): u is string => !!u),
      index: 0,
    };
    const sig = JSON.stringify(props);
    if (sig === pushed.current) return;
    pushed.current = sig;
    try {
      SmallWidget.updateSnapshot(props);
      RollWidget.updateSnapshot(props);
    } catch {}
  }, [manifest, job, wanted, recent, picked]);

  if (!job) return null;
  return (
    <View style={styles.stage} pointerEvents="none">
      {/* 바탕 없이 영수증만 — 위젯의 투명 모드에서 모양 그대로 보이게 */}
      <View
        key={job.id}
        ref={ref}
        collapsable={false}
        style={{ width: DRAW_W }}
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        <RecordPaper record={job} width={DRAW_W} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', top: 0, left: 10000 },
});
