import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlipCard } from './components/FlipCard';
import { CutLine, FoldableReceipt } from './components/FoldableReceipt';
import { PrintJob, PrinterBar, SLOT_Y } from './components/Printer';
import { RecordForm } from './components/RecordForm';
import { loadRecords, saveRecords } from './lib/storage';
import { KIND_LABEL } from './templates';
import { APP_NAME, BRAND, COLORS, FONTS } from './theme';
import { RecoRecord } from './types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [records, setRecords] = useState<RecoRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [printing, setPrinting] = useState<RecoRecord | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const paperW = Math.min(screenW - 44, 440);
  const printW = Math.min(screenW * 0.86, 420);

  useEffect(() => {
    loadRecords()
      .then(setRecords)
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((next: RecoRecord[]) => {
    setRecords(next);
    saveRecords(next).catch(() => {});
  }, []);

  const handleSubmit = (record: RecoRecord) => {
    setFormOpen(false);
    // 시트가 내려간 뒤 출력 시작
    setTimeout(() => setPrinting(record), Platform.OS === 'ios' ? 450 : 250);
  };

  const handleTorn = (record: RecoRecord) => {
    setPrinting(null);
    setFreshId(record.id);
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.logoRow}>
            <Text style={styles.logo}>{APP_NAME}</Text>
            <Text style={styles.logoKo}>{BRAND.ko}</Text>
          </View>
          <Text style={styles.count}>지금까지 출력한 기록 {records.length}장</Text>
        </View>
        <Pressable
          onPress={() => setFormOpen(true)}
          disabled={!!printing}
          style={({ pressed }) => [styles.printBtn, (pressed || printing) && { opacity: 0.7 }]}>
          <Text style={styles.printBtnText}>＋ 기록 출력</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <ScrollView
          ref={scrollRef}
          style={styles.roll}
          contentContainerStyle={[styles.rollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}>
          {loaded && records.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>아직 출력된 영수증이 없어요</Text>
              <Text style={styles.emptyText}>오늘 읽은 책, 본 영화, 쓴 돈, 떠난 여행,{'\n'}함께 찍은 네컷을 남겨보세요.</Text>
            </View>
          )}
          {records.map((record, i) => (
            <Animated.View
              key={record.id}
              entering={record.id === freshId ? FadeInDown.duration(420) : undefined}
              layout={LinearTransition.springify().damping(18)}
              style={styles.item}>
              {i > 0 && <CutLine label={`${record.date.replace(/-/g, '.')} · ${KIND_LABEL[record.kind]}`} />}
              {i === 0 && (
                <Text style={styles.firstLabel}>
                  {record.date.replace(/-/g, '.')} · {KIND_LABEL[record.kind]}
                </Text>
              )}
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
        </ScrollView>

        {printing && (
          <PrintJob record={printing} rollWidth={printW} onDone={handleTorn} onCancel={() => setPrinting(null)} />
        )}
        <PrinterBar active={!!printing} />
      </View>

      <RecordForm visible={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.desk },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  logo: { fontSize: 28, color: COLORS.ink, fontFamily: FONTS.code, letterSpacing: -0.5 },
  logoKo: { fontSize: 13, color: COLORS.sub, fontFamily: FONTS.monoBold },
  count: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.mono, marginTop: 2 },
  printBtn: { backgroundColor: COLORS.printer, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999 },
  printBtnText: { color: '#f3efe7', fontSize: 14, fontFamily: FONTS.monoBold },
  stage: { flex: 1 },
  roll: { flex: 1, marginTop: SLOT_Y },
  rollContent: { alignItems: 'center', paddingTop: 6 },
  item: { alignItems: 'center', width: '100%', paddingHorizontal: 22 },
  firstLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.mono, paddingVertical: 12, opacity: 0.7 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, color: COLORS.ink, fontFamily: FONTS.monoBold },
  emptyText: { fontSize: 14, color: COLORS.sub, fontFamily: FONTS.mono, textAlign: 'center', lineHeight: 22 },
});
