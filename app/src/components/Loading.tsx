// 기다리는 동안 화면을 흰색으로 흐리게 덮고 가운데에 주황 표시를 돌린다 (글 안내 없이).
// 덮는 동안에는 아래를 못 누른다 — 사진이 다 들어오기 전에 '뽑기' 를 누르는 일 등을 막는다.
// Modal 은 따로 떠서 그 안에도 하나씩 둬야 보인다 (RecordForm, RecordDetail, QrImport).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useBusy } from '../lib/busy';
import { BRAND, COLORS, FONTS } from '../theme';

/** 'ring': 작은 주황 고리 / 'word': RECoco 글자가 한 자씩 커졌다 작아진다 / 'both': 뜰 때마다 번갈아 (기기에서 둘을 견줘 보기용, 고르면 하나로) */
const MARK: 'ring' | 'word' | 'both' = 'both';
let shows = 0;

/** visible 을 안 주면 lib/busy 의 withBusy 를 따른다 */
export function LoadingOverlay({ visible }: { visible?: boolean }) {
  const busy = useBusy();
  if (!(visible ?? busy)) return null;
  return <Overlay />;
}

function Overlay() {
  const [word] = useState(() => (MARK === 'both' ? shows++ % 2 === 1 : MARK === 'word'));
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.overlay} accessibilityLabel="불러오는 중">
      {word ? <LoadingWord /> : <LoadingRing />}
    </Animated.View>
  );
}

function useLoop(to: number, duration: number) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(to, { duration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t, to, duration]);
  return t;
}

export function LoadingRing({ size = 26 }: { size?: number }) {
  const t = useLoop(360, 800);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value}deg` }] }));
  return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, spin]} />;
}

const LETTERS = BRAND.en.split('');
/** 한 글자가 튀는 시간(ms). 마지막 글자 뒤에 한 박자 쉬고 처음부터 */
const BEAT = 170;

export function LoadingWord() {
  const t = useLoop(LETTERS.length + 1, BEAT * (LETTERS.length + 1));
  return (
    <View style={styles.word}>
      {LETTERS.map((c, i) => (
        <Letter key={i} char={c} index={i} t={t} />
      ))}
    </View>
  );
}

function Letter({ char, index, t }: { char: string; index: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = t.value - index;
    const k = d > 0 && d < 1 ? Math.sin(Math.PI * d) : 0;
    return { transform: [{ translateY: interpolate(k, [0, 1], [0, -5]) }, { scale: interpolate(k, [0, 1], [1, 1.45]) }] };
  });
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderWidth: 3, borderColor: 'rgba(255,122,47,0.18)', borderTopColor: COLORS.orange },
  word: { flexDirection: 'row', alignItems: 'flex-end' },
  letter: { fontSize: 22, fontFamily: FONTS.sansHeavy, color: COLORS.orange, marginHorizontal: 1 },
});
