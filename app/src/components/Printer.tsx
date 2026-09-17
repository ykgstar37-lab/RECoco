import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { bump, tear, tick } from '../lib/haptics';
import { RecordPaper, sizeOf } from '../templates';
import { COLORS, FONTS } from '../theme';
import { RecoRecord } from '../types';
import { COCO_BODY_BOTTOM, COCO_RATIO, Coco, CocoMood } from './Coco';
import { OutfitId } from './Outfits';

type Phase = 'printing' | 'ready' | 'torn';
const TEAR_DISTANCE = 130;
const COCO_TOP = 8;

interface JobProps {
  record: RecoRecord;
  /** 출력 영역 기준 폭 (기록 종류별 비율이 곱해짐) */
  rollWidth: number;
  onDone: (record: RecoRecord) => void;
  onCancel: () => void;
  outfit?: OutfitId | null;
}

/** 코코가 새 기록을 뽑아내고, 사용자가 아래로 잡아당겨 뜯어내는 과정 */
export function PrintJob({ record, rollWidth, onDone, onCancel, outfit }: JobProps) {
  const { width: screenW } = useWindowDimensions();
  const { width, height } = sizeOf(record, rollWidth);
  const [phase, setPhase] = useState<Phase>('printing');
  const [mood, setMood] = useState<CocoMood>('print');

  // 코코 몸통 폭(viewBox 332/400)이 영수증보다 살짝 넓게
  const cocoSize = Math.min(screenW - 24, Math.max(width, 260) / 0.8 + 20);
  const exitY = COCO_TOP + cocoSize * COCO_RATIO * COCO_BODY_BOTTOM - 12;

  const feed = useSharedValue(-height); // 코코 밑으로 나온 길이
  const pull = useSharedValue(0); // 사용자가 당긴 거리
  const drop = useSharedValue(0); // 뜯긴 뒤 떨어지는 애니메이션
  const backdrop = useSharedValue(0);
  const wobble = useSharedValue(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 220 });
    wobble.value = withRepeat(withSequence(withTiming(1, { duration: 90 }), withTiming(-1, { duration: 90 })), -1, true);
    const duration = Math.min(3200, Math.max(1500, height * 2.4));
    ticker.current = setInterval(tick, 110);
    feed.value = withTiming(0, { duration, easing: Easing.bezier(0.3, 0.05, 0.7, 1) }, (finished) => {
      if (finished) scheduleOnRN(finishPrinting);
    });
    return () => {
      if (ticker.current) clearInterval(ticker.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishPrinting() {
    if (ticker.current) clearInterval(ticker.current);
    cancelAnimation(wobble);
    wobble.value = withTiming(0);
    bump();
    setMood('idle');
    setPhase('ready');
  }

  function onTorn() {
    setPhase('torn');
    setMood('happy');
  }

  function complete() {
    onDone(record);
  }

  // 임계점을 넘는 순간 한 번 진동하고 코코가 놀란다
  useAnimatedReaction(
    () => pull.value > TEAR_DISTANCE,
    (over, prev) => {
      if (prev !== null && over !== prev) {
        scheduleOnRN(bump);
        scheduleOnRN(setMood, over ? 'wow' : 'idle');
      }
    },
  );

  const pan = Gesture.Pan()
    .enabled(phase === 'ready')
    .onUpdate((e) => {
      // 종이가 코코 몸에 물려 있어서 뻑뻑하게 늘어나는 느낌
      pull.value = Math.max(0, e.translationY) * 0.62;
    })
    .onEnd(() => {
      if (pull.value > TEAR_DISTANCE) {
        scheduleOnRN(tear);
        scheduleOnRN(onTorn);
        drop.value = withTiming(1, { duration: 560, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(complete);
        });
        backdrop.value = withTiming(0, { duration: 560 });
      } else {
        pull.value = withSpring(0, { damping: 14, stiffness: 220 });
      }
    });

  const paperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: feed.value + pull.value + drop.value * 260 },
      { rotate: `${drop.value * -3}deg` },
      { scale: 1 - drop.value * 0.08 },
    ],
    opacity: 1 - drop.value,
  }));
  const cocoStyle = useAnimatedStyle(() => ({
    opacity: 1 - drop.value,
    transform: [
      { translateX: wobble.value * 1.2 },
      // 출력 중엔 살짝 눌렸다 펴지고, 당기면 아래로 끌려 늘어난다
      { scaleY: 1 - Math.abs(wobble.value) * 0.015 + interpolate(pull.value, [0, TEAR_DISTANCE], [0, 0.05], 'clamp') },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: interpolate(pull.value, [0, 40], [1, 0.4], 'clamp') }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <View style={[styles.feedArea, { top: exitY }]}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ width, height, alignSelf: 'center', flexShrink: 0 }, paperStyle]}>
            <RecordPaper record={record} width={width} />
          </Animated.View>
        </GestureDetector>
      </View>
      <Animated.View pointerEvents="none" style={[styles.coco, { top: COCO_TOP, left: (screenW - cocoSize) / 2, transformOrigin: 'top' }, cocoStyle]}>
        <Coco size={cocoSize} mood={mood} tone="white" id="coco-print" outfit={outfit} />
      </Animated.View>

      {phase !== 'torn' && (
        <View pointerEvents="box-none" style={styles.footer}>
          <Animated.View style={[styles.hintBox, phase === 'ready' && hintStyle]}>
            <Text style={styles.hint}>{phase === 'printing' ? '코코가 영수증을 뽑는 중…' : '아래로 잡아당겨 뜯어주세요 ↓'}</Text>
          </Animated.View>
          <Pressable onPress={onCancel} style={styles.cancel} hitSlop={10}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: COLORS.orange },
  feedArea: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  coco: { position: 'absolute' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', gap: 10 },
  hintBox: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  hint: { color: COLORS.orange, fontSize: 15, fontFamily: FONTS.sansBold },
  cancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  cancelText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansBold },
});
