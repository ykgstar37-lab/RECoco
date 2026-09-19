import { GridColor } from '../types';
import { ClipPath, Defs, G, Image, Line, Path, Pattern, Rect } from 'react-native-svg';

import { seededRandom } from '../lib/format';

export interface TemplateLayout {
  /** viewBox 크기 (그림자 여백 포함) */
  width: number;
  height: number;
  /** 접힌 상태에서 보여줄 높이 (viewBox 단위). 0이면 접지 않음 */
  foldAt: number;
  /** 롤 폭 대비 표시 비율 (좁고 긴 인생네컷 등은 작게) */
  displayRatio: number;
  /** 종이 바깥 여백(그림자 자리). 영수증끼리 딱 붙여 이을 때 이만큼 겹친다 */
  inset: { top: number; bottom: number };
}

const TEXTURES = {
  thermalWrinkle: require('../../assets/paper/thermal-wrinkle.png'),
  thermalSpeckle: require('../../assets/paper/thermal-speckle.png'),
  paperGrain: require('../../assets/paper/paper-grain.png'),
  handWrinkle: require('../../assets/paper/handwritten-wrinkle.png'),
};

/** 블러 없이 겹친 반투명 도형으로 종이 그림자를 흉내낸다 */
export function PaperShadow({ d, strength = 1 }: { d: string; strength?: number }) {
  return (
    <G>
      <Path d={d} fill="#000" opacity={0.025 * strength} transform="translate(0 12)" />
      <Path d={d} fill="#000" opacity={0.035 * strength} transform="translate(0 7)" />
      <Path d={d} fill="#000" opacity={0.05 * strength} transform="translate(0 3.5)" />
      <Path d={d} fill="#000" opacity={0.06 * strength} transform="translate(0 1.2)" />
    </G>
  );
}

/**
 * 인쇄된 내용 "위에" 덮는 질감. 잉크까지 같이 주름지고 긁혀 보이게 한다.
 * - wrinkle: 부드러운 접힘 음영 (세로로 반복)
 * - speckle: 감열 인쇄 얼룩(흰 점, 옅은 세로줄) / grain: 일반 종이 입자
 */
export function PaperOverlay({
  id,
  d,
  width,
  height,
  wrinkle = 'thermal',
  surface = 'thermal',
  wrinkleOpacity = 1,
}: {
  id: string;
  d: string;
  width: number;
  height: number;
  wrinkle?: 'thermal' | 'hand' | 'none';
  surface?: 'thermal' | 'grain';
  wrinkleOpacity?: number;
}) {
  const clip = `clip-${id}`;
  return (
    <G>
      <Defs>
        <ClipPath id={clip}>
          <Path d={d} />
        </ClipPath>
        <Pattern id={`wr-${id}`} patternUnits="userSpaceOnUse" width={600} height={800}>
          <Image href={TEXTURES.thermalWrinkle} width={600} height={800} preserveAspectRatio="none" />
        </Pattern>
        <Pattern id={`sp-${id}`} patternUnits="userSpaceOnUse" width={512} height={512}>
          <Image href={surface === 'thermal' ? TEXTURES.thermalSpeckle : TEXTURES.paperGrain} width={512} height={512} />
        </Pattern>
      </Defs>
      <G clipPath={`url(#${clip})`}>
        {wrinkle === 'thermal' && <Rect width={width} height={height} fill={`url(#wr-${id})`} opacity={wrinkleOpacity} />}
        {wrinkle === 'hand' && (
          <Image href={TEXTURES.handWrinkle} width={width} height={height} preserveAspectRatio="none" opacity={wrinkleOpacity} />
        )}
        <Rect width={width} height={height} fill={`url(#sp-${id})`} />
      </G>
    </G>
  );
}

/** 감열지 커터로 자른 잔톱니 가장자리 (위/아래) */
export function serratedRect(w: number, h: number, tooth = 9, depth = 3.2) {
  const n = Math.max(2, Math.round(w / tooth));
  const step = w / n;
  let d = `M0,${depth}`;
  for (let i = 0; i < n; i++) d += ` L${(step * (i + 0.5)).toFixed(1)},0 L${(step * (i + 1)).toFixed(1)},${depth}`;
  d += ` L${w},${h - depth}`;
  for (let i = n; i > 0; i--) d += ` L${(step * (i - 0.5)).toFixed(1)},${h} L${(step * (i - 1)).toFixed(1)},${h - depth}`;
  return d + ' Z';
}

export function Barcode({
  seed,
  x,
  y,
  width,
  height,
  color = '#111',
}: {
  seed: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}) {
  const rnd = seededRandom(seed);
  const bars: { x: number; w: number }[] = [];
  let cx = 0;
  while (cx < width - 2) {
    const w = Math.min(1.6 + Math.floor(rnd() * 4) * 1.5, width - cx);
    bars.push({ x: cx, w });
    cx += w + 1.8 + Math.floor(rnd() * 3) * 1.5;
  }
  // 오른쪽 끝을 정확히 width에 맞춘다 (가운데 정렬이 어긋나지 않게)
  const scale = width / (bars[bars.length - 1].x + bars[bars.length - 1].w);
  return (
    <G>
      {bars.map((b, i) => (
        <Rect key={i} x={x + b.x * scale} y={y} width={b.w * scale} height={height} fill={color} />
      ))}
    </G>
  );
}

/** 모눈종이 무늬: step 간격 격자, major 칸마다 조금 진한 선 */
export function GridLines({
  x,
  y,
  width,
  height,
  step,
  color,
  majorColor,
  major = 5,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  step: number;
  color: string;
  majorColor: string;
  major?: number;
}) {
  const cols = Math.floor(width / step);
  const rows = Math.floor(height / step);
  return (
    <G>
      {Array.from({ length: cols + 1 }, (_, i) => (
        <Line key={`v${i}`} x1={x + i * step} y1={y} x2={x + i * step} y2={y + rows * step} stroke={i % major ? color : majorColor} strokeWidth={i % major ? 0.8 : 1.2} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Line key={`h${i}`} x1={x} y1={y + i * step} x2={x + cols * step} y2={y + i * step} stroke={i % major ? color : majorColor} strokeWidth={i % major ? 0.8 : 1.2} />
      ))}
    </G>
  );
}

/** 모눈종이 격자 색. 소비 영수증(ink=글씨)과 인생네컷 뒷면(border=테두리)이 같이 쓴다 */
export const GRID_COLORS: Record<GridColor, { name: string; swatch: string; paper: string; ink: string; line: string; major: string; backPaper: string; border: string }> = {
  green: { name: '연두', swatch: '#5f8f74', paper: '#fbfdf8', ink: '#5f8f74', line: '#e1eee5', major: '#c9e0d0', backPaper: '#fcfdf9', border: '#d3e4d8' },
  sky: { name: '하늘', swatch: '#5b83b5', paper: '#f9fbfe', ink: '#5b83b5', line: '#e2eaf4', major: '#cadcee', backPaper: '#fafcfe', border: '#d4e0ee' },
  pink: { name: '분홍', swatch: '#c1718e', paper: '#fefafb', ink: '#c1718e', line: '#f4e4ea', major: '#ecd0da', backPaper: '#fefbfc', border: '#eed8e0' },
  gray: { name: '회색', swatch: '#7d7d86', paper: '#fbfbfc', ink: '#7d7d86', line: '#e8e8ec', major: '#d8d8de', backPaper: '#fcfcfd', border: '#e0e0e6' },
};

export const GRID_COLOR_IDS = Object.keys(GRID_COLORS) as GridColor[];

export const gridColorOf = (c: GridColor | undefined) => GRID_COLORS[c && c in GRID_COLORS ? c : 'green'];
