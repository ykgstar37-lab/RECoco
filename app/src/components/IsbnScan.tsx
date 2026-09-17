import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { bump } from '../lib/haptics';
import { BookHit, bookByIsbn, isIsbn13 } from '../lib/search';
import { COLORS, FONTS } from '../theme';
import { ModalSafeArea } from './ModalSafeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFound: (book: BookHit) => void;
}

/** 책 뒷표지 바코드(ISBN)를 찍어서 그 책 정보를 찾는다 */
export function IsbnScan({ visible, onClose, onFound }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [book, setBook] = useState<BookHit | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [typed, setTyped] = useState('');
  // 같은 바코드를 계속 비추는 동안 다시 처리하지 않도록
  const lastCode = useRef('');

  useEffect(() => {
    if (!visible) return;
    setBook(null);
    setBusy(false);
    setMessage('');
    setTyped('');
    lastCode.current = '';
  }, [visible]);

  const lookup = async (raw: string) => {
    const code = raw.replace(/[^0-9]/g, '');
    if (busy || book || code === lastCode.current) return;
    lastCode.current = code;
    if (!isIsbn13(code)) {
      setMessage('책 뒷면의 978·979로 시작하는 바코드를 비춰주세요.');
      return;
    }
    bump();
    setBusy(true);
    setMessage('');
    try {
      const found = await bookByIsbn(code);
      if (found) setBook(found);
      else setMessage(`ISBN ${code} 로는 책을 찾지 못했어요. 제목으로 검색해 주세요.`);
    } catch {
      setMessage('지금은 책을 찾을 수 없어요. 잠시 후 다시 해주세요.');
      lastCode.current = '';
    } finally {
      setBusy(false);
    }
  };

  const rescan = () => {
    setBook(null);
    setMessage('');
    lastCode.current = '';
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.headerBtn}>닫기</Text>
          </Pressable>
          <Text style={styles.title}>바코드로 책 찾기</Text>
          <View style={{ width: 32 }} />
        </View>

        {!permission?.granted ? (
          <View style={styles.center}>
            <Text style={styles.body}>책 바코드를 찍으려면 카메라 권한이 필요해요.</Text>
            <Pressable style={styles.primary} onPress={requestPermission}>
              <Text style={styles.primaryText}>카메라 허용하기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraBox}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
              onBarcodeScanned={book ? undefined : (r) => lookup(r.data)}
            />
            <View pointerEvents="none" style={styles.aim} />
            <Text style={styles.aimText}>책 뒷표지의 바코드를 네모 안에 맞춰주세요</Text>
          </View>
        )}

        <View style={styles.panel}>
          {busy && (
            <View style={styles.row}>
              <ActivityIndicator color={COLORS.orange} />
              <Text style={styles.body}>책을 찾는 중…</Text>
            </View>
          )}
          {book && (
            <View style={styles.card}>
              {book.thumbnail ? <Image source={{ uri: book.thumbnail }} style={styles.cover} /> : <View style={styles.cover} />}
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookSub} numberOfLines={2}>
                  {[book.author, book.publisher, book.year].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          )}
          {book ? (
            <View style={styles.row}>
              <Pressable style={[styles.secondary, { flex: 1 }]} onPress={rescan}>
                <Text style={styles.secondaryText}>다시 찍기</Text>
              </Pressable>
              <Pressable style={[styles.primary, { flex: 2 }]} onPress={() => onFound(book)}>
                <Text style={styles.primaryText}>이 책으로 채우기</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {!!message && <Text style={styles.warn}>{message}</Text>}
              <Text style={styles.label}>바코드가 안 읽히면 숫자를 직접 입력</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="978…"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="number-pad"
                  maxLength={17}
                />
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => {
                    lastCode.current = '';
                    lookup(typed);
                  }}>
                  <Text style={styles.primaryText}>찾기</Text>
                </Pressable>
              </View>
            </>
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
  // 바코드는 가로로 긴 네모
  aim: { width: 280, height: 150, borderRadius: 16, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  aimText: { color: '#fff', marginTop: 18, fontSize: 14, fontFamily: FONTS.sansBold },
  panel: { padding: 16, gap: 10, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.line },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  body: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans, textAlign: 'center' },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cover: { width: 48, height: 70, borderRadius: 4, backgroundColor: COLORS.surface },
  bookTitle: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  bookSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
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
