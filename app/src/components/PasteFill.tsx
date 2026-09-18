import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { OcrUnavailable, readImageText } from '../lib/ocr';
import { COLORS, FONTS } from '../theme';
import { DISMISS_ON_DRAG, KEYBOARD_DONE_ID, KeyboardDone } from './KeyboardDone';

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
  /** 캡처 한 장에 여러 건이 있을 수 있으면: 찾은 것 전부 (골라서 채운다) */
  parseAll?: (text: string) => T[];
  /** 여러 건 고르는 줄에 보여줄 글자 */
  optionLabel?: (result: T) => { title: string; sub: string };
  rows: (result: T) => PasteRow[];
  warning?: (result: T) => string | null;
  failMessage: string;
  onClose: () => void;
  onFill: (result: T) => void;
  /** 여러 건을 한꺼번에 기록할 수 있으면 (고른 것 전부) */
  onFillMany?: (results: T[]) => void;
}

/** 문자·알림을 붙여넣거나 캡처를 고르면 바로 읽은 내용을 보여주고, 그대로 기록을 채운다 */
export function PasteFill<T>({ visible, title, help, placeholder, parse, parseAll, optionLabel, rows, warning, failMessage, onClose, onFill, onFillMany }: Props<T>) {
  const [text, setText] = useState('');
  // 고른 줄 번호들 (여러 건 기록이 가능하면 여러 개)
  const [picked, setPicked] = useState<number[]>([0]);
  const [reading, setReading] = useState(false);
  const [ocrNotice, setOcrNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    setText('');
    setOcrNotice('');
    setPicked([0]);
  }, [visible]);

  // 알림·앱 화면 캡처에서 글자를 읽어 칸에 넣는다 (그다음은 붙여넣기와 똑같이)
  const fromScreenshot = async () => {
    setOcrNotice('');
    const shot = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (shot.canceled || !shot.assets[0]) return;
    setReading(true);
    try {
      const found = await readImageText(shot.assets[0].uri);
      if (found.trim()) {
        setText(found);
        setPicked([0]);
      } else {
        setOcrNotice('캡처에서 글자를 찾지 못했어요.');
      }
    } catch (e) {
      setOcrNotice(e instanceof OcrUnavailable ? '캡처 읽기는 레코코 앱 설치 버전(개발 빌드)에서 돼요. 지금은 글자를 붙여넣어 주세요.' : '캡처를 읽지 못했어요.');
    } finally {
      setReading(false);
    }
  };

  // 복사해 둔 문자·알림 글을 바로 칸에 넣는다
  const fromClipboard = async () => {
    setOcrNotice('');
    const copied = await Clipboard.getStringAsync().catch(() => '');
    if (!copied.trim()) {
      setOcrNotice('복사한 글이 없어요. 문자·알림을 먼저 복사해 주세요.');
      return;
    }
    Keyboard.dismiss();
    setText(copied);
  };

  // 한 번에 긴 글이 들어오면(붙여넣기) 키보드를 내려서 읽은 내용과 버튼이 바로 보이게
  const changeText = (next: string) => {
    if (next.length - text.length > 15) Keyboard.dismiss();
    setText(next);
    setPicked([0]);
  };

  const found = text.trim() && parseAll ? parseAll(text) : [];
  const chosen = picked.filter((i) => i < found.length).sort((a, b) => a - b);
  const first = chosen.length ? chosen[0] : 0;
  const result = text.trim() ? (parseAll ? (found[first] ?? null) : parse(text)) : null;
  const warn = result && warning ? warning(result) : null;
  const many = !!onFillMany && chosen.length > 1;
  const toggle = (i: number) => {
    if (!onFillMany) return setPicked([i]);
    setPicked((prev) => (prev.includes(i) ? (prev.length > 1 ? prev.filter((x) => x !== i) : prev) : [...prev, i]));
  };

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
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode={DISMISS_ON_DRAG}>
            <Text style={styles.help}>{help}</Text>
            <View style={styles.picks}>
              <PickCard icon="shot" title="캡처 고르기" sub="앨범에서 골라 읽기" busy={reading} onPress={fromScreenshot} />
              <PickCard icon="paste" title="붙여넣기" sub="복사한 글 넣기" onPress={fromClipboard} />
            </View>
            {!!ocrNotice && <Text style={styles.warn}>{ocrNotice}</Text>}
            <TextInput inputAccessoryViewID={KEYBOARD_DONE_ID} style={styles.input} value={text} onChangeText={changeText} multiline placeholder={placeholder} placeholderTextColor={COLORS.placeholder} />

            {found.length > 1 && (
              <View style={styles.pickList}>
                <Text style={styles.pickHead}>
                  {found.length}건을 찾았어요. {onFillMany ? '여러 개를 골라 한 번에 기록할 수 있어요.' : '기록할 것을 골라주세요.'}
                </Text>
                {found.map((f, i) => {
                  const label = optionLabel?.(f) ?? { title: `${i + 1}번째`, sub: '' };
                  const on = chosen.includes(i);
                  return (
                    <Pressable key={`${label.title}-${i}`} onPress={() => toggle(i)} style={[styles.pickRow, on && styles.pickRowOn]}>
                      <View style={[styles.radio, onFillMany && styles.checkbox, on && styles.radioOn]}>
                        {on && (onFillMany ? <Text style={styles.checkMark}>✓</Text> : <View style={styles.radioDot} />)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickRowTitle, on && { color: COLORS.orange }]} numberOfLines={1}>
                          {label.title}
                        </Text>
                        {!!label.sub && <Text style={styles.pickRowSub}>{label.sub}</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

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
          <Pressable
            disabled={!result}
            onPress={() => {
              Keyboard.dismiss();
              if (!result) return;
              if (many && onFillMany) onFillMany(chosen.map((i) => found[i]));
              else onFill(result);
            }}
            style={({ pressed }) => [styles.fill, !result && styles.fillOff, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.fillText, !result && styles.fillTextOff]}>{many ? `${chosen.length}건 모두 기록하기` : '이 내용으로 채우기'}</Text>
          </Pressable>
        </KeyboardAvoidingView>
        <KeyboardDone />
      </SafeAreaView>
    </Modal>
  );
}

/** 캡처 고르기 / 붙여넣기: 폼 위 QuickFill 과 같은 흰 카드, 아이콘 타일 위·글자 아래 */
function PickCard({ icon, title, sub, busy, onPress }: { icon: 'shot' | 'paste'; title: string; sub: string; busy?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.pick, pressed && styles.pickPressed]} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.pickTile}>{busy ? <ActivityIndicator color={COLORS.orange} /> : <PickIcon icon={icon} />}</View>
      <Text style={styles.pickTitle}>{busy ? '읽는 중…' : title}</Text>
      <Text style={styles.pickSub} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

function PickIcon({ icon }: { icon: 'shot' | 'paste' }) {
  if (icon === 'shot') {
    // 폰 화면 속 사진
    return (
      <Svg width={26} height={26} viewBox="0 0 26 26">
        <Rect x={6} y={2} width={14} height={22} rx={3} fill={COLORS.orange} />
        <Rect x={8} y={5} width={10} height={14} rx={1} fill="#fff" />
        <Path d="M8,17 L11.5,12.5 L13.5,15 L15,13.5 L18,17 V19 H8 Z" fill="#ffd2b3" />
        <Circle cx={15.3} cy={8.3} r={1.4} fill="#ffd2b3" />
        <Rect x={11} y={20.8} width={4} height={1.4} rx={0.7} fill="#fff" />
      </Svg>
    );
  }
  // 클립보드
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26">
      <Rect x={4.5} y={4} width={17} height={20} rx={3} fill={COLORS.orange} />
      <Rect x={9} y={2} width={8} height={4.5} rx={1.6} fill="#c9551a" />
      <Rect x={8} y={10} width={10} height={2} rx={1} fill="#fff" />
      <Rect x={8} y={14} width={10} height={2} rx={1} fill="#fff" />
      <Rect x={8} y={18} width={6} height={2} rx={1} fill="#ffd2b3" />
    </Svg>
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
  picks: { flexDirection: 'row', gap: 10 },
  pick: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#7a2c00',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pickPressed: { backgroundColor: COLORS.orangeSoft, borderColor: COLORS.orange },
  pickTile: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.orangeSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  pickTitle: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  pickSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 2 },
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
  pickList: { gap: 6 },
  pickHead: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickRowOn: { backgroundColor: COLORS.orangeSoft, borderColor: COLORS.orange },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.placeholder, alignItems: 'center', justifyContent: 'center' },
  checkbox: { borderRadius: 6 },
  checkMark: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold, lineHeight: 15 },
  radioOn: { borderColor: COLORS.orange },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.orange },
  pickRowTitle: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  pickRowSub: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 1 },
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
