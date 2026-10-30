// 위젯 배경 맞추기 (iOS, 기본 모양) — 설정에서 연다. 원리는 lib/widgetBg.ts
//  1) 위젯을 하얀 판으로 바꾼다  2) 위젯이 보이는 홈 화면 + 아이콘 없는 빈 페이지를 각각 스크린샷
//  3) 두 장을 고르면 웹뷰(캔버스)가 앞 장에서 하얀 판 자리를 찾고(lib/widgetPanels.ts) 뒷 장에서 그만큼 잘라 준다
import { Directory, File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { withBusy } from '../lib/busy';
import { setWidgetBg, setWidgetCalib, useWidgetBg, useWidgetCalib, type WidgetBg } from '../lib/widgetBg';
import { FIND_PANELS_JS } from '../lib/widgetPanels';
import { widgetStatus, widgetsAvailable } from '../lib/widgetPicks';
import { COLORS, FONTS } from '../theme';
import { LoadingOverlay } from './Loading';

/** 잘라 낸 결과 (data:image/jpeg;base64,… ) 또는 못 한 까닭 */
type CropResult = { ok: true; small?: string; large?: string } | { ok: false; error: string };

const ERRORS: Record<string, string> = {
  count: '스크린샷 두 장을 골라 주세요.',
  none: '하얀 위젯이 보이는 스크린샷을 못 찾았어요. 위젯이 하얗게 바뀐 뒤에 찍었는지 확인해 주세요.',
  both: '두 장 모두 위젯이 보여요. 한 장은 아이콘 없는 빈 페이지에서 찍어 주세요.',
  size: '두 스크린샷의 크기가 달라요. 같은 폰에서 찍은 스크린샷을 골라 주세요.',
  timeout: '시간이 너무 오래 걸렸어요. 다시 해 주세요.',
};

/** 두 그림 중 하얀 판이 보이는 쪽에서 자리를 찾고, 다른 쪽(빈 페이지)에서 잘라 돌려준다 */
const cropHtml = (a: string, b: string) => `<!doctype html><html><body><script>
${FIND_PANELS_JS}
var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
var load = function (src) {
  return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej('load'); }; i.src = src; });
};
var pixels = function (img) {
  var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height).data;
};
Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]).then(function (imgs) {
  var W = imgs[0].naturalWidth, H = imgs[0].naturalHeight;
  if (imgs[1].naturalWidth !== W || imgs[1].naturalHeight !== H) throw 'size';
  var f0 = findPanels(pixels(imgs[0]), W, H), f1 = findPanels(pixels(imgs[1]), W, H);
  if (f0.length && f1.length) throw 'both';
  if (!f0.length && !f1.length) throw 'none';
  var panels = f0.length ? f0 : f1, wall = f0.length ? imgs[1] : imgs[0];
  var small = panels.filter(function (p) { return p.w < W * 0.55 && Math.abs(p.w - p.h) < p.w * 0.12; })[0];
  var large = panels.filter(function (p) { return p.w > W * 0.7 && p.h > p.w * 0.8; })[0];
  if (!small && !large) throw 'none';
  var crop = function (p) {
    if (!p) return undefined;
    var c = document.createElement('canvas'); c.width = p.w; c.height = p.h;
    c.getContext('2d').drawImage(wall, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
    return c.toDataURL('image/jpeg', 0.92);
  };
  post({ ok: true, small: crop(small), large: crop(large) });
}).catch(function (e) { post({ ok: false, error: String(e) }); });
</script></body></html>`;

const mimeOf = (uri: string) => (/\.png$/i.test(uri) ? 'image/png' : 'image/jpeg');

/** 잘라 낸 그림을 위젯 공용 폴더에 넣고 경로를 돌려준다 (예전 그림은 지운다) */
function saveCrop(dataUrl: string | undefined, name: 'small' | 'large', old: string | undefined) {
  if (!dataUrl) return old;
  const { widgetsDirectory } = require('expo-widgets') as typeof import('expo-widgets');
  const dir = new Directory(widgetsDirectory!);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `bg-${name}-${Date.now()}.jpg`);
  dest.create({ overwrite: true });
  dest.write(dataUrl.replace(/^data:[^,]+,/, ''), { encoding: 'base64' });
  if (old) {
    try {
      new File(old).delete();
    } catch {}
  }
  return dest.uri;
}

export function WidgetBgSetup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const bg = useWidgetBg();
  const calib = useWidgetCalib();
  const [html, setHtml] = useState('');
  const [notice, setNotice] = useState('');
  const resolve = useRef<((r: CropResult) => void) | null>(null);

  const close = () => {
    setWidgetCalib(false);
    setNotice('');
    onClose();
  };

  const pickShots = () =>
    withBusy(async () => {
      setNotice('');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 2, quality: 1 });
      if (res.canceled) return;
      if (res.assets.length !== 2) return setNotice(ERRORS.count);
      const [a, b] = await Promise.all(res.assets.map(async (x) => `data:${mimeOf(x.uri)};base64,${await new File(x.uri).base64()}`));
      const result = await new Promise<CropResult>((done) => {
        resolve.current = done;
        setHtml(cropHtml(a, b));
        setTimeout(() => done({ ok: false, error: 'timeout' }), 30000);
      });
      resolve.current = null;
      setHtml('');
      if (!result.ok) return setNotice(ERRORS[result.error] ?? `앗, 맞추지 못했어요 (${result.error})`);
      const next: WidgetBg = { small: saveCrop(result.small, 'small', bg.small), large: saveCrop(result.large, 'large', bg.large) };
      setWidgetBg(next);
      setWidgetCalib(false);
      const found = [result.small && '작은 위젯', result.large && '큰 위젯'].filter(Boolean).join(' · ');
      setNotice(`맞췄어요 (${found}). 홈 화면에서 확인해 보세요!`);
    });

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      resolve.current?.(JSON.parse(e.nativeEvent.data) as CropResult);
    } catch {
      resolve.current?.({ ok: false, error: 'parse' });
    }
  };

  const clearBg = () => {
    for (const uri of [bg.small, bg.large]) {
      try {
        if (uri) new File(uri).delete();
      } catch {}
    }
    setWidgetBg({});
    setNotice('배경을 지웠어요.');
  };

  if (!widgetsAvailable) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>위젯 배경 맞추기</Text>
          <Pressable onPress={close} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.lead}>
            아이폰 기본 모양에서는 위젯 밑에 흰 판이 깔려요. 배경화면에서 위젯 자리만큼 잘라 깔면 영수증만 배경화면 위에 떠 있는 것처럼 보여요.
          </Text>

          <View style={styles.steps}>
            <Step n={1} on={!calib} text="아래 '위젯 하얗게 만들기' 를 눌러요. 홈 화면의 레코코 위젯이 하얀 판으로 바뀌어요." />
            <Step n={2} on={calib} text="홈 화면으로 나가서, 하얀 위젯이 보이는 화면을 스크린샷 찍어요." />
            <Step n={3} on={calib} text="홈 화면 빈 곳을 길게 눌러 맨 오른쪽 빈 페이지로 넘긴 뒤, 아이콘 없이 배경화면만 보이게 한 장 더 찍어요." />
            <Step n={4} on={calib} text="레코코로 돌아와 '스크린샷 두 장 고르기' 를 눌러요." />
          </View>

          <Pressable
            onPress={() => (calib ? pickShots() : (setWidgetCalib(true), setNotice('')))}
            style={({ pressed }) => [styles.main, pressed && { opacity: 0.85 }]}>
            <Text style={styles.mainText}>{calib ? '스크린샷 두 장 고르기' : '위젯 하얗게 만들기'}</Text>
          </Pressable>
          {!!notice && <Text style={styles.notice}>{notice}</Text>}

          <Text style={styles.help}>
            배경화면을 바꾸거나 위젯을 다른 자리로 옮기면 다시 맞춰 주세요. 같은 크기 위젯이 여러 개면 모두 같은 그림이 깔려요. 투명·색조 모양에서는 깔지 않아요.
          </Text>
          {/* 잘라 둔 그림과 위젯에 넘긴 상태 — 위젯에 안 뜰 때 어디서 막혔는지 보려고 */}
          {(bg.small || bg.large) && (
            <View style={styles.previewRow}>
              {bg.small && <Image source={{ uri: bg.small }} style={styles.previewSmall} />}
              {bg.large && <Image source={{ uri: bg.large }} style={styles.previewLarge} />}
            </View>
          )}
          {!!notice && <Text style={styles.help}>위젯 상태: {widgetStatus()}</Text>}
          {(bg.small || bg.large) && (
            <Pressable onPress={clearBg} hitSlop={8} style={styles.sub}>
              <Text style={styles.subText}>맞춘 배경 지우기</Text>
            </Pressable>
          )}
        </ScrollView>

        {!!html && (
          <View style={styles.hidden} pointerEvents="none">
            <WebView source={{ html }} originWhitelist={['*']} onMessage={onMessage} />
          </View>
        )}
        <LoadingOverlay />
      </SafeAreaView>
    </Modal>
  );
}

function Step({ n, text, on }: { n: number; text: string; on: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, on && styles.stepNumOn]}>
        <Text style={[styles.stepNumText, on && { color: '#fff' }]}>{n}</Text>
      </View>
      <Text style={[styles.stepText, !on && { color: COLORS.sub }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 22, paddingBottom: 32, gap: 18 },
  lead: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sans, lineHeight: 23 },
  steps: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 14 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  stepNumOn: { backgroundColor: COLORS.orange },
  stepNumText: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold },
  stepText: { flex: 1, color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, lineHeight: 21 },
  main: { backgroundColor: COLORS.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  mainText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  notice: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold, lineHeight: 21, textAlign: 'center' },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18 },
  sub: { alignSelf: 'center', paddingVertical: 6 },
  subText: { color: COLORS.sub, fontSize: 14, fontFamily: FONTS.sansBold, textDecorationLine: 'underline' },
  previewRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', justifyContent: 'center' },
  previewSmall: { width: 80, height: 80, borderRadius: 16 },
  previewLarge: { width: 160, height: 167, borderRadius: 20 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
