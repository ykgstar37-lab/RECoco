import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDate, pad2 } from '../lib/format';
import { COLORS, FONTS } from '../theme';

const toKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 올해면 "9월 17일 (목)", 아니면 "2025.9.17 (수)" — 좁은 칸에도 들어가게 */
function shortDate(value: string) {
  const d = parseDate(value);
  const day = WEEK[d.getDay()];
  return d.getFullYear() === new Date().getFullYear()
    ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`
    : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${day})`;
}

/** 날짜 입력: 누르면 달력이 뜬다 (웹은 직접 입력) */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(parseDate(value));

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.box} value={value} onChangeText={onChange} placeholder="2026-09-17" placeholderTextColor={COLORS.placeholder} />
      </View>
    );
  }

  const open = () => {
    const current = parseDate(value);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate: new Date(2100, 0, 1),
        onValueChange: (_e, date) => onChange(toKey(date)),
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={open} style={styles.box} accessibilityRole="button" accessibilityLabel={`${label} 선택`}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {shortDate(value)}
        </Text>
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                accentColor={COLORS.orange}
                locale="ko-KR"
                onValueChange={(_e, date) => setDraft(date)}
              />
              <Pressable
                style={styles.done}
                onPress={() => {
                  onChange(toKey(draft));
                  setIosOpen(false);
                }}>
                <Text style={styles.doneText}>이 날짜로</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: 6 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  box: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 10,
    fontSize: 15,
    color: COLORS.ink,
    fontFamily: FONTS.sans,
  },
  value: { fontSize: 15, color: COLORS.ink, fontFamily: FONTS.sans },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 34 },
  done: { backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  doneText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
});
