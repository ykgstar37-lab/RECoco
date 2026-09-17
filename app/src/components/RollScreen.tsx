import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, LinearTransition, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { KIND_LABEL } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecoRecord, RecordKind } from '../types';
import { CATEGORIES } from './CategoryPicker';
import { FlipCard } from './FlipCard';
import { FoldableReceipt } from './FoldableReceipt';
import { RecordDetail } from './RecordDetail';

interface Props {
  visible: boolean;
  records: RecoRecord[];
  /** YYYY-MM-DD 로 거르기 (null이면 전체) */
  date: string | null;
  onClearDate: () => void;
  onClose: () => void;
  onSave: (record: RecoRecord) => void;
  onDelete: (record: RecoRecord) => void;
}

/** 모아둔 영수증을 세로로 길게 이어서 보는 화면 */
export function RollScreen({ visible, records, date, onClearDate, onClose, onSave, onDelete }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [kind, setKind] = useState<RecordKind | null>(null);

  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const drag = useSharedValue(screenH); // 시트가 아래로 내려간 거리

  // 열 때마다 카테고리는 '전체'부터, 시트는 아래에서 올라온다
  useEffect(() => {
    if (!visible) return;
    setKind(null);
    drag.value = screenH;
    drag.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => {
    drag.value = withTiming(screenH, { duration: 240, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(onClose);
    });
  };

  // 손잡이·제목 부분을 아래로 끌어내리면 닫힌다
  const pull = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      drag.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        drag.value = withTiming(screenH, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onClose);
        });
      } else {
        drag.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, drag.value / screenH),
  }));
  const detail = records.find((r) => r.id === detailId) ?? null;
  const open = (record: RecoRecord) => setDetailId(record.id);
  const { width: screenW } = useWindowDimensions();
  const paperW = Math.min(screenW - 44, 440);
  // 날짜 → 카테고리 순서로 거른다 (둘 다 걸 수 있음)
  const byDate = date ? records.filter((r) => r.date === date) : records;
  const list = kind ? byDate.filter((r) => r.kind === kind) : byDate;
  const kindLabel = kind ? CATEGORIES.find((c) => c.kind === kind)?.label : null;
  const title = date
    ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일의 ${kindLabel ?? ''} 영수증`.replace('  ', ' ')
    : kindLabel
      ? `${kindLabel} 영수증`
      : '나의 영수증';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      {/* Modal 안에서도 제스처(펼치기·뒤집기·끌어내리기)가 동작하도록 */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="닫기" />
        </Animated.View>

        {/* 위쪽이 둥근 시트 */}
        <Animated.View style={[styles.sheet, { marginTop: insets.top + 12, paddingBottom: insets.bottom }, sheetStyle]}>
          <GestureDetector gesture={pull}>
            <View>
              <View style={styles.grip} />
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.count}>{list.length}장</Text>
                </View>
                {date && (
                  <Pressable onPress={onClearDate} hitSlop={8} style={styles.chip}>
                    <Text style={styles.chipText}>전체 보기</Text>
                  </Pressable>
                )}
                <Pressable onPress={close} hitSlop={10} style={styles.close} accessibilityLabel="닫기">
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>
            </View>
          </GestureDetector>

          {/* 카테고리 탭: 누르면 그 카테고리 영수증만 줄줄이 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
            {[{ kind: null, label: '전체' }, ...CATEGORIES].map((c) => {
              const on = kind === c.kind;
              const n = c.kind ? byDate.filter((r) => r.kind === c.kind).length : byDate.length;
              return (
                <Pressable key={c.label} onPress={() => setKind(c.kind)} style={[styles.tab, on && styles.tabOn]}>
                  <Text style={[styles.tabText, on && styles.tabTextOn]}>{c.label}</Text>
                  <Text style={[styles.tabCount, on && styles.tabTextOn]}>{n}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {list.length === 0 && (
              <Text style={styles.empty}>{kindLabel ? `아직 뽑은 ${kindLabel} 영수증이 없어요.` : '아직 뽑은 영수증이 없어요.'}</Text>
            )}
            {list.map((record) => (
              <Animated.View key={record.id} layout={LinearTransition.springify().damping(18)} style={styles.item}>
                <View style={[styles.itemHead, { width: paperW }]}>
                  <Text style={styles.itemLabel}>
                    {record.date.replace(/-/g, '.')} · {KIND_LABEL[record.kind]}
                  </Text>
                  <Pressable onPress={() => open(record)} hitSlop={8} style={styles.more}>
                    <Text style={styles.moreText}>크게 보기</Text>
                  </Pressable>
                </View>
                {record.kind === 'fourcut' ? (
                  <FlipCard record={record} rollWidth={paperW} onLongPress={open} />
                ) : (
                  <FoldableReceipt record={record} rollWidth={paperW} onLongPress={open} />
                )}
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
        <RecordDetail
          key={detailId ?? 'none'}
          record={detail}
          onClose={() => setDetailId(null)}
          onSave={onSave}
          onDelete={(r) => {
            setDetailId(null);
            onDelete(r);
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(40,20,0,0.35)' },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  grip: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#dcdce0',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: { fontSize: 22, color: COLORS.ink, fontFamily: FONTS.sansHeavy },
  count: {
    fontSize: 13,
    color: COLORS.sub,
    fontFamily: FONTS.sans,
    marginTop: 2,
  },
  chip: {
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: { color: COLORS.orange, fontSize: 13, fontFamily: FONTS.sansBold },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: COLORS.ink, fontSize: 15, fontFamily: FONTS.sansBold },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: { paddingHorizontal: 18, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  tabOn: { backgroundColor: COLORS.orange },
  tabText: { color: COLORS.ink, fontSize: 14, fontFamily: FONTS.sansBold },
  tabCount: { color: COLORS.sub, fontSize: 12, fontFamily: FONTS.sans },
  tabTextOn: { color: '#fff' },
  list: { alignItems: 'center', paddingBottom: 60 },
  item: { alignItems: 'center', width: '100%', paddingHorizontal: 22 },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 8,
  },
  itemLabel: { fontSize: 12, color: COLORS.sub, fontFamily: FONTS.sans },
  more: {
    backgroundColor: COLORS.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  moreText: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
  empty: {
    color: COLORS.sub,
    fontSize: 15,
    fontFamily: FONTS.sans,
    paddingTop: 80,
  },
});
