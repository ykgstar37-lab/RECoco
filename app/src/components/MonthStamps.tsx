import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { pad2 } from '../lib/format';
import { shortLabel } from '../lib/summary';
import { KIND_LABEL, RecordPaper, layoutOf } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { dateKey } from './WeekStamps';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 기록한 날 찍히는 도장 (주간 달력과 같은 그림, 작게) */
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

/** 그 달의 1일부터 말일까지 + 앞뒤로 빈 칸을 채워 7칸씩 맞춘 목록 (빈 칸은 null) */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= last; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  records: RecoRecord[];
  /** 아래 목록에서 영수증을 누르면 그날 영수증 크게 보기 */
  onPickDate: (date: string) => void;
}

/** 달 단위 달력: 한 달에 며칠 적었는지 한눈에 보고, 도장을 누르면 아래에 그날 기록이 펼쳐진다 */
export function MonthStamps({ visible, onClose, records, onPickDate }: Props) {
  const now = new Date();
  // 이번 달부터 몇 달 전인지 (0 = 이번 달)
  const [back, setBack] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const { width: screenW, height: screenH } = useWindowDimensions();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) map[r.date] = (map[r.date] ?? 0) + 1;
    return map;
  }, [records]);

  const shown = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const today = dateKey(now);

  const { cells, days, total } = useMemo(() => {
    const cells = monthGrid(year, month);
    let days = 0;
    let total = 0;
    for (const d of cells) {
      const n = d ? (counts[dateKey(d)] ?? 0) : 0;
      if (n) days += 1;
      total += n;
    }
    return { cells, days, total };
  }, [year, month, counts]);

  const dayRecords = useMemo(() => (picked ? records.filter((r) => r.date === picked) : []), [records, picked]);

  // 달을 넘기면 펼쳐둔 날은 접는다
  const goMonth = (next: number) => {
    setBack(next);
    setPicked(null);
  };

  // 기록이 하나라도 있는 가장 이른 달까지만 넘길 수 있게
  const firstKey = Object.keys(counts).sort()[0];
  const canGoBack = !!firstKey && `${year}-${pad2(month + 1)}` > firstKey.slice(0, 7);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>달력</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.monthRow}>
          <Pressable onPress={() => canGoBack && goMonth(back + 1)} hitSlop={12} disabled={!canGoBack} accessibilityLabel="지난달">
            <Text style={[styles.arrow, !canGoBack && styles.arrowOff]}>‹</Text>
          </Pressable>
          <View style={styles.monthBox}>
            <Text style={styles.month}>
              {year}년 {month + 1}월
            </Text>
            <Text style={styles.sum}>{days ? `${days}일 · 영수증 ${total}장` : '아직 없어요'}</Text>
          </View>
          <Pressable onPress={() => back > 0 && goMonth(back - 1)} hitSlop={12} disabled={back === 0} accessibilityLabel="다음달">
            <Text style={[styles.arrow, back === 0 && styles.arrowOff]}>›</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.weekLabels}>
            {DAY_LABELS.map((d, i) => (
              <Text key={d} style={[styles.weekLabel, i === 0 && styles.sunday]}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`empty-${i}`} style={styles.cell} />;
              const key = dateKey(d);
              const count = counts[key] ?? 0;
              const isToday = key === today;
              const future = key > today;
              return (
                <Pressable
                  key={key}
                  style={styles.cell}
                  disabled={!count}
                  onPress={() => setPicked(picked === key ? null : key)}
                  accessibilityLabel={`${month + 1}월 ${d.getDate()}일 기록 ${count}개`}>
                  <View style={[styles.slot, picked === key && styles.slotOn]}>
                    {count > 0 ? (
                      <>
                        <Stamp size={34} />
                        {count > 1 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{count}</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={[styles.empty, isToday && styles.emptyToday, future && styles.emptyFuture]} />
                    )}
                  </View>
                  <Text style={[styles.date, isToday && styles.dateToday, count > 0 && styles.dateOn, future && styles.emptyFuture]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>

          {picked ? (
            <View style={styles.list}>
              <Text style={styles.listHead}>{`${Number(picked.slice(5, 7))}월 ${Number(picked.slice(8, 10))}일 · ${dayRecords.length}장`}</Text>
              {/* 그날 영수증을 실제 양식 그대로, 여러 장이면 옆으로 넘겨 본다 */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.papers}>
                {dayRecords.map((r) => {
                  const l = layoutOf(r);
                  const w = Math.min(dayRecords.length > 1 ? screenW * 0.46 : screenW * 0.62, (screenH * 0.42 * l.width) / l.height);
                  return (
                    <Pressable key={r.id} onPress={() => onPickDate(r.date)} style={({ pressed }) => [styles.sample, pressed && { opacity: 0.75 }]}>
                      <View style={styles.paper}>
                        <RecordPaper record={r} width={w} />
                      </View>
                      <View style={styles.kind}>
                        <Text style={styles.kindText}>{KIND_LABEL[r.kind]}</Text>
                      </View>
                      <Text style={[styles.caption, { maxWidth: w }]} numberOfLines={1}>
                        {shortLabel(r)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={styles.help}>영수증을 누르면 크게 볼 수 있어요.</Text>
            </View>
          ) : (
            <Text style={styles.help}>도장이 찍힌 날을 누르면 그날 영수증이 펼쳐져요.</Text>
          )}
        </ScrollView>
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
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 6 },
  monthBox: { alignItems: 'center', gap: 2 },
  month: { color: COLORS.ink, fontSize: 17, fontFamily: FONTS.sansBold },
  sum: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  arrow: { color: COLORS.ink, fontSize: 30, lineHeight: 32, fontFamily: FONTS.sansBold, paddingHorizontal: 10 },
  arrowOff: { opacity: 0.25 },
  body: { paddingHorizontal: 14, paddingBottom: 28, gap: 8 },
  weekLabels: { flexDirection: 'row' },
  weekLabel: { flex: 1, textAlign: 'center', color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sansBold },
  sunday: { color: COLORS.orange },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6, gap: 3 },
  slot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  slotOn: { borderWidth: 2, borderColor: COLORS.ink },
  empty: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#dedee3' },
  emptyToday: { borderColor: COLORS.orange },
  emptyFuture: { opacity: 0.4 },
  date: { color: COLORS.placeholder, fontSize: 11, fontFamily: FONTS.sans },
  dateOn: { color: COLORS.ink, fontFamily: FONTS.sansBold },
  dateToday: { color: COLORS.orange, fontFamily: FONTS.sansBold },
  badge: {
    position: 'absolute',
    top: 0,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: FONTS.sansBold },
  help: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, textAlign: 'center', marginTop: 10 },
  list: { marginTop: 10, gap: 8, paddingHorizontal: 4 },
  listHead: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.sansBold, paddingHorizontal: 4 },
  papers: { paddingVertical: 6, paddingHorizontal: 4, gap: 14, alignItems: 'flex-end' },
  sample: { alignItems: 'center', gap: 6 },
  paper: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 8 },
  kind: { backgroundColor: COLORS.orangeSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  kindText: { color: COLORS.orange, fontSize: 11, fontFamily: FONTS.sansBold },
  caption: { color: COLORS.ink, fontSize: 13, fontFamily: FONTS.sansBold },
});
