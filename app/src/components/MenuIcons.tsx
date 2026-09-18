// 메인 메뉴용 단순한 아이콘 (한 가지 색 실루엣)
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

export function HatIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5,15 C4,8 7.5,4 12,4 C16.5,4 20,8 19,15 Z" fill={color} />
      <Path d="M1.5,16.5 C6,13.5 18,13.5 22.5,16.5 C18,19.5 6,19.5 1.5,16.5 Z" fill={color} />
    </Svg>
  );
}

/** 장바구니: 손잡이 + 위가 넓은 몸통에 구멍이 뽕뽕 (가방처럼 보이지 않게) */
export function BagIcon({ color, size = 24 }: IconProps) {
  // 몸통 안에 엇갈려 뚫린 구멍 (줄마다 폭이 좁아진다)
  const holes = [
    { y: 12.8, xs: [7.6, 10.4, 13.2, 16.0] },
    { y: 15.6, xs: [8.6, 11.4, 14.2] },
    { y: 18.4, xs: [9.5, 12.0, 14.5] },
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8.2,9 V7.4 A3.8,3.8 0 0 1 15.8,7.4 V9" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M3.2,9.4 H20.8 L19.1,19.7 C18.9,21 17.8,22 16.5,22 H7.5 C6.2,22 5.1,21 4.9,19.7 Z" fill={color} />
      {holes.flatMap((row) => row.xs.map((x) => <Circle key={`${x}-${row.y}`} cx={x} cy={row.y} r={1.15} fill="#fff" />))}
    </Svg>
  );
}

/** 달력: 고리 두 개 + 칸 안에 도장 자국 */
export function CalendarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={16} rx={3.5} fill={color} />
      <Rect x={6.5} y={1.5} width={2.6} height={5} rx={1.3} fill={color} />
      <Rect x={14.9} y={1.5} width={2.6} height={5} rx={1.3} fill={color} />
      <Rect x={5} y={9.5} width={14} height={9.5} rx={1.6} fill="#fff" />
      <Circle cx={9} cy={12.8} r={1.5} fill={color} />
      <Circle cx={15} cy={12.8} r={1.5} fill={color} />
      <Circle cx={9} cy={16.5} r={1.5} fill={color} opacity={0.4} />
      <Circle cx={15} cy={16.5} r={1.5} fill={color} opacity={0.4} />
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
      {teeth}
      <Path d="M12,4.5 A7.5,7.5 0 1 1 11.99,4.5 Z M12,9 A3,3 0 1 0 12.01,9 Z" fill={color} fillRule="evenodd" />
    </Svg>
  );
}
