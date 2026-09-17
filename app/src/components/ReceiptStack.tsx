import { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { seededRandom } from '../lib/format';
import { formatLength, lengthCompare, rollLengthCm, shortLabel } from '../lib/summary';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { Coco } from './Coco';

const SHADES = ['#ff7a2f', '#ff9a5c', '#ffb98a', '#ffd9bf'];
const DARK_TEXT = new Set(['#ffb98a', '#ffd9bf']);

interface Props {
  visible: boolean;
  /** 이미 걸러진 목록 (최신이 앞) */
  records: RecoRecord[];
  label: string;
  onClose: () => void;
  onOpen: (record: RecoRecord) => void;
}

/** 모은 영수증을 차곡차곡 쌓아 올리고, 맨 위에 코코가 앉아 있는 화면 */
export function ReceiptStack({ visible, records, label, onClose, onOpen }: Props) {
  const { width: screenW } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const maxW = Math.min(screenW - 48, 360);
  const cm = rollLengthCm(records);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Text style={styles.title}>{label} 쌓아보기</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {records.length === 0 ? (
            <View style={styles.empty}>
              <Coco size={150} mood="wow" id="stack-empty" />
              <Text style={styles.emptyText}>아직 쌓을 영수증이 없어요</Text>
            </View>
          ) : (
            <>
              <View style={styles.bubble}>
                <Text style={styles.bubbleMain}>
                  {records.length}장 · 이어 붙이면 {formatLength(cm)}
                </Text>
                <Text style={styles.bubbleSub}>{lengthCompare(cm)} 모았어!</Text>
                <View style={styles.bubbleTail} />
              </View>
              <Coco size={130} mood="happy" interactive id="stack-coco" />

              {/* 맨 위가 가장 최근, 맨 아래가 가장 처음 기록 */}
              <View style={styles.stack}>
                {records.map((r, i) => {
                  const rnd = seededRandom(r.id);
                  const w = maxW * (0.78 + rnd() * 0.22);
                  const shift = (rnd() - 0.5) * (maxW - w);
                  const h = 44 + Math.floor(rnd() * 3) * 10;
                  const color = SHADES[Math.floor(rnd() * SHADES.length)];
                  return (
                    <Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i, 12) * 40).springify().damping(14)}>
                      <Pressable
                        onPress={() => onOpen(r)}
                        style={({ pressed }) => [
                          styles.slab,
                          { width: w, height: h, backgroundColor: color, transform: [{ translateX: shift }, { scale: pressed ? 0.97 : 1 }] },
                        ]}>
                        <Text numberOfLines={1} style={[styles.slabText, DARK_TEXT.has(color) && styles.slabTextDark]}>
                          {shortLabel(r)}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
              <Text style={styles.hint}>칸을 누르면 그 영수증을 크게 볼 수 있어요</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 10 },
  title: { fontSize: 20, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  // 쌓인 더미가 화면 아래에서부터 올라오도록
  scroll: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  bubble: {
    borderWidth: 2,
    borderColor: COLORS.orange,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  bubbleMain: { color: COLORS.ink, fontSize: 17, fontFamily: FONTS.sansHeavy },
  bubbleSub: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold, marginTop: 2 },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.orange,
    transform: [{ rotate: '45deg' }],
  },
  stack: { alignItems: 'center', gap: 4, marginTop: -4 },
  slab: { borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  slabText: { color: '#fff', fontSize: 15, fontFamily: FONTS.sansBold },
  slabTextDark: { color: COLORS.ink },
  hint: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans, marginTop: 14 },
  empty: { alignItems: 'center', gap: 14, paddingBottom: 80 },
  emptyText: { color: COLORS.sub, fontSize: 15, fontFamily: FONTS.sans },
});
