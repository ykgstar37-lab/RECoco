import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOut } from 'react-native-reanimated';

import { seededRandom } from '../lib/format';
import { shortLabel } from '../lib/summary';
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

const shadeOf = (r: RecoRecord) => SHADES[Math.floor(seededRandom(r.id)() * SHADES.length)];

/** 시트 오른쪽 끝에 붙은 인덱스 스티커. 누르면 탭이 빠져나오며 제목이 보인다 */
export function ReceiptStack({ records, bottom, onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const { width: screenW, height: screenH } = useWindowDimensions();
  const tabMax = Math.min(screenW * 0.64, 260);

  if (records.length === 0) return null;

  if (!open) {
    return (
      <Animated.View entering={FadeIn.duration(160)} style={[styles.wrap, { bottom }]}>
        <Pressable onPress={() => setOpen(true)} hitSlop={10} style={styles.peek} accessibilityLabel="쌓아보기">
          {records.slice(0, 5).map((r) => {
            const rnd = seededRandom(r.id);
            return <View key={r.id} style={[styles.peekTab, { width: 20 + rnd() * 12, backgroundColor: shadeOf(r) }]} />;
          })}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(120)} style={[styles.wrap, { bottom }]}>
      <ScrollView style={{ maxHeight: screenH * 0.45 }} contentContainerStyle={styles.tabs} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setOpen(false)} hitSlop={6} style={[styles.tab, styles.closeTab]} accessibilityLabel="쌓아보기 닫기">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        {/* 위가 가장 최근 */}
        {records.map((r, i) => {
          const color = shadeOf(r);
          const extra = seededRandom(r.id + 'tab')() * 14;
          return (
            <Animated.View key={r.id} entering={FadeInRight.delay(Math.min(i, 10) * 30).springify().damping(16)}>
              <Pressable
                onPress={() => onOpen(r)}
                style={({ pressed }) => [
                  styles.tab,
                  { maxWidth: tabMax, paddingRight: 14 + extra, backgroundColor: color },
                  pressed && { transform: [{ translateX: -4 }] },
                ]}>
                <Text numberOfLines={1} style={[styles.tabText, DARK_TEXT.has(color) && styles.tabTextDark]}>
                  {shortLabel(r)}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const shadow = {
  shadowColor: '#7a2c00',
  shadowOpacity: 0.18,
  shadowRadius: 6,
  shadowOffset: { width: -1, height: 2 },
  elevation: 4,
};

const styles = StyleSheet.create({
  // 시트 오른쪽 끝에 딱 붙인다
  wrap: { position: 'absolute', right: 0, alignItems: 'flex-end' },
  peek: { gap: 3, alignItems: 'flex-end', paddingVertical: 4 },
  peekTab: { height: 12, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, ...shadow },
  tabs: { alignItems: 'flex-end', gap: 4, paddingVertical: 4, paddingLeft: 12 },
  tab: {
    minWidth: 64,
    height: 32,
    justifyContent: 'center',
    paddingLeft: 14,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    ...shadow,
  },
  tabText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansBold },
  tabTextDark: { color: COLORS.ink },
  closeTab: { minWidth: 44, height: 28, paddingRight: 14, backgroundColor: COLORS.surface, alignItems: 'center' },
  closeText: { color: COLORS.ink, fontSize: 12, fontFamily: FONTS.sansBold },
});
