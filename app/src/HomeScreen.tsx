import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Coco } from './components/Coco';
import { FlipCard } from './components/FlipCard';
import { FoldableReceipt } from './components/FoldableReceipt';
import { PrintJob } from './components/Printer';
import { RecordForm } from './components/RecordForm';
import { loadRecords, saveRecords } from './lib/storage';
import { KIND_LABEL } from './templates';
import { BRAND, COLORS, FONTS } from './theme';
import { RecoRecord } from './types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [records, setRecords] = useState<RecoRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [printing, setPrinting] = useState<RecoRecord | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [cheer, setCheer] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const paperW = Math.min(screenW - 44, 440);
  const printW = Math.min(screenW * 0.72, 360);

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

  const bubble = printing
    ? '뽑는 중이야!'
    : cheer
      ? '영수증 나왔다! 잘 간직할게'
      : records.length === 0
        ? '오늘은 뭘 기록해볼까?'
        : `벌써 ${records.length}장이나 모았어`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>{BRAND.ko}</Text>
          <Text style={styles.count}>기록 {records.length}장</Text>
        </View>
        <Pressable
          onPress={() => setFormOpen(true)}
          disabled={!!printing}
          accessibilityLabel="기록 추가"
          style={({ pressed }) => [styles.addBtn, (pressed || printing) && { opacity: 0.75 }]}>
          <Text style={styles.addBtnText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <ScrollView
          ref={scrollRef}
          style={styles.roll}
          contentContainerStyle={[styles.rollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}>
          <Pressable style={styles.hero} onPress={() => !printing && setFormOpen(true)}>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{bubble}</Text>
              <View style={styles.bubbleTail} />
            </View>
            <Coco size={Math.min(screenW * 0.42, 170)} mood={cheer ? 'happy' : 'idle'} id="coco-home" />
          </Pressable>

          {loaded && records.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>읽은 책, 본 영화, 쓴 돈, 떠난 여행,{'\n'}함께 찍은 네컷을 영수증으로 남겨보세요.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setFormOpen(true)}>
                <Text style={styles.emptyBtnText}>첫 기록 남기기</Text>
              </Pressable>
            </View>
          )}
          {records.map((record) => (
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
        </ScrollView>

        {printing && (
          <PrintJob record={printing} rollWidth={printW} onDone={handleTorn} onCancel={() => setPrinting(null)} />
        )}
      </View>

      <RecordForm visible={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  logo: { fontSize: 24, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  count: { fontSize: 13, color: COLORS.sub, fontFamily: FONTS.sans, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 26, lineHeight: 30, fontFamily: FONTS.sansBold },
  stage: { flex: 1 },
  roll: { flex: 1 },
  rollContent: { alignItems: 'center' },
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  bubble: {
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 10,
  },
  bubbleText: { color: COLORS.orange, fontSize: 14, fontFamily: FONTS.sansBold },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 12,
    height: 12,
    backgroundColor: COLORS.orangeSoft,
    transform: [{ rotate: '45deg' }],
  },
  item: { alignItems: 'center', width: '100%', paddingHorizontal: 22 },
  itemLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.sans, paddingTop: 18, paddingBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 12, gap: 18 },
  emptyText: { fontSize: 15, color: COLORS.sub, fontFamily: FONTS.sans, textAlign: 'center', lineHeight: 23 },
  emptyBtn: { backgroundColor: COLORS.orange, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 999 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.sansBold },
});
