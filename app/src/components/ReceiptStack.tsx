import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { seededRandom } from '../lib/format';
import { formatLength, lengthCompare, rollLengthCm, shortLabel } from '../lib/summary';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';

const SHADES = ['#ff7a2f', '#ff9a5c', '#ffb98a', '#ffd9bf'];
const DARK_TEXT = new Set(['#ffb98a', '#ffd9bf']);

interface Props {
  /** 한 카테고리로 걸러진 목록 (최신이 앞) */
  records: RecoRecord[];
  /** 시트 아래쪽에서 띄울 거리 */
  bottom: number;
  onOpen: (record: RecoRecord) => void;
}

/** 시트 오른쪽 아래에 작게 떠 있는 쌓아보기. 누르면 그 자리에서 영수증 더미가 펼쳐진다 */
export function ReceiptStack({ records, bottom, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const cardW = Math.min(screenW * 0.62, 250);
  const slabMax = cardW - 28;
  const cm = rollLengthCm(records);

  if (records.length === 0) return null;

  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} style={[styles.wrap, { bottom }]}>
      {open ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.card, { width: cardW }]}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headMain}>
                {records.length}장 · {formatLength(cm)}
              </Text>
              <Text style={styles.headSub}>{lengthCompare(cm)} 쌓였어요</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.close} accessibilityLabel="쌓아보기 닫기">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ maxHeight: screenH * 0.42 }}
            contentContainerStyle={styles.stack}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {/* 맨 위가 가장 최근, 맨 아래가 가장 처음 기록 */}
            {records.map((r, i) => {
              const rnd = seededRandom(r.id);
              const w = slabMax * (0.74 + rnd() * 0.26);
              const shift = (rnd() - 0.5) * (slabMax - w);
              const h = 28 + Math.floor(rnd() * 3) * 5;
              const color = SHADES[Math.floor(rnd() * SHADES.length)];
              return (
                <Animated.View key={r.id} entering={FadeInDown.delay(Math.min(i, 10) * 30).springify().damping(15)}>
                  <Pressable
                    onPress={() => onOpen(r)}
                    style={({ pressed }) => [
                      styles.slab,
                      { width: w, height: h, backgroundColor: color, transform: [{ translateX: shift }, { scale: pressed ? 0.96 : 1 }] },
                    ]}>
                    <Text numberOfLines={1} style={[styles.slabText, DARK_TEXT.has(color) && styles.slabTextDark]}>
                      {shortLabel(r)}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <Pressable
            onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.pill, pressed && { transform: [{ scale: 0.94 }] }]}
            accessibilityLabel="쌓아보기">
            <View style={styles.pillIcon}>
              {records.slice(0, 4).map((r) => {
                const rnd = seededRandom(r.id);
                return <View key={r.id} style={[styles.pillBar, { width: 12 + rnd() * 8 }]} />;
              })}
            </View>
            <Text style={styles.pillText}>
              {records.length}장 · {formatLength(cm)}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const shadow = {
  shadowColor: '#7a2c00',
  shadowOpacity: 0.22,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, alignItems: 'flex-end' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    ...shadow,
  },
  pillIcon: { gap: 2, alignItems: 'center', justifyContent: 'flex-end' },
  pillBar: { height: 3, borderRadius: 2, backgroundColor: '#fff' },
  pillText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansBold },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 14, paddingTop: 12, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  headMain: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansHeavy },
  headSub: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold, marginTop: 1 },
  close: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: COLORS.ink, fontSize: 12, fontFamily: FONTS.sansBold },
  stack: { alignItems: 'center', gap: 3 },
  slab: { borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  slabText: { color: '#fff', fontSize: 12, fontFamily: FONTS.sansBold },
  slabTextDark: { color: COLORS.ink },
});
