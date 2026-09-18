// 소비 영수증 비고칸 스티커. 기기 이모지 글꼴에 기대지 않고 직접 그려서 어디서나 같은 모양.
// 기록에는 이모지 글자로 저장한다 (예전 기록의 '☕' 도 그대로 스티커로 보임)
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const LINE = '#3a2a22';
const W = 2.6; // 테두리 두께 (48×48 기준)

export const STICKERS = [
  { emoji: '☕', label: '커피' },
  { emoji: '🍞', label: '빵' },
  { emoji: '🍰', label: '케이크' },
  { emoji: '🍚', label: '밥' },
  { emoji: '🍺', label: '맥주' },
  { emoji: '🛍️', label: '쇼핑' },
  { emoji: '🎁', label: '선물' },
  { emoji: '💐', label: '꽃' },
  { emoji: '💊', label: '약' },
  { emoji: '❤️', label: '하트' },
] as const;

const norm = (s: string) => s.trim().replace(/️/g, '');
export const stickerOf = (memo: string) => STICKERS.find((s) => norm(s.emoji) === norm(memo)) ?? null;

/** 48×48 좌표 스티커 한 개. x, y 는 가운데, size 는 한 변 길이 */
export function StickerArt({ emoji, x = 24, y = 24, size = 48, rotate = 0 }: { emoji: string; x?: number; y?: number; size?: number; rotate?: number }) {
  const k = size / 48;
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${k}) translate(-24 -24)`}>
      <Shape emoji={norm(emoji)} />
    </G>
  );
}

function Shape({ emoji }: { emoji: string }) {
  const s = { stroke: LINE, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (emoji) {
    case '☕':
      return (
        <G>
          <Path d="M17,6 C15,9 19,11 17,14 M24,5 C22,8 26,10 24,13" {...s} fill="none" />
          <Ellipse cx={23} cy={40} rx={17} ry={4} fill="#fff" {...s} />
          <Path d="M36,22 C43,21 43,31 35,31" {...s} fill="none" />
          <Path d="M9,18 H37 V29 C37,36 31,39 23,39 C15,39 9,36 9,29 Z" fill="#fff" {...s} />
          <Path d="M9,18 H37 V22 H9 Z" fill="#8a5a3c" />
          <Path d="M9,18 H37" {...s} />
        </G>
      );
    case '🍞':
      return (
        <G>
          <Path d="M10,40 V24 C5,22 5,10 16,9 H32 C43,10 43,22 38,24 V40 Z" fill="#f2c27a" {...s} />
          <Path d="M14,36 V25 C10,23 11,14 18,14 H30 C37,14 38,23 34,25 V36 Z" fill="#fdebc4" />
        </G>
      );
    case '🍰':
      return (
        <G>
          <Path d="M7,24 L39,16 V38 H7 Z" fill="#fff4e3" {...s} />
          <Path d="M7,30 L39,26" stroke="#f28ca5" strokeWidth={4} />
          <Path d="M7,24 L39,16 L41,20 L7,28 Z" fill="#fff" {...s} />
          <Path d="M7,24 L39,16 V38 H7 Z" fill="none" {...s} />
          <Path d="M28,13 C28,6 36,6 36,12 C36,17 30,18 28,13 Z" fill="#e5484d" {...s} />
        </G>
      );
    case '🍚':
      return (
        <G>
          <Path d="M10,22 C10,11 38,11 38,22 Z" fill="#fff" {...s} />
          <Path d="M17,15 l2,-1 M25,13 l2,1 M30,17 l1,-2" {...s} />
          <Path d="M6,22 H42 C42,34 34,40 24,40 C14,40 6,34 6,22 Z" fill="#7fb3e0" {...s} />
          <Path d="M13,28 C18,32 30,32 35,28" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case '🍺':
      return (
        <G>
          <Path d="M32,19 C41,18 41,33 32,32" {...s} fill="none" />
          <Rect x={10} y={14} width={23} height={27} rx={3} fill="#f5b53a" {...s} />
          <Path d="M8,17 C7,10 13,8 16,10 C18,6 25,6 27,10 C31,8 36,11 34,17 Z" fill="#fff" {...s} />
          <Path d="M16,24 V35 M22,24 V35 M28,24 V35" stroke="#fbd98a" strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
    case '🛍':
      return (
        <G>
          <Path d="M17,17 V13 C17,7 31,7 31,13 V17" {...s} fill="none" />
          <Path d="M9,17 H39 L37,41 H11 Z" fill="#ff9a5c" {...s} />
          <Circle cx={17} cy={22} r={1.6} fill={LINE} />
          <Circle cx={31} cy={22} r={1.6} fill={LINE} />
          <Path d="M17,30 C20,34 28,34 31,30" {...s} fill="none" />
        </G>
      );
    case '🎁':
      return (
        <G>
          <Path d="M24,15 C18,6 10,10 16,15 M24,15 C30,6 38,10 32,15" {...s} fill="none" />
          <Rect x={10} y={22} width={28} height={19} fill="#f28ca5" {...s} />
          <Rect x={7} y={15} width={34} height={8} rx={1.5} fill="#f28ca5" {...s} />
          <Path d="M24,15 V41" stroke="#fff" strokeWidth={4} />
          <Path d="M24,15 V41" {...s} fill="none" strokeWidth={0} />
          <Rect x={10} y={22} width={28} height={19} fill="none" {...s} />
          <Rect x={7} y={15} width={34} height={8} rx={1.5} fill="none" {...s} />
        </G>
      );
    case '💐':
      return (
        <G>
          <Path d="M24,26 V43 M24,36 C18,35 15,31 15,27 M24,34 C30,33 33,30 33,26" stroke="#4fa885" strokeWidth={W} strokeLinecap="round" fill="none" />
          <Path d="M14,12 C14,22 18,26 24,26 C30,26 34,22 34,12 L29,16 L24,9 L19,16 Z" fill="#f27ca0" {...s} />
        </G>
      );
    case '💊':
      return (
        <G transform="rotate(-35 24 24)">
          <Rect x={8} y={16} width={32} height={16} rx={8} fill="#fff" {...s} />
          <Path d="M24,16 H32 C36.4,16 40,19.6 40,24 C40,28.4 36.4,32 32,32 H24 Z" fill="#7fb3e0" {...s} />
        </G>
      );
    case '❤':
      return <Path d="M24,40 C14,33 6,27 6,18 C6,11 11,7 16,7 C20,7 23,10 24,13 C25,10 28,7 32,7 C37,7 42,11 42,18 C42,27 34,33 24,40 Z" fill="#e5484d" {...s} />;
    case '🎫':
      return (
        <G>
          <Path
            d="M6,14 H42 V21 Q37,21 37,24 Q37,27 42,27 V34 H6 V27 Q11,27 11,24 Q11,21 6,21 Z"
            fill="#ffd166"
            {...s}
          />
          <Path d="M17,19 V29 M24,19 V29 M31,19 V29" stroke={LINE} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );
    case '🎤':
      return (
        <G>
          <Path d="M24,6 C27.5,6 30,8.5 30,12 V21 C30,24.5 27.5,27 24,27 C20.5,27 18,24.5 18,21 V12 C18,8.5 20.5,6 24,6 Z" fill="#c9b8ff" {...s} />
          <Path d="M13,20 C13,28 18,32 24,32 C30,32 35,28 35,20" {...s} fill="none" />
          <Path d="M24,32 V39" {...s} />
          <Path d="M17,41 H31" {...s} />
        </G>
      );
    default:
      return null;
  }
}
