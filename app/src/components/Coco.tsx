// 레코코 마스코트 "코코": 입이 영수증 프린터인 주황색 말랑이
import { useEffect, useState } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type CocoMood = 'idle' | 'happy' | 'print' | 'wow';

const VB_W = 400;
const VB_H = 320;
/** 프린터 입(슬롯)의 위치 — 출력되는 영수증을 여기에 맞춘다 */
export const COCO_SLOT = { x: 152 / VB_W, w: 96 / VB_W, y: 220 / VB_H };
export const COCO_RATIO = VB_H / VB_W;

const EYE = '#3a2a22';
const BODY_TOP = '#ff8a3d';
const BODY_BOTTOM = '#ffb680';

const BODY =
  'M34,264 C34,120 106,52 200,52 C294,52 366,120 366,264 C366,290 350,302 324,302 H76 C50,302 34,290 34,264 Z';

function Eye({ cx, cy, mood, closed }: { cx: number; cy: number; mood: CocoMood; closed: boolean }) {
  if (mood === 'happy') {
    return <Path d={`M${cx - 22},${cy + 8} Q${cx},${cy - 20} ${cx + 22},${cy + 8}`} stroke={EYE} strokeWidth={9} strokeLinecap="round" fill="none" />;
  }
  if (closed) {
    return <Path d={`M${cx - 22},${cy + 2} Q${cx},${cy + 16} ${cx + 22},${cy + 2}`} stroke={EYE} strokeWidth={8} strokeLinecap="round" fill="none" />;
  }
  const big = mood === 'wow' ? 1.12 : 1;
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={31 * big} ry={37 * big} fill="#fff" />
      <Ellipse cx={cx} cy={cy + 1} rx={24 * big} ry={30 * big} fill={EYE} />
      <Circle cx={cx + 8} cy={cy + 11} r={6.5} fill="#fff" />
      <Circle cx={cx - 9} cy={cy - 12} r={3.2} fill="#fff" opacity={0.85} />
    </G>
  );
}

function Mouth({ mood, clipId }: { mood: CocoMood; clipId: string }) {
  if (mood === 'print') {
    // 영수증이 나오는 프린터 입
    return (
      <G>
        <Rect x={138} y={204} width={124} height={34} rx={17} fill="#fff" />
        <Rect x={152} y={216} width={96} height={9} rx={4.5} fill={EYE} />
      </G>
    );
  }
  if (mood === 'wow') {
    return (
      <G>
        <Ellipse cx={200} cy={222} rx={22} ry={24} fill="#fff" />
        <Ellipse cx={200} cy={230} rx={13} ry={10} fill="#ff6a55" />
      </G>
    );
  }
  const wide = mood === 'happy' ? 1.15 : 1;
  const l = 200 - 50 * wide;
  const r = 200 + 50 * wide;
  const d = `M${l},204 C${l},195 ${r},195 ${r},204 C${r},262 ${l},262 ${l},204 Z`;
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      <Path d={d} fill="#fff" />
      <Ellipse cx={200} cy={254} rx={30 * wide} ry={22} fill="#ff6a55" clipPath={`url(#${clipId})`} />
    </G>
  );
}

export function Coco({ size, mood = 'idle', id = 'coco' }: { size: number; mood?: CocoMood; id?: string }) {
  const [blink, setBlink] = useState(false);

  // 가끔 눈을 깜빡인다
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          loop();
        }, 130);
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  return (
    <Svg width={size} height={size * COCO_RATIO} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Defs>
        <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={BODY_TOP} />
          <Stop offset="1" stopColor={BODY_BOTTOM} />
        </LinearGradient>
      </Defs>

      {/* 머리 위 영수증 한 조각 */}
      <G transform="rotate(10 200 60)">
        <Path d="M184,64 L184,22 L189,17 L194,22 L199,17 L204,22 L209,17 L214,22 L214,64 Z" fill="#fff" stroke="#f3c7a6" strokeWidth={2.5} strokeLinejoin="round" />
        <Rect x={190} y={31} width={18} height={3} rx={1.5} fill="#ffc9a3" />
        <Rect x={190} y={40} width={12} height={3} rx={1.5} fill="#ffc9a3" />
      </G>

      <Path d={BODY} fill={`url(#${id}-body)`} />
      {/* 말랑한 광택 */}
      <Ellipse cx={126} cy={110} rx={42} ry={18} fill="#fff" opacity={0.16} transform="rotate(-30 126 110)" />

      <Ellipse cx={116} cy={206} rx={20} ry={11} fill="#ff5a3c" opacity={0.25} />
      <Ellipse cx={284} cy={206} rx={20} ry={11} fill="#ff5a3c" opacity={0.25} />

      <Eye cx={156} cy={156} mood={mood} closed={blink} />
      <Eye cx={244} cy={156} mood={mood} closed={blink} />
      <Mouth mood={mood} clipId={`${id}-mouth`} />
    </Svg>
  );
}
