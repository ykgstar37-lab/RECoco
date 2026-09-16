import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { pad2 } from '../lib/format';
import { COLORS, FONTS } from '../theme';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const NTH = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째'];

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** offset주 전/후의 일요일부터 7일 */
export function weekDays(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

function weekTitle(days: Date[]) {
  const mid = days[3]; // 수요일 기준으로 몇 월 몇째 주인지
  const firstDow = new Date(mid.getFullYear(), mid.getMonth(), 1).getDay();
  const nth = Math.ceil((mid.getDate() + firstDow) / 7);
  return `${mid.getMonth() + 1}월 ${NTH[nth - 1] ?? `${nth}번째`} 주`;
}

/** 기록한 날 찍히는 도장: 주황 원 안에 작은 흰 만두 */
function Stamp({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill={COLORS.orange} />
      <Path
        d="M9,25 C9,18 13,14 18,13.5 C19,11 20.5,10 22,10.5 C23.5,11 24,12.5 23.5,13.8 C28,15 31,19 31,25 C31,28 29,28.8 26,28.8 H14 C11,28.8 9,28 9,25 Z"
        fill="#fff"
      />
      <Circle cx={16.5} cy={21.5} r={1.5} fill={COLORS.orange} />
      <Circle cx={23.5} cy={21.5} r={1.5} fill={COLORS.orange} />
    </Svg>
  );
}

interface Props {
  offset: number;
  onOffset: (next: number) => void;
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (date: string | null) => void;
}

/** 주 단위 달력: 기록한 날엔 도장이 찍힌다 */
export function WeekStamps({ offset, onOffset, counts, selected, onSelect }: Props) {
  const days = weekDays(offset);
  const today = dateKey(new Date());
  const stamped = days.filter((d) => counts[dateKey(d)]).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Pressable onPress={() => onOffset(offset - 1)} hitSlop={12} accessibilityLabel="지난주">
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {weekTitle(days)} · 도장 {stamped}개
        </Text>
        <Pressable onPress={() => offset < 0 && onOffset(offset + 1)} hitSlop={12} accessibilityLabel="다음주">
          <Text style={[styles.arrow, offset >= 0 && styles.arrowOff]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {days.map((d, i) => {
          const key = dateKey(d);
          const count = counts[key] ?? 0;
          const isToday = key === today;
          const future = key > today;
          const isSelected = selected === key;
          return (
            <Pressable
              key={key}
              style={styles.day}
              disabled={!count}
              onPress={() => onSelect(isSelected ? null : key)}
              accessibilityLabel={`${d.getMonth() + 1}월 ${d.getDate()}일 기록 ${count}개`}>
              <Text style={[styles.label, isToday && styles.labelToday]}>{isToday ? '오늘' : DAY_LABELS[i]}</Text>
              <View style={[styles.slot, isSelected && styles.slotSelected]}>
                {count > 0 ? (
                  <Animated.View entering={ZoomIn.springify().damping(9)} key={`${key}-stamp`}>
                    <Stamp size={34} />
                    {count > 1 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{count}</Text>
                      </View>
                    )}
                  </Animated.View>
                ) : (
                  <View style={[styles.empty, isToday && styles.emptyToday, future && styles.emptyFuture]}>
                    <Text style={[styles.date, isToday && styles.dateToday]}>{d.getDate()}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 18, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  title: { color: '#fff', fontSize: 14, fontFamily: FONTS.sansBold },
  arrow: { color: '#fff', fontSize: 26, lineHeight: 28, fontFamily: FONTS.sansBold, paddingHorizontal: 6 },
  arrowOff: { opacity: 0.35 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  day: { flex: 1, alignItems: 'center', gap: 8 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  labelToday: { color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  slot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  slotSelected: { borderWidth: 2, borderColor: COLORS.ink },
  empty: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#d6d6db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyToday: { borderColor: COLORS.orange },
  emptyFuture: { opacity: 0.45 },
  date: { color: COLORS.placeholder, fontSize: 11, fontFamily: FONTS.sans },
  dateToday: { color: COLORS.orange, fontFamily: FONTS.sansBold },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: FONTS.sansBold },
});
