import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Coco } from './components/Coco';
import { FlipCard } from './components/FlipCard';
import { FoldableReceipt } from './components/FoldableReceipt';
import { PrintJob } from './components/Printer';
import { RecordForm } from './components/RecordForm';
import { WeekStamps, dateKey } from './components/WeekStamps';
import { loadRecords, saveRecords } from './lib/storage';
import { KIND_LABEL } from './templates';
import { BRAND, COLORS, FONTS } from './theme';
import { RecoRecord } from './types';

// 코코를 누를 때마다 바뀌는 한마디
const POKES = ['간지러워!', '말랑말랑~', '오늘은 뭘 남길까?', '영수증 뽑아줄까?', '헤헤 또 눌러봐', '기록은 내가 챙길게'];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [records, setRecords] = useState<RecoRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [printing, setPrinting] = useState<RecoRecord | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const [poke, setPoke] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paperW = Math.min(screenW - 44, 440);
  const printW = Math.min(screenW * 0.72, 360);
  const cocoSize = Math.min(screenW * 0.56, 240);

  useEffect(() => {
    loadRecords()
      .then(setRecords)
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((next: RecoRecord[]) => {
    setRecords(next);
    saveRecords(next).catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) map[r.date] = (map[r.date] ?? 0) + 1;
    return map;
  }, [records]);

  const visible = selectedDate ? records.filter((r) => r.date === selectedDate) : records;

  const handleSubmit = (record: RecoRecord) => {
    setFormOpen(false);
    // 시트가 내려간 뒤 출력 시작
    setTimeout(() => setPrinting(record), Platform.OS === 'ios' ? 450 : 250);
  };

  const handleTorn = (record: RecoRecord) => {
    setPrinting(null);
    setFreshId(record.id);
    setSelectedDate(null);
    // 기록한 날짜가 있는 주로 이동해서 도장이 찍히는 걸 보여준다
    const today = new Date();
    const d = new Date(`${record.date}T00:00:00`);
    const sundayToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const sundayRecord = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    if (!Number.isNaN(sundayRecord.getTime())) {
      setWeekOffset(Math.min(0, Math.round((sundayRecord.getTime() - sundayToday.getTime()) / (7 * 86400000))));
    }
    setCheer(true);
    setTimeout(() => setCheer(false), 3500);
    update([record, ...records]);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleLongPress = useCallback(
    (record: RecoRecord) => {
      const remove = () => update(records.filter((r) => r.id !== record.id));
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        if (window.confirm('이 기록을 버릴까요?')) remove();
        return;
      }
      Alert.alert('기록 버리기', '이 영수증을 구겨서 버릴까요?', [
        { text: '취소', style: 'cancel' },
        { text: '버리기', style: 'destructive', onPress: remove },
      ]);
    },
    [records, update],
  );

  const pokeCoco = () => {
    setPoke(POKES[Math.floor(Math.random() * POKES.length)]);
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setPoke(null), 1800);
  };

  const todayCount = counts[dateKey(new Date())] ?? 0;
  const headline = cheer
    ? '영수증 나왔다!\n도장 쾅 찍어줄게'
    : poke
      ? poke
      : todayCount > 0
        ? `오늘 벌써 ${todayCount}장이나\n남겼어!`
        : '오늘 하루도\n영수증으로 남겨볼까?';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}>
        {/* ── 주황 영역: 코코 + 주간 도장 ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{BRAND.ko}</Text>
            <Text style={styles.count}>모은 영수증 {records.length}장</Text>
          </View>
          <Pressable
            onPress={() => setFormOpen(true)}
            disabled={!!printing}
            accessibilityLabel="기록 추가"
            style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.headline}>{headline}</Text>
          <Coco size={cocoSize} tone="white" mood={cheer ? 'happy' : 'idle'} interactive onPress={pokeCoco} id="coco-home" />
        </View>

        <WeekStamps
          offset={weekOffset}
          onOffset={(o) => {
            setWeekOffset(o);
            setSelectedDate(null);
          }}
          counts={counts}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />

        {/* ── 흰 시트: 영수증 롤 ── */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{selectedDate ? `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8))}일의 기록` : '나의 영수증'}</Text>
            {selectedDate && (
              <Pressable onPress={() => setSelectedDate(null)} hitSlop={8} style={styles.chip}>
                <Text style={styles.chipText}>전체 보기</Text>
              </Pressable>
            )}
          </View>

          {loaded && records.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>읽은 책, 본 영화, 쓴 돈, 떠난 여행,{'\n'}함께 찍은 네컷을 영수증으로 남겨보세요.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setFormOpen(true)}>
                <Text style={styles.emptyBtnText}>첫 영수증 뽑기</Text>
              </Pressable>
            </View>
          )}

          {visible.map((record) => (
            <Animated.View
              key={record.id}
              entering={record.id === freshId ? FadeInDown.duration(420) : undefined}
              layout={LinearTransition.springify().damping(18)}
              style={styles.item}>
              <Text style={styles.itemLabel}>
                {record.date.replace(/-/g, '.')} · {KIND_LABEL[record.kind]}
              </Text>
              {record.kind === 'fourcut' ? (
                <FlipCard record={record} rollWidth={paperW} onLongPress={handleLongPress} />
              ) : (
                <FoldableReceipt
                  record={record}
                  rollWidth={paperW}
                  initiallyOpen={record.id === freshId}
                  onLongPress={handleLongPress}
                />
              )}
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {printing && <PrintJob record={printing} rollWidth={printW} onDone={handleTorn} onCancel={() => setPrinting(null)} />}

      <RecordForm visible={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  logo: { fontSize: 24, color: '#fff', fontFamily: FONTS.sansHeavy },
  count: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.sans, marginTop: 2 },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: COLORS.orange, fontSize: 28, lineHeight: 32, fontFamily: FONTS.sansBold },
  hero: { alignItems: 'center', paddingTop: 18, paddingBottom: 22, gap: 18 },
  headline: { color: '#fff', fontSize: 26, lineHeight: 36, textAlign: 'center', fontFamily: FONTS.sansHeavy, minHeight: 72 },
  sheet: {
    marginTop: 22,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 500,
    alignItems: 'center',
  },
  sheetHead: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sheetTitle: { fontSize: 18, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  chip: { backgroundColor: COLORS.orangeSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
  item: { alignItems: 'center', width: '100%', paddingHorizontal: 22 },
  itemLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.sans, paddingTop: 18, paddingBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 28, gap: 18 },
  emptyText: { fontSize: 15, color: COLORS.sub, fontFamily: FONTS.sans, textAlign: 'center', lineHeight: 23 },
  emptyBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 999 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.sansBold },
});
