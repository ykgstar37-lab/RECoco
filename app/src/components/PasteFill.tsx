import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OcrUnavailable, readImageText } from '../lib/ocr';
import { COLORS, FONTS } from '../theme';

export interface PasteRow {
  label: string;
  value: string;
  strong?: boolean;
}

interface Props<T> {
  visible: boolean;
  title: string;
  help: string;
  placeholder: string;
  /** 읽지 못하면 null */
  parse: (text: string) => T | null;
  rows: (result: T) => PasteRow[];
  warning?: (result: T) => string | null;
  failMessage: string;
  onClose: () => void;
  onFill: (result: T) => void;
}

/** 문자·알림을 붙여넣거나 캡처를 고르면 바로 읽은 내용을 보여주고, 그대로 기록을 채운다 */
export function PasteFill<T>({ visible, title, help, placeholder, parse, rows, warning, failMessage, onClose, onFill }: Props<T>) {
  const [text, setText] = useState('');
  const [reading, setReading] = useState(false);
  const [ocrNotice, setOcrNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setText('');
    setOcrNotice('');
  }, [visible]);

  // 알림·앱 화면 캡처에서 글자를 읽어 칸에 넣는다 (그다음은 붙여넣기와 똑같이)
  const fromScreenshot = async () => {
    setOcrNotice('');
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (picked.canceled || !picked.assets[0]) return;
    setReading(true);
    try {
      const found = await readImageText(picked.assets[0].uri);
      if (found.trim()) setText(found);
      else setOcrNotice('캡처에서 글자를 찾지 못했어요.');
    } catch (e) {
      setOcrNotice(e instanceof OcrUnavailable ? '캡처 읽기는 레코코 앱 설치 버전(개발 빌드)에서 돼요. 지금은 글자를 붙여넣어 주세요.' : '캡처를 읽지 못했어요.');
    } finally {
      setReading(false);
    }
  };

  const result = text.trim() ? parse(text) : null;
  const warn = result && warning ? warning(result) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.help}>{help}</Text>
            <Pressable onPress={fromScreenshot} disabled={reading} style={({ pressed }) => [styles.shot, pressed && { opacity: 0.8 }]}>
              {reading ? <ActivityIndicator color={COLORS.orange} /> : <Text style={styles.shotText}>📷  캡처에서 읽기</Text>}
            </Pressable>
            {!!ocrNotice && <Text style={styles.warn}>{ocrNotice}</Text>}
            <TextInput style={styles.input} value={text} onChangeText={setText} multiline autoFocus placeholder={placeholder} placeholderTextColor={COLORS.placeholder} />

            {!!text.trim() &&
              (result ? (
                <View style={styles.card}>
                  {!!warn && <Text style={styles.warn}>{warn}</Text>}
                  {rows(result).map((r) => (
                    <View key={r.label} style={styles.row}>
                      <Text style={styles.rowLabel}>{r.label}</Text>
                      <Text style={[styles.rowValue, r.strong && styles.rowStrong]} numberOfLines={1}>
                        {r.value || '(못 찾았어요)'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.warn}>{failMessage}</Text>
              ))}
          </ScrollView>
        </KeyboardAvoidingView>

        <Pressable
          disabled={!result}
          onPress={() => result && onFill(result)}
          style={({ pressed }) => [styles.fill, !result && styles.fillOff, pressed && { opacity: 0.85 }]}>
          <Text style={[styles.fillText, !result && styles.fillTextOff]}>이 내용으로 채우기</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 20, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 18, paddingBottom: 24, gap: 12 },
  help: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sans, lineHeight: 20 },
  shot: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.orangeSoft, minWidth: 130, alignItems: 'center' },
  shotText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  input: {
    minHeight: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
    textAlignVertical: 'top',
  },
  card: { borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.orange, backgroundColor: COLORS.orangeSoft, padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { width: 44, color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold },
  rowValue: { flex: 1, color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sans },
  rowStrong: { fontSize: 18, fontFamily: FONTS.sansHeavy },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  fill: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  fillOff: { backgroundColor: COLORS.surface },
  fillText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  fillTextOff: { color: COLORS.sub },
});
