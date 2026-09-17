import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardPayment, parseCardSms } from '../lib/cardSms';
import { won } from '../lib/format';
import { COLORS, FONTS } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onFill: (payment: CardPayment) => void;
}

const EXAMPLE = '[Web발신]\n○○카드 승인\n홍*동\n12,500원 일시불\n09/17 13:22\n달밤커피';

/** 카드 결제 문자를 붙여넣으면 가게·금액·날짜를 읽어서 소비 기록을 채운다 */
export function CardSmsPaste({ visible, onClose, onFill }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const result = text.trim() ? parseCardSms(text) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>카드 결제 문자로 채우기</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.help}>문자 앱에서 카드 승인 문자를 길게 눌러 복사한 뒤, 아래 칸을 길게 눌러 붙여넣어 주세요.</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              placeholder={EXAMPLE}
              placeholderTextColor={COLORS.placeholder}
            />

            {!!text.trim() &&
              (result ? (
                <View style={styles.card}>
                  {result.canceled && <Text style={styles.warn}>승인 취소 문자예요. 그래도 채울까요?</Text>}
                  <Row label="가게" value={result.store || '(못 찾았어요)'} />
                  <Row label="금액" value={`${won(result.amount)}원`} strong />
                  <Row label="날짜" value={result.date ? `${result.date.replace(/-/g, '.')}${result.time ? `  ${result.time}` : ''}` : '(못 찾았어요)'} />
                </View>
              ) : (
                <Text style={styles.warn}>결제 금액을 찾지 못했어요. 카드 승인 문자인지 확인해 주세요.</Text>
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowStrong]} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
  rowLabel: { width: 36, color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold },
  rowValue: { flex: 1, color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sans },
  rowStrong: { fontSize: 18, fontFamily: FONTS.sansHeavy },
  warn: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  fill: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  fillOff: { backgroundColor: COLORS.surface },
  fillText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  fillTextOff: { color: COLORS.sub },
});
