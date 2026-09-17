import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { parseDate, pad2 } from '../lib/format';
import { tick } from '../lib/haptics';
import { COLORS, FONTS } from '../theme';

const toKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const CAL_W = 320;
const CAL_H = 368; // 6주짜리 달 기준 대략 높이

/** 올해면 "9월 17일 (목)", 아니면 "2025.9.17 (수)" — 좁은 칸에도 들어가게 */
function shortDate(value: string) {
  const d = parseDate(value);
  const day = WEEK[d.getDay()];
  return d.getFullYear() === new Date().getFullYear()
    ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`
    : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${day})`;
}

/** 날짜 입력: 누르면 칸 바로 아래로 달력이 펼쳐진다 (폰·웹 모두 같은 달력) */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const boxRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; h: number } | null>(null);
  const [month, setMonth] = useState(() => {
    const d = parseDate(value);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const open = () => {
    const d = parseDate(value);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    boxRef.current?.measureInWindow((x, y, _w, h) => setAnchor({ x, y, h }));
  };
  const close = () => setAnchor(null);
  const choose = (d: Date) => {
    tick();
    onChange(toKey(d));
    close();
  };

  // 칸 아래에 자리가 없으면 위로, 화면 밖으로 나가지 않게
  const calW = Math.min(CAL_W, screenW - 24);
  let left = 12;
  let top = 0;
  if (anchor) {
    left = Math.max(12, Math.min(anchor.x, screenW - calW - 12));
    const below = anchor.y + anchor.h + 6;
    top = below + CAL_H > screenH - 12 ? Math.max(12, anchor.y - CAL_H - 6) : below;
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable ref={boxRef} onPress={open} style={[styles.box, !!anchor && styles.boxOn]} accessibilityRole="button" accessibilityLabel={`${label} 선택`}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {shortDate(value)}
        </Text>
        <Text style={[styles.caret, !!anchor && { transform: [{ rotate: '180deg' }] }]}>▾</Text>
      </Pressable>

      <Modal visible={!!anchor} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="달력 닫기" />
        <View style={[styles.pop, { left, top, width: calW }]}>
          <Calendar month={month} selected={value} onMonth={setMonth} onPick={choose} />
        </View>
      </Modal>
    </View>
  );
}

function Calendar({ month, selected, onMonth, onPick }: { month: Date; selected: string; onMonth: (d: Date) => void; onPick: (d: Date) => void }) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const todayKey = toKey(new Date());
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);

  const shift = (n: number) => onMonth(new Date(y, m + n, 1));
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.head}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.nav} accessibilityLabel="이전 달">
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.month}>
          {y}년 {m + 1}월
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={10} style={styles.nav} accessibilityLabel="다음 달">
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEK.map((w, i) => (
          <Text key={w} style={[styles.weekText, i === 0 && { color: COLORS.danger }]}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const key = toKey(d);
          const on = key === selected;
          const isToday = key === todayKey;
          return (
            <Pressable key={key} onPress={() => onPick(d)} style={styles.cell}>
              <View style={[styles.day, isToday && styles.dayToday, on && styles.dayOn]}>
                <Text style={[styles.dayText, d.getDay() === 0 && { color: COLORS.danger }, on && styles.dayTextOn]}>{d.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quick}>
        {[
          { label: '오늘', date: now },
          { label: '어제', date: yesterday },
        ].map((q) => (
          <Pressable key={q.label} onPress={() => onPick(q.date)} style={styles.quickBtn}>
            <Text style={styles.quickText}>{q.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: 6 },
  label: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  boxOn: { borderColor: COLORS.orange, backgroundColor: '#fff' },
  value: { flexShrink: 1, fontSize: 15, color: COLORS.ink, fontFamily: FONTS.sans },
  caret: { color: COLORS.sub, fontSize: 12 },
  pop: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  navText: { color: COLORS.ink, fontSize: 20, lineHeight: 22, fontFamily: FONTS.sansBold },
  month: { color: COLORS.ink, fontSize: 16, fontFamily: FONTS.sansHeavy },
  week: { flexDirection: 'row' },
  weekText: { flex: 1, textAlign: 'center', color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: COLORS.orange },
  dayOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  dayText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sans },
  dayTextOn: { color: '#fff', fontFamily: FONTS.sansBold },
  quick: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.orangeSoft },
  quickText: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
});
