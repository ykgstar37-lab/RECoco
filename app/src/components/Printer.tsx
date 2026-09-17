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
import { COCO_RATIO, Coco, CocoMood, SPEW_EXIT_Y, SPEW_MOUTH_WIDTH } from './Coco';
import { OutfitId } from './Outfits';

type Phase = 'gag' | 'printing' | 'ready' | 'torn';
const TEAR_DISTANCE = 130;
const COCO_TOP = 8;
const GAG_MS = 650; // 볼 빵빵하게 참는 시간
const SHOUT = '우에에에엑!';

interface JobProps {
  record: RecoRecord;
  /** 출력 영역 기준 폭 (기록 종류별 비율이 곱해짐) */
  rollWidth: number;
  onDone: (record: RecoRecord) => void;
  onCancel: () => void;
  outfit?: OutfitId | null;
}

/** 코코가 "우에에에엑" 하고 입에서 새 기록을 뱉어내고, 사용자가 아래로 잡아당겨 뜯어내는 과정 */
export function PrintJob({ record, rollWidth, onDone, onCancel, outfit }: JobProps) {
  const { width: screenW } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>('gag');
  const [mood, setMood] = useState<CocoMood>('gag');
  const [shout, setShout] = useState(0); // "우에에에엑!" 중 보이는 글자 수

  // 코코를 크게 두고, 나오는 영수증은 벌린 입 폭에 맞춘다
  const cocoSize = Math.min(screenW - 16, 440);
  const mouthW = cocoSize * SPEW_MOUTH_WIDTH;
  const natural = sizeOf(record, rollWidth).width;
  const { width, height } = sizeOf(record, natural > mouthW ? (rollWidth * mouthW) / natural : rollWidth);
  const exitY = COCO_TOP + cocoSize * COCO_RATIO * SPEW_EXIT_Y;

  const feed = useSharedValue(-height); // 코코 밑으로 나온 길이
  const pull = useSharedValue(0); // 사용자가 당긴 거리
  const drop = useSharedValue(0); // 뜯긴 뒤 떨어지는 애니메이션
  const backdrop = useSharedValue(0);
  const wobble = useSharedValue(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const shouter = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 220 });
    // 1) 우욱… 볼이 빵빵해지며 부르르
    wobble.value = withRepeat(withSequence(withTiming(1, { duration: 70 }), withTiming(-1, { duration: 70 })), -1, true);
    bump();
    const start = setTimeout(() => {
      // 2) 우에에에엑! 입을 크게 벌리고 영수증이 나온다
      setPhase('printing');
      setMood('spew');
      bump();
      const duration = Math.min(3200, Math.max(1500, height * 2.4));
      ticker.current = setInterval(tick, 110);
      setShout(1);
      shouter.current = setInterval(() => setShout((n) => Math.min(SHOUT.length, n + 1)), Math.max(120, duration / (SHOUT.length + 2)));
      feed.value = withTiming(0, { duration, easing: Easing.bezier(0.3, 0.05, 0.7, 1) }, (finished) => {
        if (finished) scheduleOnRN(finishPrinting);
      });
    }, GAG_MS);
    return () => {
      clearTimeout(start);
      if (ticker.current) clearInterval(ticker.current);
      if (shouter.current) clearInterval(shouter.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishPrinting() {
    if (ticker.current) clearInterval(ticker.current);
    if (shouter.current) clearInterval(shouter.current);
    setShout(SHOUT.length);
    cancelAnimation(wobble);
    wobble.value = withTiming(0);
    bump();
    // 다 뱉고 나서도 뜯을 때까지 입에 물고 있다
    setPhase('ready');
  }

  function onTorn() {
    setPhase('torn');
    setShout(0);
    setMood('happy');
  }

  function complete() {
    onDone(record);
  }

  // 임계점을 넘는 순간 한 번 진동한다 (입은 계속 물고 있음)
  useAnimatedReaction(
    () => pull.value > TEAR_DISTANCE,
    (over, prev) => {
      if (prev !== null && over !== prev) scheduleOnRN(bump);
    },
  );

  const pan = Gesture.Pan()
    .enabled(phase === 'ready')
    .onUpdate((e) => {
      // 종이가 코코 입에 물려 있어서 뻑뻑하게 늘어나는 느낌
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
      // 뱉는 동안 부르르 떨고, 당기면 살짝 끌려 내려온다 (입 위치가 크게 어긋나지 않게 조금만)
      { translateY: interpolate(pull.value, [0, TEAR_DISTANCE], [0, 6], 'clamp') },
      { scaleX: 1 + Math.abs(wobble.value) * 0.012 },
    ],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const shoutStyle = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value * 2 }, { rotate: '-8deg' }] }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: interpolate(pull.value, [0, 40], [1, 0.4], 'clamp') }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <Animated.View pointerEvents="none" style={[styles.coco, { top: COCO_TOP, left: (screenW - cocoSize) / 2, transformOrigin: 'bottom' }, cocoStyle]}>
        <Coco size={cocoSize} mood={mood} tone="white" id="coco-print" outfit={outfit} />
      </Animated.View>
      {/* 영수증은 코코 앞에 그리고, 입 안 선에서 잘라 입에서 나오는 것처럼 */}
      <View style={[styles.feedArea, { top: exitY }]}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ width, height, alignSelf: 'center', flexShrink: 0 }, paperStyle]}>
            <RecordPaper record={record} width={width} />
          </Animated.View>
        </GestureDetector>
      </View>
      {shout > 0 && (
        <Animated.View pointerEvents="none" style={[styles.shoutBox, { top: COCO_TOP + cocoSize * COCO_RATIO * 0.2 }, shoutStyle]}>
          <Text style={styles.shout}>{SHOUT.slice(0, shout)}</Text>
        </Animated.View>
      )}

      {phase !== 'torn' && (
        <View pointerEvents="box-none" style={styles.footer}>
          <Animated.View style={[styles.hintBox, phase === 'ready' && hintStyle]}>
            <Text style={styles.hint}>{phase === 'ready' ? '아래로 잡아당겨 뜯어주세요 ↓' : phase === 'gag' ? '우욱…' : '코코가 영수증을 뱉는 중…'}</Text>
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
  shoutBox: { position: 'absolute', right: 14 },
  shout: {
    color: '#fff',
    fontSize: 34,
    fontFamily: FONTS.sansHeavy,
    textShadowColor: 'rgba(122,44,0,0.45)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 0,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', gap: 10 },
  hintBox: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  hint: { color: COLORS.orange, fontSize: 15, fontFamily: FONTS.sansBold },
  cancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  cancelText: { color: '#fff', fontSize: 13, fontFamily: FONTS.sansBold },
});
