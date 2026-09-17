import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_VERSION, BUG_TYPES, MAX_REPORT_PHOTOS, ReportPhoto, canReport, pickReportPhotos, sendBugReport } from '../lib/support';
import { COLORS, FONTS } from '../theme';
import { CocoArt } from './Coco';
import { DISMISS_ON_DRAG, KEYBOARD_DONE_ID, KeyboardDone } from './KeyboardDone';

interface Props {
  visible: boolean;
  recordCount: number;
  onClose: () => void;
}

/** 버그 신고: 종류·내용·스크린샷을 적어 앱 안에서 바로 보낸다 */
export function BugReport({ visible, recordCount, onClose }: Props) {
  const [type, setType] = useState<string>(BUG_TYPES[0]);
  const [detail, setDetail] = useState('');
  const [contact, setContact] = useState('');
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setType(BUG_TYPES[0]);
    setDetail('');
    setContact('');
    setPhotos([]);
    setSent(false);
    setNotice('');
  }, [visible]);

  const addPhotos = async () => {
    const picked = await pickReportPhotos(MAX_REPORT_PHOTOS - photos.length);
    if (picked.length) setPhotos((p) => [...p, ...picked].slice(0, MAX_REPORT_PHOTOS));
  };

  const send = async () => {
    if (sending) return;
    if (!detail.trim()) return setNotice('어떤 일이 있었는지 적어주세요.');
    if (!canReport) return setNotice('신고 받는 곳이 아직 설정되지 않았어요.');
    setSending(true);
    setNotice('');
    try {
      await sendBugReport({ type, detail, contact, photos, recordCount });
      setSent(true);
    } catch {
      setNotice('보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.');
    } finally {
      setSending(false);
    }
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

        {sent ? (
          <View style={styles.done}>
            <CocoArt size={170} tone="orange" mood="happy" id="bug-thanks" />
            <Text style={styles.doneTitle}>보내줘서 고마워요!</Text>
            <Text style={styles.doneSub}>확인하고 빨리 고칠게요.</Text>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode={DISMISS_ON_DRAG}>
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
                inputAccessoryViewID={KEYBOARD_DONE_ID}
                style={styles.input}
                value={detail}
                onChangeText={setDetail}
                multiline
                placeholder={'어떤 화면에서, 무엇을 눌렀을 때 생겼는지 적어주면\n빨리 고칠 수 있어요.'}
                placeholderTextColor={COLORS.placeholder}
              />

              <Text style={styles.label}>
                스크린샷 ({photos.length}/{MAX_REPORT_PHOTOS})
              </Text>
              <View style={styles.photos}>
                {photos.map((p, i) => (
                  <View key={p.uri + i} style={styles.photo}>
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <Pressable hitSlop={8} style={styles.remove} onPress={() => setPhotos((all) => all.filter((_, j) => j !== i))} accessibilityLabel="사진 빼기">
                      <Text style={styles.removeText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_REPORT_PHOTOS && (
                  <Pressable onPress={addPhotos} style={[styles.photo, styles.addPhoto]} accessibilityLabel="스크린샷 추가">
                    <Text style={styles.addPhotoText}>＋</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.label}>답장 받을 이메일 (선택)</Text>
              <TextInput
                inputAccessoryViewID={KEYBOARD_DONE_ID}
                style={styles.line}
                value={contact}
                onChangeText={setContact}
                placeholder="coco@example.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.help}>앱 버전({APP_VERSION})과 기기 종류가 함께 보내져요. 기록 내용은 보내지 않아요.</Text>
              {!!notice && <Text style={styles.notice}>{notice}</Text>}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <KeyboardDone />
        <Pressable
          onPress={sent ? onClose : send}
          disabled={sending}
          style={({ pressed }) => [styles.send, (pressed || sending) && { opacity: 0.85 }]}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>{sent ? '닫기' : '보내기'}</Text>}
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
    minHeight: 140,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
    textAlignVertical: 'top',
  },
  line: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 15,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
  },
  photos: { flexDirection: 'row', gap: 8 },
  photo: { width: 84, height: 112, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.surface },
  addPhoto: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, borderStyle: 'dashed' },
  addPhotoText: { color: COLORS.sub, fontSize: 26 },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 15, lineHeight: 17 },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 18 },
  notice: { color: COLORS.danger, fontSize: 13, fontFamily: FONTS.sansBold },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 40 },
  doneTitle: { color: COLORS.ink, fontSize: 20, fontFamily: FONTS.sansHeavy, marginTop: 8 },
  doneSub: { color: COLORS.sub, fontSize: 14, fontFamily: FONTS.sans },
  send: { marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.orange, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
});
