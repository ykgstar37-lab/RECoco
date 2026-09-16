import { ClipPath, Defs, G, Image, Path, Pattern, Rect } from 'react-native-svg';

import { seededRandom } from '../lib/format';

export interface TemplateLayout {
  /** viewBox 크기 (그림자 여백 포함) */
  width: number;
  height: number;
  /** 접힌 상태에서 보여줄 높이 (viewBox 단위). 0이면 접지 않음 */
  foldAt: number;
  /** 롤 폭 대비 표시 비율 (좁고 긴 인생네컷 등은 작게) */
  displayRatio: number;
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
