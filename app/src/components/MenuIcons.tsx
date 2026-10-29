// 메인 메뉴용 단순한 아이콘 (한 가지 색 실루엣)
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

/** 점 세 개 (메뉴 열기) */
export function DotsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={2.4} fill={color} />
      <Circle cx={12} cy={12} r={2.4} fill={color} />
      <Circle cx={19} cy={12} r={2.4} fill={color} />
    </Svg>
  );
}

/** 코코 옷장: 옷걸이에 걸린 티셔츠 */
export function HatIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(0 -0.45)">
      {/* 옷걸이 고리 (닫힌 동그라미가 아니라 끝이 트인 갈고리) */}
      <Path d="M10.8,5.2 C10.8,3.5 13.6,3.4 13.6,5 C13.6,5.9 12.2,6 12,6.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      {/* 옷걸이 어깨 */}
      <Path d="M8.3,9.2 L12,6.3 L15.7,9.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* 티셔츠: 어깨에서 소매가 내려오고 몸통은 곧게 */}
      <Path
        d="M9.1,7.6 Q12,10.8 14.9,7.6 L21.4,10.4 L19.1,14.6 L17.1,13.6 V21.2 Q17.1,21.9 16.4,21.9 H7.6 Q6.9,21.9 6.9,21.2 V13.6 L4.9,14.6 L2.6,10.4 Z"
        fill={color}
      />
      </G>
    </Svg>
  );
}

/** 장바구니: 손잡이 두 개가 위에서 엇갈리고, 몸통엔 격자 (가방·자물쇠처럼 보이지 않게) */
export function BagIcon({ color, size = 24 }: IconProps) {
  // 위가 넓은 사다리꼴 몸통
  const TOP_Y = 11.4;
  const BOT_Y = 21;
  const TOP = [4.3, 19.7];
  const BOT = [6.6, 17.4];
  const at = (y: number) => {
    const s = (y - TOP_Y) / (BOT_Y - TOP_Y);
    return [TOP[0] + (BOT[0] - TOP[0]) * s, TOP[1] + (BOT[1] - TOP[1]) * s];
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(0 -0.25)">
      {/* 손잡이 두 개 + 테두리 띠 */}
      <Path d="M8.4,9 L12.6,3.6 M15.6,9 L11.4,3.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" fill="none" />
      <Rect x={2.6} y={8} width={18.8} height={3.1} rx={1.55} fill={color} />
      <Path d={`M${TOP[0]},${TOP_Y} H${TOP[1]} L${BOT[1]},${BOT_Y} Q${BOT[1] - 1.2},${BOT_Y + 1} ${BOT[1] - 2.4},${BOT_Y + 1} H${BOT[0] + 2.4} Q${BOT[0] + 1.2},${BOT_Y + 1} ${BOT[0]},${BOT_Y} Z`} fill={color} />
      {/* 격자: 세로 3줄 + 가로 2줄 */}
      {[0.25, 0.5, 0.75].map((t) => (
        <Path key={t} d={`M${TOP[0] + (TOP[1] - TOP[0]) * t},${TOP_Y} L${BOT[0] + (BOT[1] - BOT[0]) * t},${BOT_Y + 0.6}`} stroke="#fff" strokeWidth={1.1} fill="none" />
      ))}
      {[14.6, 17.8].map((y) => (
        <Path key={y} d={`M${at(y)[0]},${y} H${at(y)[1]}`} stroke="#fff" strokeWidth={1.1} fill="none" />
      ))}
      </G>
    </Svg>
  );
}

/** 달력: 고리 두 개 + 칸 안에 도장 자국 */
export function CalendarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(0 0.8)">
      <Rect x={3} y={5} width={18} height={16} rx={3.5} fill={color} />
      <Rect x={6.5} y={1.5} width={2.6} height={5} rx={1.3} fill={color} />
      <Rect x={14.9} y={1.5} width={2.6} height={5} rx={1.3} fill={color} />
      <Rect x={5} y={9.5} width={14} height={9.5} rx={1.6} fill="#fff" />
      <Circle cx={9} cy={12.8} r={1.5} fill={color} />
      <Circle cx={15} cy={12.8} r={1.5} fill={color} />
      <Circle cx={9} cy={16.5} r={1.5} fill={color} opacity={0.4} />
      <Circle cx={15} cy={16.5} r={1.5} fill={color} opacity={0.4} />
      </G>
    </Svg>
  );
}

export function GearIcon({ color, size = 24 }: IconProps) {
  // 톱니 8개 + 가운데 구멍
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x = 12 + Math.cos(a) * 8.6;
    const y = 12 + Math.sin(a) * 8.6;
    return <Circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(12 12) scale(0.86) translate(-12 -12)">
      {teeth}
      <Path d="M12,4.5 A7.5,7.5 0 1 1 11.99,4.5 Z M12,9 A3,3 0 1 0 12.01,9 Z" fill={color} fillRule="evenodd" />
      </G>
    </Svg>
  );
}

/** 공유: 위로 나가는 화살표 + 열린 상자 */
export function ShareIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12,14.2 V3.4 M7.9,7.3 L12,3.2 L16.1,7.3" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M8.6,10.2 H6.8 Q5.2,10.2 5.2,11.8 V19.6 Q5.2,21.2 6.8,21.2 H17.2 Q18.8,21.2 18.8,19.6 V11.8 Q18.8,10.2 17.2,10.2 H15.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** 앨범에 저장: 아래로 내려오는 화살표 + 받침 */
export function SaveIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12,3.4 V14.6 M7.6,10.4 L12,14.8 L16.4,10.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M4.6,15.4 V18.6 Q4.6,20.6 6.6,20.6 H17.4 Q19.4,20.6 19.4,18.6 V15.4" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** 고치기: 연필 */
export function PencilIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15.6,4.4 Q16.9,3.1 18.2,4.4 L19.6,5.8 Q20.9,7.1 19.6,8.4 L9.2,18.8 L4.4,19.6 L5.2,14.8 Z" fill={color} />
      <Path d="M13.9,6.1 L17.9,10.1" stroke="#fff" strokeWidth={1.3} fill="none" />
    </Svg>
  );
}

/** 버리기: 휴지통 */
export function TrashIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.2,6.6 H19.8 M9.4,6.4 V4.9 Q9.4,3.6 10.7,3.6 H13.3 Q14.6,3.6 14.6,4.9 V6.4" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M6,8.6 H18 L17,19.4 Q16.85,21 15.2,21 H8.8 Q7.15,21 7,19.4 Z" fill={color} />
    </Svg>
  );
}
