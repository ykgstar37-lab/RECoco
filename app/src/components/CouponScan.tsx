import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GiftShot, parseGiftShot } from '../lib/giftShot';
import { bump } from '../lib/haptics';
import { readImageDetail } from '../lib/ocr';
import { findGiftCrop } from '../lib/photoCrop';
import { persistPhoto } from '../lib/photos';
import { Photo } from '../types';
import { COLORS, FONTS } from '../theme';
import { KEYBOARD_DONE_ID, KeyboardDone } from './KeyboardDone';
import { ModalSafeArea } from './ModalSafeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 번호 + 같이 찍힌 화면에서 읽어낸 상품 정보(못 읽었으면 번호만) + 잘라낸 상품 그림 */
  onFound: (gift: GiftShot, photo: Photo | null) => void;
}

const numberOnly = (code: string): GiftShot => ({ item: '', brand: '', person: '', code, until: null });

/** 교환권 번호 4자리씩 띄우기 */
export const formatCoupon = (code: string) => code.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

/** 모바일 교환권 바코드를 찍어 진짜 교환권 번호를 가져온다 (화면 캡처를 다른 폰으로 띄워 찍어도 됨) */
export function CouponScan({ visible, onClose, onFound }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  const [gift, setGift] = useState<GiftShot | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [reading, setReading] = useState(false);
  const last = useRef('');
  const cam = useRef<CameraView>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setCode('');
    setTyped('');
    setMessage('');
    setGift(null);
    setPhoto(null);
    setReading(false);
    last.current = '';
    ready.current = false;
  }, [visible]);

  // 바코드에는 번호만 들어 있어서, 바코드를 찾은 그 화면을 한 장 찍어 무슨 선물인지도 읽는다
  const readAround = async (found: string) => {
    if (!cam.current || !ready.current) return;
    setReading(true);
    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.9, shutterSound: false });
      if (!shot?.uri) return;
      const { lines } = await readImageDetail(shot.uri);
      const parsed = parseGiftShot(lines.map((l) => l.text).join('\n'));
      if (!parsed?.item) return;
      // 눈으로 읽은 숫자보다 바코드로 읽은 번호가 정확하다
      const whole = { ...parsed, code: found };
      setGift(whole);
      const crop = findGiftCrop(lines, whole, shot.width, shot.height);
      if (crop) {
        const kept = await persistPhoto(shot.uri, shot.width, shot.height).catch(() => null);
        if (kept) setPhoto({ ...kept, crop });
      }
    } catch {
      // 글자를 못 읽어도 번호는 쓸 수 있으니 조용히 넘어간다 (Expo Go 에는 글자 읽기가 없다)
    } finally {
      setReading(false);
    }
  };

  const read = (data: string, fromCamera = false) => {
    if (code || data === last.current) return;
    last.current = data;
    const digits = data.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 24) {
      bump();
      setCode(digits);
      setMessage('');
      if (fromCamera) void readAround(digits);
    } else {
      setMessage('교환권 바코드가 아닌 것 같아요. 숫자가 적힌 바코드를 비춰주세요.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.headerBtn}>닫기</Text>
          </Pressable>
          <Text style={styles.title}>교환권 바코드 찍기</Text>
          <View style={{ width: 32 }} />
        </View>

        {!permission?.granted ? (
          <View style={styles.center}>
            <Text style={styles.body}>교환권 바코드를 찍으려면 카메라 권한이 필요해요.</Text>
            <Pressable style={styles.primary} onPress={requestPermission}>
              <Text style={styles.primaryText}>카메라 허용하기</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.cameraBox} onPress={() => Keyboard.dismiss()}>
            <CameraView
              ref={cam}
              style={StyleSheet.absoluteFill}
              onCameraReady={() => {
                ready.current = true;
              }}
              barcodeScannerSettings={{ barcodeTypes: ['code128', 'ean13', 'itf14', 'code39', 'code93', 'codabar', 'upc_a', 'qr', 'pdf417'] }}
              onBarcodeScanned={code ? undefined : (r) => read(r.data, true)}
            />
            <View pointerEvents="none" style={styles.aim} />
            <Text style={styles.aimText}>교환권의 바코드를 네모 안에 맞춰주세요</Text>
            <Text style={styles.aimSub}>상품 이름까지 화면에 다 들어오면 그것도 같이 읽어요</Text>
          </Pressable>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.panel}>
          {code ? (
            <>
              <Text style={styles.code}>{formatCoupon(code)}</Text>
              {reading ? (
                <View style={styles.readRow}>
                  <ActivityIndicator color={COLORS.orange} />
                  <Text style={styles.label}>무슨 선물인지 읽는 중…</Text>
                </View>
              ) : gift ? (
                <Text style={styles.found} numberOfLines={2}>
                  {gift.brand && gift.brand !== gift.item ? `${gift.brand} · ` : ''}
                  {gift.item}
                </Text>
              ) : (
                <Text style={styles.label}>번호만 찾았어요. 상품 이름은 기록에 직접 적어주세요.</Text>
              )}
              <View style={styles.row}>
                <Pressable
                  style={[styles.secondary, { flex: 1 }]}
                  onPress={() => {
                    setCode('');
                    setGift(null);
                    setPhoto(null);
                    last.current = '';
                  }}>
                  <Text style={styles.secondaryText}>다시 찍기</Text>
                </Pressable>
                <Pressable style={[styles.primary, { flex: 2 }]} disabled={reading} onPress={() => onFound(gift ?? numberOnly(code), photo)}>
                  <Text style={styles.primaryText}>{gift ? '이 내용 쓰기' : '이 번호 쓰기'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {!!message && <Text style={styles.warn}>{message}</Text>}
              <View style={styles.labelRow}>
                <Text style={styles.label}>바코드 아래 숫자를 직접 넣어도 돼요</Text>
                <Pressable
                  hitSlop={8}
                  onPress={async () => {
                    const copied = await Clipboard.getStringAsync().catch(() => '');
                    const digits = copied.replace(/\D/g, '');
                    if (!digits) return setMessage('복사한 번호가 없어요.');
                    Keyboard.dismiss();
                    setTyped(digits);
                    last.current = '';
                    read(digits);
                  }}>
                  <Text style={styles.pasteText}>붙여넣기</Text>
                </Pressable>
              </View>
              <View style={styles.row}>
                <TextInput
                  inputAccessoryViewID={KEYBOARD_DONE_ID}
                  style={styles.input}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="1234 5678 9012"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="number-pad"
                  maxLength={30}
                />
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => {
                    last.current = '';
                    read(typed);
                  }}>
                  <Text style={styles.primaryText}>확인</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
        </KeyboardAvoidingView>
        <KeyboardDone />
      </ModalSafeArea>
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
  aim: { width: 290, height: 140, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  aimText: { color: '#fff', marginTop: 18, fontSize: 14, fontFamily: FONTS.sansBold },
  aimSub: { color: 'rgba(255,255,255,0.75)', marginTop: 6, fontSize: 12, fontFamily: FONTS.sans },
  readRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  found: { color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansBold, textAlign: 'center' },
  panel: { padding: 16, gap: 10, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.line },
  body: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, textAlign: 'center' },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold, textAlign: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pasteText: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  code: { color: COLORS.ink, fontSize: 24, fontFamily: FONTS.sansHeavy, textAlign: 'center', letterSpacing: 1 },
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
  primary: { backgroundColor: COLORS.orange, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  secondary: { backgroundColor: COLORS.surface, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  secondaryText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  smallBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
});
