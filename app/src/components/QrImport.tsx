import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import { downloadPhoto, pickPhotos, saveBase64Photo } from '../lib/photos';
import { COLORS, FONTS } from '../theme';
import { Photo } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** url: QR로 연 페이지 주소 (갤러리로 대체한 경우 '') */
  onPicked: (photo: Photo, url: string) => void;
}

interface Candidate {
  src: string;
  w: number;
  h: number;
}

/**
 * 포토부스 QR 페이지에서 사진을 찾아낸다.
 * 업체마다 페이지 구조가 달라서 특정 사이트에 맞추지 않고
 * "페이지에 보이는 큰 이미지 / 이미지 링크 / 배경 이미지"를 모두 후보로 모은다.
 */
const INJECTED = `
(function () {
  if (window.__recoco) return true;
  window.__recoco = true;
  var sent = {};
  function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return null; } }
  function scan() {
    var items = [];
    document.querySelectorAll('img').forEach(function (img) {
      var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      var src = img.currentSrc || img.src;
      if (src && w >= 240 && h >= 240) items.push({ src: src, w: w, h: h });
    });
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (/\\.(jpe?g|png|webp)(\\?|#|$)/i.test(a.href)) items.push({ src: a.href, w: 0, h: 0 });
    });
    document.querySelectorAll('*').forEach(function (el) {
      var bg = getComputedStyle(el).backgroundImage;
      var m = bg && /url\\(["']?([^"')]+)/.exec(bg);
      if (!m) return;
      var r = el.getBoundingClientRect();
      if (r.width >= 150 && r.height >= 150) items.push({ src: abs(m[1]), w: r.width, h: r.height });
    });
    var fresh = items.filter(function (it) {
      if (!it.src || sent[it.src] || /\\.svg(\\?|$)/i.test(it.src)) return false;
      sent[it.src] = 1;
      return true;
    });
    if (fresh.length) post({ type: 'candidates', items: fresh });
  }
  window.__recocoFetch = function (src) {
    fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { post({ type: 'data', src: src, dataUrl: fr.result }); };
      fr.readAsDataURL(b);
    }).catch(function (e) { post({ type: 'error', src: src, message: String(e) }); });
  };
  scan();
  setInterval(scan, 1200);
  return true;
})();
true;
`;

type Step = 'scan' | 'page';

export function QrImport({ visible, onClose, onPicked }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('scan');
  const [url, setUrl] = useState('');
  const [typed, setTyped] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const webRef = useRef<WebView>(null);
  const scanned = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setStep('scan');
    setUrl('');
    setTyped('');
    setCandidates([]);
    setBusy(false);
    setMessage('');
    setTimedOut(false);
    scanned.current = false;
  }, [visible]);

  useEffect(() => {
    if (step !== 'page') return;
    const t = setTimeout(() => setTimedOut(true), 9000);
    return () => clearTimeout(t);
  }, [step, url]);

  const openUrl = (raw: string) => {
    const u = raw.trim();
    if (!/^https?:\/\//i.test(u)) {
      setMessage('사진 페이지 링크(QR)가 아니에요. 포토부스 QR을 다시 비춰주세요.');
      scanned.current = false;
      return;
    }
    setMessage('');
    setUrl(u);
    setStep('page');
  };

  const onMessage = async (e: WebViewMessageEvent) => {
    let msg: { type: string; items?: Candidate[]; src?: string; dataUrl?: string; message?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'candidates' && msg.items) {
      setCandidates((prev) => [...prev, ...msg.items!].sort((a, b) => b.w * b.h - a.w * a.h));
    } else if (msg.type === 'data' && msg.dataUrl) {
      const m = /^data:([^;]+);base64,(.*)$/.exec(msg.dataUrl);
      if (!m) return fail();
      try {
        onPicked(await saveBase64Photo(m[2], m[1]), url);
      } catch {
        fail();
      }
    } else if (msg.type === 'error') {
      fail();
    }
  };

  const fail = () => {
    setBusy(false);
    setMessage('이 사진은 바로 가져오지 못했어요. 다른 사진을 고르거나, 저장 후 갤러리에서 골라주세요.');
  };

  const choose = async (c: Candidate) => {
    setBusy(true);
    setMessage('');
    if (/^https?:/i.test(c.src)) {
      try {
        onPicked(await downloadPhoto(c.src), url);
        return;
      } catch {
        // 쿠키가 필요한 페이지 등: 페이지 안에서 직접 읽어오기로 재시도
      }
    }
    webRef.current?.injectJavaScript(`window.__recocoFetch(${JSON.stringify(c.src)}); true;`);
  };

  const fromGallery = async () => {
    const [photo] = await pickPhotos(1);
    if (photo) onPicked(photo, url);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={step === 'page' ? () => setStep('scan') : onClose} hitSlop={10}>
            <Text style={styles.headerBtn}>{step === 'page' ? '다시 스캔' : '닫기'}</Text>
          </Pressable>
          <Text style={styles.title}>{step === 'scan' ? 'QR로 네컷 가져오기' : '앞면에 쓸 사진 고르기'}</Text>
          <View style={{ width: 56 }} />
        </View>

        {step === 'scan' && (
          <View style={{ flex: 1 }}>
            {!permission?.granted ? (
              <View style={styles.center}>
                <Text style={styles.body}>포토부스 QR을 찍으려면 카메라 권한이 필요해요.</Text>
                <Pressable style={styles.primary} onPress={requestPermission}>
                  <Text style={styles.primaryText}>카메라 허용하기</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cameraBox}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={(r) => {
                    if (scanned.current) return;
                    scanned.current = true;
                    openUrl(r.data);
                  }}
                />
                <View pointerEvents="none" style={styles.aim} />
                <Text style={styles.aimText}>사진 뒤에 있는 QR을 네모 안에 맞춰주세요</Text>
              </View>
            )}
            <View style={styles.panel}>
              {!!message && <Text style={styles.warn}>{message}</Text>}
              <Text style={styles.label}>링크가 있다면 붙여넣기</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="https://..."
                  placeholderTextColor={COLORS.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable style={styles.smallBtn} onPress={() => openUrl(typed)}>
                  <Text style={styles.primaryText}>열기</Text>
                </Pressable>
              </View>
              <Pressable onPress={fromGallery} hitSlop={8}>
                <Text style={styles.link}>QR이 만료됐나요? 갤러리에서 사진 고르기 →</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'page' && (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webRef}
              source={{ uri: url }}
              style={{ flex: 1 }}
              injectedJavaScript={INJECTED}
              onLoadEnd={() => webRef.current?.injectJavaScript(INJECTED)}
              onMessage={onMessage}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
            />
            <View style={styles.panel}>
              {busy ? (
                <View style={styles.row}>
                  <ActivityIndicator color={COLORS.orange} />
                  <Text style={styles.body}>사진을 가져오는 중…</Text>
                </View>
              ) : candidates.length > 0 ? (
                <>
                  <Text style={styles.label}>찾은 사진 {candidates.length}장 · 탭해서 선택</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {candidates.map((c) => (
                      <Pressable key={c.src} onPress={() => choose(c)} style={styles.thumb}>
                        {/^(https?|data):/i.test(c.src) ? (
                          <Image source={{ uri: c.src }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                          <Text style={styles.thumbText}>이미지</Text>
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <Text style={styles.body}>{timedOut ? '사진을 자동으로 찾지 못했어요.' : '페이지에서 사진을 찾는 중…'}</Text>
              )}
              {!!message && <Text style={styles.warn}>{message}</Text>}
              {(timedOut || !!message) && (
                <Pressable onPress={fromGallery} hitSlop={8}>
                  <Text style={styles.link}>페이지에서 사진을 저장한 뒤 갤러리에서 고르기 →</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  headerBtn: { color: COLORS.sub, fontSize: 15, fontFamily: FONTS.sans },
  title: { color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansBold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  cameraBox: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  aim: { width: 230, height: 230, borderRadius: 18, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  aimText: { color: '#fff', marginTop: 18, fontSize: 14, fontFamily: FONTS.sansBold },
  panel: { padding: 16, gap: 10, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.line },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  body: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, textAlign: 'center' },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  primary: { backgroundColor: COLORS.orange, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  smallBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  link: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
  thumb: {
    width: 76,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontSize: 11, color: COLORS.sub },
});
