import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, CategoryPicker } from './components/CategoryPicker';
import { COCO_RATIO, Coco } from './components/Coco';
import { PrintJob } from './components/Printer';
import { RecordForm } from './components/RecordForm';
import { RollScreen } from './components/RollScreen';
import { WeekStamps, dateKey } from './components/WeekStamps';
import { loadRecords, saveRecords } from './lib/storage';
import { BRAND, COLORS, FONTS } from './theme';
import { RecoRecord, RecordKind } from './types';

// 코코를 누를 때마다 바뀌는 한마디
const POKES = ['간지러워!', '말랑말랑~', '헤헤 또 눌러봐', '영수증 뽑아줄까?', '기록은 내가 챙길게', '만두 아니고 코코야!'];

/** 메인: 한 화면에 코코 + 주간 도장 + 기록 버튼. 영수증 목록은 따로 올라오는 화면 */
export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<RecoRecord[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formKind, setFormKind] = useState<RecordKind>('reading');
  const [picking, setPicking] = useState(false);
  const [focusKind, setFocusKind] = useState<RecordKind | null>(null);
  const [printing, setPrinting] = useState<RecoRecord | null>(null);
  const [rollOpen, setRollOpen] = useState(false);
  const [rollDate, setRollDate] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const [poke, setPoke] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRecords().then(setRecords);
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

  const openPicker = () => {
    setFocusKind(null);
    setPicking(true);
  };

  const pickCategory = (kind: RecordKind) => {
    setFormKind(kind);
    setPicking(false);
    setFocusKind(null);
    setFormOpen(true);
  };

  const handleSubmit = (record: RecoRecord) => {
    setFormOpen(false);
    // 시트가 내려간 뒤 출력 시작
    setTimeout(() => setPrinting(record), Platform.OS === 'ios' ? 450 : 250);
  };

  const handleTorn = (record: RecoRecord) => {
    setPrinting(null);
    // 기록한 날짜가 있는 주로 이동해서 도장이 찍히는 걸 보여준다
    const today = new Date();
    const d = new Date(`${record.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const sundayToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const sundayRecord = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      setWeekOffset(Math.min(0, Math.round((sundayRecord.getTime() - sundayToday.getTime()) / (7 * 86400000))));
    }
    setCheer(true);
    setTimeout(() => setCheer(false), 3500);
    update([record, ...records]);
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
  const focusHint = CATEGORIES.find((c) => c.kind === focusKind)?.hint;
  const headline = cheer
    ? '영수증 나왔다!\n도장 쾅 찍어줄게'
    : picking
      ? (focusHint ?? '오늘은\n뭘 기록할까?')
      : poke
        ? poke
        : todayCount > 0
          ? `오늘 벌써\n${todayCount}장이나 남겼어!`
          : '오늘 하루도\n영수증으로 남겨볼까?';

  // 코코는 남는 공간을 꽉 채울 만큼 크게 (화면 폭보다 살짝 넓게)
  const cocoSize = stage.width ? Math.min(stage.width * 1.06, stage.height / COCO_RATIO) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>{BRAND.ko}</Text>
          <Text style={styles.count}>모은 영수증 {records.length}장</Text>
        </View>
        <Pressable
          onPress={picking ? () => setPicking(false) : openPicker}
          disabled={!!printing}
          accessibilityLabel={picking ? '카테고리 닫기' : '기록 추가'}
          style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Text style={[styles.addBtnText, picking && { transform: [{ rotate: '45deg' }] }]}>＋</Text>
        </Pressable>
      </View>

      <Text style={styles.headline}>{headline}</Text>

      <View style={styles.stage} onLayout={(e) => setStage(e.nativeEvent.layout)}>
        {cocoSize > 0 && (
          <Coco
            size={cocoSize}
            tone="white"
            mood={cheer || focusKind ? 'happy' : picking ? 'wow' : 'idle'}
            interactive
            onPress={picking ? undefined : pokeCoco}
            id="coco-home"
          />
        )}
      </View>

      <WeekStamps
        offset={weekOffset}
        onOffset={setWeekOffset}
        counts={counts}
        selected={null}
        onSelect={(date) => {
          setRollDate(date);
          setRollOpen(true);
        }}
      />

      <View style={styles.bottom}>
        {picking ? (
          <CategoryPicker focused={focusKind} onFocus={setFocusKind} onPick={pickCategory} onClose={() => setPicking(false)} />
        ) : (
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(80)} style={styles.bottomRow}>
            <Pressable
              style={({ pressed }) => [styles.rollBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                setRollDate(null);
                setRollOpen(true);
              }}>
              <Text style={styles.rollBtnText}>나의 영수증 {records.length}장 보기</Text>
              <Text style={styles.rollBtnArrow}>›</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {printing && <PrintJob record={printing} rollWidth={Math.min(stage.width * 0.72, 360) || 280} onDone={handleTorn} onCancel={() => setPrinting(null)} />}

      <RollScreen
        visible={rollOpen}
        records={records}
        date={rollDate}
        onClearDate={() => setRollDate(null)}
        onClose={() => setRollOpen(false)}
        onLongPress={handleLongPress}
      />
      <RecordForm visible={formOpen} initialKind={formKind} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.orange, overflow: 'hidden' },
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
  headline: {
    color: '#fff',
    fontSize: 27,
    lineHeight: 37,
    textAlign: 'center',
    fontFamily: FONTS.sansHeavy,
    marginTop: 14,
    minHeight: 74,
  },
  // 코코가 남는 세로 공간을 전부 차지한다
  stage: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 },
  bottom: { minHeight: 104, justifyContent: 'center', marginTop: 14 },
  bottomRow: { paddingHorizontal: 18 },
  rollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 17,
  },
  rollBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.sansBold },
  rollBtnArrow: { color: '#fff', fontSize: 26, lineHeight: 26, fontFamily: FONTS.sansBold },
});
