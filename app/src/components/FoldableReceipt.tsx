import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { seededRandom } from '../lib/format';
import { bump } from '../lib/haptics';
import { RecordPaper, sizeOf } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';

const PAPER_EDGE: Record<RecoRecord['kind'], string> = {
  reading: '#ecece8',
  movie: '#e6d9e2',
  spending: '#ede9dc',
  travel: '#e8e8e5',
  fourcut: '#efe9dc',
  gift: '#ecebe8',
  food: '#e9e4d6',
  show: '#e7e3ea',
  concert: '#e8e0d2',
};

const SPRING = { damping: 18, stiffness: 150, mass: 0.9 };

interface Props {
  record: RecoRecord;
  rollWidth: number;
  initiallyOpen?: boolean;
  /** 영수증 롤로 이어 붙일 때: 기울이지 않고, 접지 않고, 아래 여백 없이 */
  connected?: boolean;
  onLongPress?: (record: RecoRecord) => void;
}

/**
 * 롤 안의 기록 한 장. 접힌 상태로 윗부분만 보이고,
 * 아래 손잡이를 잡아당기거나 탭하면 종이가 펼쳐진다.
 */
function FoldableReceiptBase({ record, rollWidth, initiallyOpen = false, connected = false, onLongPress }: Props) {
  const size = sizeOf(record, rollWidth);
  const { width, height } = size;
  // 접는 지점이 없는 짧은 카드(사진 없는 탑승권 등)는 항상 펼친 채로 둔다
  const foldable = size.foldHeight > 0 && !connected;
  const foldHeight = foldable ? size.foldHeight : height;
  const range = Math.max(1, height - foldHeight);
  const open = useSharedValue(initiallyOpen || !foldable ? 1 : 0);
  const dragStart = useSharedValue(0);
  const tilt = useMemo(() => (connected ? 0 : (seededRandom(record.id)() - 0.5) * 1.6), [record.id, connected]);

  const shownHeight = useDerivedValue(() => foldHeight + range * open.value);

  const toggle = () => {
    'worklet';
    if (!foldable) return;
    open.value = withSpring(open.value > 0.5 ? 0 : 1, SPRING);
    scheduleOnRN(bump);
  };

  const tap = Gesture.Tap().maxDuration(250).onEnd(toggle);
  const longPress = Gesture.LongPress()
    .minDuration(550)
    .onStart(() => {
      if (onLongPress) scheduleOnRN(onLongPress, record);
    });

  // 손잡이 드래그: 손가락을 따라 종이가 풀려 나온다
  const pull = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onBegin(() => {
      dragStart.value = open.value;
    })
    .onUpdate((e) => {
      open.value = Math.min(1.04, Math.max(0, dragStart.value + e.translationY / range));
    })
    .onEnd((e) => {
      const target = e.velocityY > 500 ? 1 : e.velocityY < -500 ? 0 : open.value > 0.4 ? 1 : 0;
      open.value = withSpring(target, { ...SPRING, velocity: e.velocityY / range });
      scheduleOnRN(bump);
    });

  const clipStyle = useAnimatedStyle(() => ({ height: shownHeight.value }));
  const foldShade = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.6], [1, 0], 'clamp') }));
  const edgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.3], [1, 0], 'clamp'),
    transform: [{ translateY: shownHeight.value - 4 }],
  }));
  const tabStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shownHeight.value - 14 }] }));
  const openLabel = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0.5, 1], [0, 1], 'clamp') }));
  const closedLabel = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.5], [1, 0], 'clamp') }));

  return (
    <View style={{ width, transform: [{ rotate: `${tilt}deg` }] }}>
      {/* 접혀 들어간 종이의 겹친 가장자리 */}
      <Animated.View pointerEvents="none" style={[styles.edges, edgeStyle]}>
        <View style={[styles.edge, { backgroundColor: PAPER_EDGE[record.kind], marginHorizontal: width * 0.035 }]} />
        <View style={[styles.edge, styles.edge2, { backgroundColor: PAPER_EDGE[record.kind], marginHorizontal: width * 0.06 }]} />
      </Animated.View>

      <GestureDetector gesture={Gesture.Exclusive(longPress, tap)}>
        <Animated.View style={[styles.clip, clipStyle]}>
          <View style={{ width, height, flexShrink: 0 }}>
            <RecordPaper record={record} width={width} connected={connected} />
          </View>
          <Animated.View pointerEvents="none" style={[styles.shade, foldShade]}>
            <Svg width={width} height={70}>
              <Defs>
                <LinearGradient id="fold" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000" stopOpacity={0} />
                  <Stop offset="0.75" stopColor="#3b3326" stopOpacity={0.1} />
                  <Stop offset="1" stopColor="#3b3326" stopOpacity={0.22} />
                </LinearGradient>
              </Defs>
              <Rect x={width * 0.02} width={width * 0.96} height={70} fill="url(#fold)" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {foldable && (
        <GestureDetector gesture={pull}>
          <Animated.View style={[styles.tab, tabStyle]} hitSlop={{ top: 14, bottom: 14, left: 30, right: 30 }}>
            <View style={styles.tabGrip} />
            <View>
              <Animated.Text style={[styles.tabText, closedLabel]}>당겨서 펼치기</Animated.Text>
              <Animated.Text style={[styles.tabText, styles.tabTextOver, openLabel]}>밀어서 접기</Animated.Text>
            </View>
          </Animated.View>
        </GestureDetector>
      )}
      {!connected && <View style={{ height: 22 }} />}
    </View>
  );
}

export const FoldableReceipt = memo(FoldableReceiptBase);

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  edges: { position: 'absolute', left: 0, right: 0, top: 0 },
  edge: {
    height: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  edge2: { height: 6, opacity: 0.85 },
  tab: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tabGrip: { width: 16, height: 3, borderRadius: 2, backgroundColor: COLORS.orange },
  tabText: { color: COLORS.orange, fontSize: 12, fontFamily: FONTS.sansBold },
  tabTextOver: { position: 'absolute', left: 0, top: 0 },
});
