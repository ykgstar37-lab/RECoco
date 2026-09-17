// 레코코 마스코트 "코코": 말랑한 만두 모양. 누르면 슬라임처럼 눌렸다가 출렁이며 돌아온다
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Circle, Defs, Ellipse, G, Path } from 'react-native-svg';

import { bump } from '../lib/haptics';
import { COVERS_KNOB, OutfitArt, OutfitId } from './Outfits';

export type CocoMood = 'idle' | 'happy' | 'print' | 'wow' | 'squish' | 'blink' | 'gag' | 'spew';
export type CocoTone = 'orange' | 'white';

const VB_W = 400;
const VB_H = 320;
export const COCO_RATIO = VB_H / VB_W;

// "우에에에엑" 입: 눈 아래로 크게 벌린 입. 영수증은 입 안(SPEW_EXIT_Y)에서 나온다
const SPEW = { left: 68, right: 332, top: 214, bottom: 292 };
export const SPEW_EXIT_Y = 236 / VB_H;
export const SPEW_MOUTH_WIDTH = (SPEW.right - SPEW.left - 16) / VB_W;

const TONES: Record<CocoTone, { body: string; pleat: string; blush: string; mouth: string; tongue: string; shadow: string }> = {
  orange: { body: '#fb9449', pleat: '#e8692a', blush: '#f5675b', mouth: '#ffffff', tongue: '#f06470', shadow: 'rgba(0,0,0,0.06)' },
  white: { body: '#ffffff', pleat: '#ffc9a1', blush: '#ffb18c', mouth: '#3a2a22', tongue: '#f06470', shadow: 'rgba(120,40,0,0.14)' },
};
const EYE = '#3a2a22';

// 둥근 만두 몸통 + 윗부분 꼭지(주름)
const BODY =
  'M40,256 C40,150 108,84 186,78 C196,58 206,40 222,40 C232,40 238,46 240,52 C250,46 262,50 264,60 C272,62 276,72 270,82 C330,98 360,160 360,256 C360,292 336,300 300,301 C250,303 150,303 100,301 C64,300 40,292 40,256 Z';

// 꼭지 없이 둥글게 닫은 몸통 (모자를 쓸 때)
const BODY_ROUND =
  'M40,256 C40,150 108,84 186,78 C214,74 244,76 270,82 C330,98 360,160 360,256 C360,292 336,300 300,301 C250,303 150,303 100,301 C64,300 40,292 40,256 Z';

function Eyes({ mood }: { mood: CocoMood }) {
  const L = 158;
  const R = 242;
  const Y = 190;
  if (mood === 'happy') {
    return (
      <G>
        {[L, R].map((x) => (
          <Path key={x} d={`M${x - 15},${Y + 5} Q${x},${Y - 13} ${x + 15},${Y + 5}`} stroke={EYE} strokeWidth={8} strokeLinecap="round" fill="none" />
        ))}
      </G>
    );
  }
  if (mood === 'blink') {
    return (
      <G>
        {[L, R].map((x) => (
          <Path key={x} d={`M${x - 14},${Y + 2} Q${x},${Y + 10} ${x + 14},${Y + 2}`} stroke={EYE} strokeWidth={7} strokeLinecap="round" fill="none" />
        ))}
      </G>
    );
  }
  if (mood === 'squish' || mood === 'gag' || mood === 'spew') {
    return (
      <G>
        <Path d={`M${L - 12},${Y - 11} L${L + 9},${Y} L${L - 12},${Y + 11}`} stroke={EYE} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d={`M${R + 12},${Y - 11} L${R - 9},${Y} L${R + 12},${Y + 11}`} stroke={EYE} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    );
  }
  const r = mood === 'wow' ? 17 : 14.5;
  return (
    <G>
      <Circle cx={L} cy={Y} r={r} fill={EYE} />
      <Circle cx={R} cy={Y} r={r} fill={EYE} />
    </G>
  );
}

function Mouth({ mood, tone, clipId }: { mood: CocoMood; tone: CocoTone; clipId: string }) {
  const c = TONES[tone];
  if (mood === 'print') {
    return <Path d="M184,236 Q200,244 216,236" stroke={EYE} strokeWidth={8} strokeLinecap="round" fill="none" />;
  }
  if (mood === 'gag') {
    // 볼 빵빵, 입은 꾹 다물고 울렁울렁
    return <Path d="M174,240 Q182,232 190,240 Q198,248 206,240 Q214,232 222,240" stroke={EYE} strokeWidth={7} strokeLinecap="round" fill="none" />;
  }
  if (mood === 'spew') {
    const { left, right, top, bottom } = SPEW;
    const d = `M${left + 14},${top} Q200,${top - 8} ${right - 14},${top} Q${right},${top + 2} ${right},${top + 20} L${right - 6},${bottom - 22} Q${right - 10},${bottom} ${right - 34},${bottom} L${left + 34},${bottom} Q${left + 10},${bottom} ${left + 6},${bottom - 22} L${left},${top + 20} Q${left},${top + 2} ${left + 14},${top} Z`;
    return (
      <G>
        <Path d={d} fill={c.mouth} />
        <Path d={`M${left + 20},${top + 10} Q200,${top + 2} ${right - 20},${top + 10}`} stroke="#1f1612" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
      </G>
    );
  }
  if (mood === 'wow' || mood === 'squish') {
    const ry = mood === 'wow' ? 20 : 13;
    return (
      <G>
        <Ellipse cx={200} cy={240} rx={17} ry={ry} fill={c.mouth} />
        <Ellipse cx={200} cy={240 + ry * 0.45} rx={11} ry={ry * 0.45} fill={c.tongue} />
      </G>
    );
  }
  const w = mood === 'happy' ? 48 : 42;
  const d = `M${200 - w},224 Q200,217 ${200 + w},224 Q${200 + w + 5},227 ${200 + w - 2},236 C${200 + w - 14},272 ${200 - w + 14},272 ${200 - w + 2},236 Q${200 - w - 5},227 ${200 - w},224 Z`;
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      <Path d={d} fill={c.mouth} />
      <Ellipse cx={200} cy={266} rx={w * 0.6} ry={19} fill={c.tongue} clipPath={`url(#${clipId})`} />
    </G>
  );
}

/** 코코 그림만 (정적) */
export function CocoArt({
  size,
  mood = 'idle',
  tone = 'orange',
  id = 'coco',
  outfit,
}: {
  size: number;
  mood?: CocoMood;
  tone?: CocoTone;
  id?: string;
  outfit?: OutfitId | null;
}) {
  const c = TONES[tone];
  return (
    <Svg width={size} height={size * COCO_RATIO} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Ellipse cx={200} cy={306} rx={150} ry={10} fill={c.shadow} />
      {outfit && COVERS_KNOB[outfit] ? (
        <Path d={BODY_ROUND} fill={c.body} />
      ) : (
        <>
          <Path d={BODY} fill={c.body} />
          <Path d="M214,58 Q206,72 196,80" stroke={c.pleat} strokeWidth={7} strokeLinecap="round" fill="none" />
          <Path d="M246,64 Q238,76 242,90" stroke={c.pleat} strokeWidth={7} strokeLinecap="round" fill="none" />
        </>
      )}
      {mood === 'spew' ? (
        // 입이 커서 볼터치는 눈 옆으로
        <>
          <Ellipse cx={100} cy={196} rx={22} ry={12} fill={c.blush} opacity={0.85} />
          <Ellipse cx={300} cy={196} rx={22} ry={12} fill={c.blush} opacity={0.85} />
        </>
      ) : (
        <>
          <Ellipse cx={108} cy={228} rx={mood === 'gag' ? 32 : 24} ry={mood === 'gag' ? 19 : 13} fill={c.blush} opacity={mood === 'gag' ? 1 : 0.85} />
          <Ellipse cx={292} cy={228} rx={mood === 'gag' ? 32 : 24} ry={mood === 'gag' ? 19 : 13} fill={c.blush} opacity={mood === 'gag' ? 1 : 0.85} />
        </>
      )}
      <Eyes mood={mood} />
      <Mouth mood={mood} tone={tone} clipId={`${id}-mouth`} />
      {outfit && <OutfitArt id={outfit} />}
    </Svg>
  );
}

/**
 * 살아있는 코코: 눈 깜빡임 + (interactive면) 누르면 말랑하게 눌림
 */
export function Coco({
  size,
  mood = 'idle',
  tone = 'orange',
  id = 'coco',
  interactive = false,
  outfit,
  onPress,
}: {
  size: number;
  mood?: CocoMood;
  tone?: CocoTone;
  id?: string;
  interactive?: boolean;
  outfit?: OutfitId | null;
  onPress?: () => void;
}) {
  const [blink, setBlink] = useState(false);
  const [pressed, setPressed] = useState(false);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const lift = useSharedValue(0);

  // 가끔 눈을 깜빡인다
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          loop();
        }, 120);
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scaleX: sx.value }, { scaleY: sy.value }],
  }));

  const pressIn = () => {
    setPressed(true);
    bump();
    // 옆으로 퍼지면서 납작하게
    sx.value = withSpring(1.16, { damping: 12, stiffness: 260 });
    sy.value = withSpring(0.8, { damping: 12, stiffness: 260 });
  };
  const pressOut = () => {
    setPressed(false);
    // 탱- 하고 튀어올랐다가 출렁이며 제자리
    sx.value = withSequence(withTiming(0.9, { duration: 110 }), withSpring(1, { damping: 5, stiffness: 180, mass: 0.7 }));
    sy.value = withSequence(withTiming(1.14, { duration: 110 }), withSpring(1, { damping: 5, stiffness: 180, mass: 0.7 }));
    lift.value = withSequence(withTiming(-size * 0.06, { duration: 130 }), withSpring(0, { damping: 7, stiffness: 200 }));
  };

  const face: CocoMood = pressed ? 'squish' : blink && (mood === 'idle' || mood === 'print') ? 'blink' : mood;
  const art = (
    <Animated.View style={[{ width: size, height: size * COCO_RATIO, transformOrigin: 'bottom' }, style]}>
      <CocoArt size={size} mood={face} tone={tone} id={id} outfit={outfit} />
    </Animated.View>
  );
  if (!interactive) return art;
  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} accessibilityRole="button" accessibilityLabel="코코">
      {art}
    </Pressable>
  );
}
