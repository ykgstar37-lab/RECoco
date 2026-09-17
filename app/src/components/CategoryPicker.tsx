import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { tick } from '../lib/haptics';
import { COLORS, FONTS } from '../theme';
import { RecordKind } from '../types';

export const CATEGORIES: { kind: RecordKind; label: string; hint: string }[] = [
  { kind: 'reading', label: '독서', hint: '어떤 책 읽었어?' },
  { kind: 'movie', label: '영화', hint: '무슨 영화 봤어?' },
  { kind: 'spending', label: '소비', hint: '오늘 뭐 샀어?' },
  { kind: 'travel', label: '여행', hint: '어디 다녀왔어?' },
  { kind: 'fourcut', label: '인생네컷', hint: '누구랑 찍었어?' },
];

interface Props {
  focused: RecordKind | null;
  onFocus: (kind: RecordKind) => void;
  onPick: (kind: RecordKind) => void;
}

/**
 * ＋를 누르면 아래에서 톡톡 올라오는 카테고리 알약 버튼.
 * 손가락을 대면 그 카테고리가 도드라지고(코코가 질문), 떼면 기록 화면으로 간다.
 */
export function CategoryPicker({ focused, onFocus, onPick }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {CATEGORIES.map((c, i) => {
          const on = focused === c.kind;
          return (
            <Animated.View
              key={c.kind}
              entering={FadeInDown.delay(i * 45).springify().damping(13)}
              exiting={FadeOutDown.duration(120)}>
              <Pressable
                onPressIn={() => {
                  tick();
                  onFocus(c.kind);
                }}
                onPress={() => onPick(c.kind)}
                style={[styles.pill, on && styles.pillOn]}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{c.label}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pillOn: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.08 }],
    shadowColor: '#7a2c00',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pillText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  pillTextOn: { color: COLORS.orange },
});
