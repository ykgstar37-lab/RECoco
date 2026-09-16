import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export const PRINTER_HEIGHT = 64;
/** 프린터 출구(슬롯)의 y 위치. 롤과 출력 중인 영수증은 이 선 아래에서 나온다 */
export const SLOT_Y = PRINTER_HEIGHT - 12;

export function PrinterBar({ active }: { active: boolean }) {
  const shake = useSharedValue(0);
  const led = useSharedValue(0.35);

  useEffect(() => {
    if (active) {
      shake.value = withRepeat(withSequence(withTiming(0.7, { duration: 45 }), withTiming(-0.7, { duration: 45 })), -1, true);
      led.value = withRepeat(withTiming(1, { duration: 260 }), -1, true);
    } else {
      cancelAnimation(shake);
      cancelAnimation(led);
      shake.value = withTiming(0);
      led.value = withTiming(0.35);
    }
  }, [active, led, shake]);

  const body = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const light = useAnimatedStyle(() => ({ opacity: led.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.printer, body]}>
      <View style={styles.printerTop}>
        <Text style={styles.printerLabel}>THERMAL · 58mm</Text>
        <Animated.View style={[styles.led, active && styles.ledOn, light]} />
      </View>
      <View style={styles.slot} />
    </Animated.View>
  );
}

type Phase = 'printing' | 'ready' | 'torn';
const TEAR_DISTANCE = 130;

interface JobProps {
  record: RecoRecord;
  /** 출력 영역 기준 폭 (기록 종류별 비율이 곱해짐) */
  rollWidth: number;
  onDone: (record: RecoRecord) => void;
  onCancel: () => void;
}

/** 새 기록을 출력하고, 사용자가 아래로 잡아당겨 뜯어내는 과정 */
export function PrintJob({ record, rollWidth, onDone, onCancel }: JobProps) {
  const { width, height } = sizeOf(record, rollWidth);
  const [phase, setPhase] = useState<Phase>('printing');
  const feed = useSharedValue(-height); // 프린터에서 나온 길이
  const pull = useSharedValue(0); // 사용자가 당긴 거리
  const drop = useSharedValue(0); // 뜯긴 뒤 떨어지는 애니메이션
  const backdrop = useSharedValue(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 220 });
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
    bump();
    setPhase('ready');
  }

  function complete() {
    onDone(record);
  }

  // 임계점을 넘는 순간 한 번 진동
  useAnimatedReaction(
    () => pull.value > TEAR_DISTANCE,
    (over, prev) => {
      if (prev !== null && over !== prev) scheduleOnRN(bump);
    },
  );

  const pan = Gesture.Pan()
    .enabled(phase === 'ready')
    .onUpdate((e) => {
      // 종이가 프린터에 물려 있어서 뻑뻑하게 늘어나는 느낌
      pull.value = Math.max(0, e.translationY) * 0.62;
    })
    .onEnd(() => {
      if (pull.value > TEAR_DISTANCE) {
        scheduleOnRN(tear);
        scheduleOnRN(setPhase, 'torn');
        drop.value = withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(complete);
        });
        backdrop.value = withTiming(0, { duration: 520 });
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
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pull.value, [0, 40], [1, 0.4], 'clamp'),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <View style={styles.feedArea}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[{ width, height, alignSelf: 'center', flexShrink: 0 }, paperStyle]}>
            <RecordPaper record={record} width={width} />
          </Animated.View>
        </GestureDetector>
      </View>

      {phase !== 'torn' && (
        <View pointerEvents="box-none" style={styles.footer}>
          {phase === 'printing' ? (
            <View style={styles.hintBox}>
              <Text style={styles.hint}>출력 중…</Text>
            </View>
          ) : (
            <Animated.View style={[styles.hintBox, hintStyle]}>
              <Text style={styles.hint}>종이를 아래로 잡아당겨 뜯어내세요</Text>
              <Text style={styles.arrow}>↓</Text>
            </Animated.View>
          )}
          <Pressable onPress={onCancel} style={styles.cancel} hitSlop={10}>
            <Text style={styles.cancelText}>출력 취소</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  printer: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: PRINTER_HEIGHT,
    borderRadius: 16,
    backgroundColor: COLORS.printer,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 10,
  },
  printerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  printerLabel: { color: '#8b8890', fontSize: 10, letterSpacing: 2, fontFamily: FONTS.monoBold },
  led: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5e5b62' },
  ledOn: { backgroundColor: '#7ee08a' },
  slot: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0e0e10',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.printerLight,
  },
  backdrop: { backgroundColor: 'rgba(214,208,197,0.94)' },
  feedArea: { position: 'absolute', top: SLOT_Y, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', gap: 12 },
  hintBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(43,42,46,0.9)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  hint: { color: '#f3efe7', fontSize: 14, fontFamily: FONTS.monoBold, textAlign: 'center' },
  arrow: { color: '#f3efe7', fontSize: 16, marginTop: 2 },
  cancel: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)' },
  cancelText: { color: COLORS.sub, fontSize: 13, fontFamily: FONTS.mono },
});
