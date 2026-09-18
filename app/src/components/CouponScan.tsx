import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { bump } from '../lib/haptics';
import { COLORS, FONTS } from '../theme';
import { KEYBOARD_DONE_ID, KeyboardDone } from './KeyboardDone';
import { ModalSafeArea } from './ModalSafeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFound: (code: string) => void;
}

/** 교환권 번호 4자리씩 띄우기 */
export const formatCoupon = (code: string) => code.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

/** 모바일 교환권 바코드를 찍어 진짜 교환권 번호를 가져온다 (화면 캡처를 다른 폰으로 띄워 찍어도 됨) */
export function CouponScan({ visible, onClose, onFound }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState('');
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState('');
  const last = useRef('');

  useEffect(() => {
    if (!visible) return;
    setCode('');
    setTyped('');
    setMessage('');
    last.current = '';
  }, [visible]);

  const read = (data: string) => {
    if (code || data === last.current) return;
    last.current = data;
    const digits = data.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 24) {
      bump();
      setCode(digits);
      setMessage('');
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
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['code128', 'ean13', 'itf14', 'code39', 'code93', 'codabar', 'upc_a', 'qr', 'pdf417'] }}
              onBarcodeScanned={code ? undefined : (r) => read(r.data)}
            />
            <View pointerEvents="none" style={styles.aim} />
            <Text style={styles.aimText}>교환권의 바코드를 네모 안에 맞춰주세요</Text>
          </Pressable>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.panel}>
          {code ? (
            <>
              <Text style={styles.code}>{formatCoupon(code)}</Text>
              <View style={styles.row}>
                <Pressable
                  style={[styles.secondary, { flex: 1 }]}
                  onPress={() => {
                    setCode('');
                    last.current = '';
                  }}>
                  <Text style={styles.secondaryText}>다시 찍기</Text>
                </Pressable>
                <Pressable style={[styles.primary, { flex: 2 }]} onPress={() => onFound(code)}>
                  <Text style={styles.primaryText}>이 번호 쓰기</Text>
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
  panel: { padding: 16, gap: 10, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.line },
  body: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, textAlign: 'center' },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
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
