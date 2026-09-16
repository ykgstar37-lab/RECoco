import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { seededRandom } from '../lib/format';
import { bump } from '../lib/haptics';
import { FourcutBack, FourcutFront, sizeOf } from '../templates';
import { COLORS, FONTS } from '../theme';
import { FourcutRecord, RecoRecord } from '../types';

interface Props {
  record: FourcutRecord;
  rollWidth: number;
  onLongPress?: (record: RecoRecord) => void;
}

/** 인생네컷: 탭하면 앞(사진) ↔ 뒤(오늘의 하루)로 뒤집힌다 */
function FlipCardBase({ record, rollWidth, onLongPress }: Props) {
  const { width, height } = sizeOf(record, rollWidth);
  const flip = useSharedValue(0); // 0 앞면, 1 뒷면
  const tilt = useMemo(() => (seededRandom(record.id)() - 0.5) * 3, [record.id]);

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      flip.value = withTiming(flip.value > 0.5 ? 0 : 1, { duration: 620, easing: Easing.inOut(Easing.cubic) });
      scheduleOnRN(bump);
    });
  const longPress = Gesture.LongPress()
    .minDuration(550)
    .onStart(() => {
      if (onLongPress) scheduleOnRN(onLongPress, record);
    });

  // 뒤집히는 순간 살짝 들렸다 내려오는 느낌
  const lift = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(flip.value, [0, 0.5, 1], [1, 1.06, 1]) }],
  }));
  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));
  const hint = useAnimatedStyle(() => ({ opacity: interpolate(flip.value, [0, 0.2], [1, 0], 'clamp') }));

  return (
    <View style={{ alignItems: 'center', paddingBottom: 26 }}>
      <GestureDetector gesture={Gesture.Exclusive(longPress, tap)}>
        <Animated.View style={[{ width, height, transform: [{ rotate: `${tilt}deg` }] }]}>
          <Animated.View style={[StyleSheet.absoluteFill, lift]}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.face, front]}>
              <FourcutFront record={record} width={width} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.face, back]}>
              <FourcutBack record={record} width={width} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Animated.View pointerEvents="none" style={[styles.hint, hint]}>
        <Text style={styles.hintText}>↻ 탭해서 뒤집기</Text>
      </Animated.View>
    </View>
  );
}

export const FlipCard = memo(FlipCardBase);

const styles = StyleSheet.create({
  face: { backfaceVisibility: 'hidden' },
  hint: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.orange,
  },
  hintText: { color: '#fff', fontSize: 11, fontFamily: FONTS.sansBold },
});
