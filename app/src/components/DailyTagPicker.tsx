// 일상 폼의 소분류 고르기: 칩을 누르면 고르고(다시 누르면 풀림), ＋로 새로 만들고, 길게 누르면 목록에서 지운다.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_TAG_LENGTH, addDailyTag, removeDailyTag, useDailyTags } from '../lib/dailyTags';
import { tagColorOf } from '../templates/DailyStory';
import { COLORS, FONTS } from '../theme';
import { KEYBOARD_DONE_ID } from './KeyboardDone';

export function DailyTagPicker({ value, onChange }: { value: string; onChange: (tag: string) => void }) {
  const tags = useDailyTags();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  // 고친 기록의 소분류가 목록에서 지워졌어도 칩은 보여준다
  const shown = value && !tags.includes(value) ? [...tags, value] : tags;

  const commit = () => {
    const t = addDailyTag(draft);
    if (t) onChange(t);
    setDraft('');
    setAdding(false);
  };

  const askRemove = (t: string) =>
    Alert.alert(`'${t}' 소분류를 지울까요?`, '이미 붙인 기록에는 이름이 그대로 남아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: () => {
          removeDailyTag(t);
          if (value === t) onChange('');
        },
      },
    ]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {shown.map((t) => {
          const on = value === t;
          const color = tagColorOf(t);
          return (
            <Pressable
              key={t}
              onPress={() => onChange(on ? '' : t)}
              onLongPress={() => askRemove(t)}
              style={[styles.chip, on && { backgroundColor: color, borderColor: color }]}
              accessibilityLabel={`${t}${on ? ' (골랐음)' : ''}`}>
              <View style={[styles.dot, { backgroundColor: on ? '#fff' : color }]} />
              <Text style={[styles.text, on && styles.textOn]}>{t}</Text>
            </Pressable>
          );
        })}
        {adding ? (
          <View style={[styles.chip, styles.inputChip]}>
            <TextInput
              autoFocus
              inputAccessoryViewID={KEYBOARD_DONE_ID}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={commit}
              onBlur={commit}
              maxLength={MAX_TAG_LENGTH}
              placeholder="예: 동아리"
              placeholderTextColor={COLORS.placeholder}
              returnKeyType="done"
              style={styles.input}
            />
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={[styles.chip, styles.add]} accessibilityLabel="새 소분류 만들기">
            <Text style={styles.addText}>＋ 새로 만들기</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.hint}>길게 누르면 목록에서 지울 수 있어요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  textOn: { color: '#fff' },
  add: { backgroundColor: COLORS.surface, borderColor: COLORS.surface },
  addText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  inputChip: { borderColor: COLORS.orange, paddingVertical: 4 },
  input: { minWidth: 90, fontSize: 14, color: COLORS.ink, fontFamily: FONTS.sans, paddingVertical: 4 },
  hint: { color: COLORS.sub, fontSize: 11, fontFamily: FONTS.sans },
});
