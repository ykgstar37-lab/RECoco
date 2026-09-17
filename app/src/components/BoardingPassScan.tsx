import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { airportOf } from '../lib/airports';
import { BoardingPass, parseBoardingPass } from '../lib/boardingPass';
import { bump } from '../lib/haptics';
import { COLORS, FONTS } from '../theme';
import { ModalSafeArea } from './ModalSafeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFound: (pass: BoardingPass) => void;
}

const city = (code: string) => airportOf(code)?.city ?? code;

/** 모바일·종이 탑승권의 바코드를 찍어 여행 기록을 채운다 */
export function BoardingPassScan({ visible, onClose, onFound }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [pass, setPass] = useState<BoardingPass | null>(null);
  const [message, setMessage] = useState('');
  const lastCode = useRef('');

  useEffect(() => {
    if (!visible) return;
    setPass(null);
    setMessage('');
    lastCode.current = '';
  }, [visible]);

  const read = (data: string) => {
    if (pass || data === lastCode.current) return;
    lastCode.current = data;
    const parsed = parseBoardingPass(data);
    if (parsed) {
      bump();
      setPass(parsed);
      setMessage('');
    } else {
      setMessage('탑승권 바코드가 아니에요. 탑승권의 네모난 바코드를 비춰주세요.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.headerBtn}>닫기</Text>
          </Pressable>
          <Text style={styles.title}>탑승권으로 채우기</Text>
          <View style={{ width: 32 }} />
        </View>

        {!permission?.granted ? (
          <View style={styles.center}>
            <Text style={styles.body}>탑승권 바코드를 찍으려면 카메라 권한이 필요해요.</Text>
            <Pressable style={styles.primary} onPress={requestPermission}>
              <Text style={styles.primaryText}>카메라 허용하기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['pdf417', 'aztec', 'qr', 'datamatrix'] }}
              onBarcodeScanned={pass ? undefined : (r) => read(r.data)}
            />
            <View pointerEvents="none" style={styles.aim} />
            <Text style={styles.aimText}>항공사 앱·지갑의 모바일 탑승권이나{'\n'}종이 탑승권의 바코드를 네모 안에 맞춰주세요</Text>
          </View>
        )}

        <View style={styles.panel}>
          {pass ? (
            <>
              <View style={styles.route}>
                <View style={styles.port}>
                  <Text style={styles.code}>{pass.from}</Text>
                  <Text style={styles.city}>{city(pass.from)}</Text>
                </View>
                <Text style={styles.plane}>✈</Text>
                <View style={styles.port}>
                  <Text style={styles.code}>{pass.to}</Text>
                  <Text style={styles.city}>{city(pass.to)}</Text>
                </View>
              </View>
              <Text style={styles.detail}>
                {[pass.flight, pass.date?.replace(/-/g, '.'), pass.seat && `좌석 ${pass.seat}`, pass.name].filter(Boolean).join('  ·  ')}
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={[styles.secondary, { flex: 1 }]}
                  onPress={() => {
                    setPass(null);
                    lastCode.current = '';
                  }}>
                  <Text style={styles.secondaryText}>다시 찍기</Text>
                </Pressable>
                <Pressable style={[styles.primary, { flex: 2 }]} onPress={() => onFound(pass)}>
                  <Text style={styles.primaryText}>이 탑승권으로 채우기</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={message ? styles.warn : styles.help}>
              {message || (Platform.OS === 'web' ? '웹에서는 카메라로 탑승권 바코드가 잘 안 읽혀요. 폰에서 해주세요.' : '게이트는 바코드에 없어서 채운 뒤 직접 적어주세요.')}
            </Text>
          )}
        </View>
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
  aim: { width: 290, height: 200, borderRadius: 18, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  aimText: { color: '#fff', marginTop: 18, fontSize: 14, fontFamily: FONTS.sansBold, textAlign: 'center', lineHeight: 21 },
  panel: { padding: 16, gap: 12, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.line },
  body: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, textAlign: 'center' },
  help: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center' },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold, textAlign: 'center' },
  route: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 },
  port: { alignItems: 'center' },
  code: { color: COLORS.ink, fontSize: 30, fontFamily: FONTS.sansHeavy, letterSpacing: 2 },
  city: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  plane: { color: COLORS.orange, fontSize: 22 },
  detail: { color: COLORS.ink, fontSize: 13, fontFamily: FONTS.sans, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { backgroundColor: COLORS.orange, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  secondary: { backgroundColor: COLORS.surface, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  secondaryText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
});
