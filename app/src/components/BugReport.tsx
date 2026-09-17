import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_VERSION, BUG_TYPES, SUPPORT_EMAIL, sendBugReport } from '../lib/support';
import { COLORS, FONTS } from '../theme';

interface Props {
  visible: boolean;
  recordCount: number;
  onClose: () => void;
}

/** 버그 신고: 종류를 고르고 적으면 메일 앱이 내용과 기기 정보를 채워서 열린다 */
export function BugReport({ visible, recordCount, onClose }: Props) {
  const [type, setType] = useState<string>(BUG_TYPES[0]);
  const [detail, setDetail] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setType(BUG_TYPES[0]);
    setDetail('');
    setNotice('');
  }, [visible]);

  const send = async () => {
    setNotice('');
    const opened = await sendBugReport(type, detail, recordCount);
    if (opened) onClose();
    else setNotice(`메일 앱을 열 수 없어요. ${SUPPORT_EMAIL} 로 보내주세요.`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>버그 신고</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>어떤 문제인가요?</Text>
            <View style={styles.types}>
              {BUG_TYPES.map((t) => {
                const on = t === type;
                return (
                  <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>무슨 일이 있었나요?</Text>
            <TextInput
              style={styles.input}
              value={detail}
              onChangeText={setDetail}
              multiline
              placeholder={'어떤 화면에서, 무엇을 눌렀을 때 생겼는지 적어주면\n빨리 고칠 수 있어요.'}
              placeholderTextColor={COLORS.placeholder}
            />
            <Text style={styles.help}>
              보내기를 누르면 메일 앱이 열려요. 스크린샷이 있다면 메일에 붙여주세요.{'\n'}앱 버전({APP_VERSION})과 기기 종류가 함께 적혀요. 기록 내용은
              보내지 않아요.
            </Text>
            {!!notice && <Text style={styles.notice}>{notice}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>

        <Pressable onPress={send} style={({ pressed }) => [styles.send, pressed && { opacity: 0.85 }]}>
          <Text style={styles.sendText}>메일로 보내기</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  body: { paddingHorizontal: 18, paddingBottom: 24, gap: 10 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold, marginTop: 6 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.surface },
  chipOn: { backgroundColor: COLORS.orange },
  chipText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  chipTextOn: { color: '#fff' },
  input: {
    minHeight: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
    textAlignVertical: 'top',
  },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18 },
  notice: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  send: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
});
