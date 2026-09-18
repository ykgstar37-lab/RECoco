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

export function BagIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8,8 V6.5 C8,4.3 9.8,2.5 12,2.5 C14.2,2.5 16,4.3 16,6.5 V8" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Path d="M4.5,8 H19.5 L18.6,19.5 C18.5,20.9 17.4,22 16,22 H8 C6.6,22 5.5,20.9 5.4,19.5 Z" fill={color} />
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
