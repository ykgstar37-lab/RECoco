// 여행: 탑승권 헤더 + 사진 (0~4장, 장수에 따라 배치가 바뀜)
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { seededRandom } from '../lib/format';
import { fitLine, measure } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { Photo, TravelRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const W = 1110;
const H = 1405;
const HH = 334; // 탑승권 헤더 높이
const PAD = 18;
const DIV = 565;
const CARD = '#f4f4f2';
const LABEL = '#3a3a3a';
const VALUE = '#111';
const SIDE = '#5b4a86';
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={VALUE} fontFamily={FONTS[f]} {...p} />;
const Label = (p: TProps) => <T fontSize={19} fill={LABEL} letterSpacing={0.5} {...p} />;
const Value = (p: TProps) => <T f="sansBold" fontSize={22} {...p} />;

const H_NO_PHOTO = HH + 330; // 사진이 없으면 탑승권만 있는 짧은 카드

const cardPath = (h: number) =>
  `M26,0 H${W - 26} Q${W},0 ${W},26 V${h - 26} Q${W},${h} ${W - 26},${h} H26 Q0,${h} 0,${h - 26} V26 Q0,0 26,0 Z`;

const photosOf = (r: TravelRecord) => r.photos.filter((p): p is Photo => !!p).slice(0, 4);

export function layoutTravel(r: TravelRecord): TemplateLayout {
  const n = photosOf(r).length;
  return n === 0
    ? { width: W + PAD * 2, height: H_NO_PHOTO + PAD * 2 + 16, foldAt: 0, displayRatio: 1, inset: { top: PAD, bottom: PAD + 16 } }
    : { width: W + PAD * 2, height: H + PAD * 2 + 16, foldAt: HH + PAD + 70, displayRatio: 1, inset: { top: PAD, bottom: PAD + 16 } };
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 사진 영역: x 52~1058, y 375~1347 (가로 간격 26, 세로 간격 32)
const AX = 52;
const AY = 375;
const AW = 1006;
const AH = 972;
const GX = 26;
const GY = 32;
const HALF_W = (AW - GX) / 2;
const HALF_H = (AH - GY) / 2;

/** 장수별 배치: 1장 크게 / 2장 세로로 나란히 / 3장 위 가로 + 아래 둘 / 4장 2×2 */
export function travelSlots(count: number): Slot[] {
  switch (count) {
    case 1:
      return [{ x: AX, y: AY, w: AW, h: AH }];
    case 2:
      return [
        { x: AX, y: AY, w: HALF_W, h: AH },
        { x: AX + HALF_W + GX, y: AY, w: HALF_W, h: AH },
      ];
    case 3:
      return [
        { x: AX, y: AY, w: AW, h: HALF_H },
        { x: AX, y: AY + HALF_H + GY, w: HALF_W, h: HALF_H },
        { x: AX + HALF_W + GX, y: AY + HALF_H + GY, w: HALF_W, h: HALF_H },
      ];
    case 4:
      return [0, 1, 2, 3].map((i) => ({
        x: AX + (i % 2) * (HALF_W + GX),
        y: AY + Math.floor(i / 2) * (HALF_H + GY),
        w: HALF_W,
        h: HALF_H,
      }));
    default:
      return [];
  }
}

function PhotoSlot({ photo, slot: s, clipId }: { photo: Photo; slot: Slot; clipId: string }) {
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={4} />
        </ClipPath>
      </Defs>
      <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={4} fill="#e4e6e9" />
      <Image
        href={{ uri: photo.uri }}
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
    </G>
  );
}

/** 사진 없는 카드의 아래쪽: 항로 + 출국 도장 */
function RouteSection({ from, to, departure, year }: { from: string; to: string; departure: string; year: string }) {
  const y = HH + 150;
  return (
    <G>
      <Circle cx={120} cy={y} r={11} fill="none" stroke="#9a9a9a" strokeWidth={3} />
      <Line x1={140} y1={y} x2={W - 140} y2={y} stroke="#b5b5b5" strokeWidth={3} strokeDasharray="4 14" strokeLinecap="round" />
      <Circle cx={W - 120} cy={y} r={11} fill="#9a9a9a" />
      <Path
        transform={`translate(${W / 2} ${y}) rotate(90) scale(2.6) translate(-12 -12)`}
        fill="#8f8f8f"
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
      <T f="code" x={120} y={y + 76} fontSize={40} textAnchor="middle" letterSpacing={4} children={from} />
      <T f="code" x={W - 120} y={y + 76} fontSize={40} textAnchor="middle" letterSpacing={4} children={to} />
      <T x={W / 2} y={y - 48} fontSize={22} fill={LABEL} textAnchor="middle" letterSpacing={3} children={departure ? `${departure} ${year}` : ''} />
      <G transform={`translate(${W / 2} ${y + 104}) rotate(-8)`} opacity={0.55}>
        <Rect x={-110} y={-44} width={220} height={88} rx={14} fill="none" stroke={SIDE} strokeWidth={4} />
        <Rect x={-100} y={-34} width={200} height={68} rx={9} fill="none" stroke={SIDE} strokeWidth={1.5} />
        <T f="sansHeavy" y={-2} fontSize={26} fill={SIDE} textAnchor="middle" letterSpacing={3} children="DEPARTED" />
        <T f="mono" y={22} fontSize={16} fill={SIDE} textAnchor="middle" letterSpacing={2} children={`${departure} ${year}`.trim()} />
      </G>
    </G>
  );
}

export function TravelPass({ record: r, width }: { record: TravelRecord; width: number }) {
  const L = layoutTravel(r);
  const photos = photosOf(r);
  const slots = travelSlots(photos.length);
  const cardH = photos.length ? H : H_NO_PHOTO;
  const CARD_PATH = cardPath(cardH);
  const year = r.date.slice(0, 4);
  const rnd = seededRandom(r.id);
  const from = (r.from.trim() || 'ICN').toUpperCase();
  const to = (r.to.trim() || 'HND').toUpperCase();
  const [, mm, dd] = r.date.split('-').map((v) => parseInt(v, 10));
  const departure = mm && dd ? `${String(dd).padStart(2, '0')} ${MONTHS[mm - 1]}` : '';
  const name = r.name.trim().toUpperCase();
  const flight = r.flight.trim().toUpperCase() || '-';
  const seat = r.seat.trim().toUpperCase() || '-';
  const gate = r.gate.trim().toUpperCase() || '-';

  // ICN ✈ HND: 코드 길이에 맞춰 비행기 위치와 도착 코드 위치를 계산
  const codeSize = from.length > 3 || to.length > 3 ? 56 : 68;
  const fromW = measure(from, codeSize, 'code', 10);
  const planeX = 67 + fromW + 46;
  const toX = planeX + 50;
  const nameLeft = fitLine(name, 90, 20, 13, 'sans');
  const nameRight = fitLine(name, 360, 22, 15, 'sans');

  const hBars: { x: number; w: number }[] = [];
  for (let x = 67; x < 212; ) {
    const w = 1 + Math.floor(rnd() * 4.2);
    hBars.push({ x, w });
    x += w + 1 + Math.floor(rnd() * 3.2);
  }
  const vBars: { y: number; h: number }[] = [];
  for (let y = 22; y < 128; ) {
    const h = 1 + Math.floor(rnd() * 4);
    vBars.push({ y, h });
    y += h + 1 + Math.floor(rnd() * 2.6);
  }
  const qr: { i: number; j: number }[] = [];
  const n = 21;
  const inFinder = (i: number, j: number) => (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!inFinder(i, j) && rnd() > 0.52) qr.push({ i, j });
  const qs = 3.7;
  const finder = (fx: number, fy: number) => (
    <G key={`${fx}-${fy}`}>
      <Rect x={990 + fx * qs} y={186 + fy * qs} width={7 * qs} height={7 * qs} fill="#111" />
      <Rect x={990 + (fx + 1) * qs} y={186 + (fy + 1) * qs} width={5 * qs} height={5 * qs} fill={CARD} />
      <Rect x={990 + (fx + 2) * qs} y={186 + (fy + 2) * qs} width={3 * qs} height={3 * qs} fill="#111" />
    </G>
  );

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={CARD_PATH} strength={1.3} />
        <Path d={CARD_PATH} fill={CARD} stroke="#e1e1e1" strokeWidth={1.5} />
        <Line x1={0} y1={HH} x2={W} y2={HH} stroke="#d6d6d6" strokeWidth={2} />
        <Line x1={DIV} y1={0} x2={DIV} y2={HH} stroke="#cfcfcf" strokeWidth={2} strokeDasharray="7 8" />

        {/* 왼쪽 */}
        <T f="code" x={67} y={112} fontSize={codeSize} letterSpacing={10} children={from} />
        <Path
          transform={`translate(${planeX} 88) rotate(90) scale(3.3) translate(-12 -12)`}
          fill="#8f8f8f"
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        />
        <T f="code" x={toX} y={112} fontSize={codeSize} letterSpacing={10} children={to} />
        <Label x={333} y={156} children="FLIGHT" />
        <Label x={452} y={156} children="SEAT" />
        <Label x={226} y={184} children="NAME" />
        <Value x={333} y={184} children={flight} />
        <Value x={460} y={184} children={seat} />
        {!!name && <Value x={226} y={212} fontSize={nameLeft.size} children={nameLeft.text} />}
        <Label x={333} y={226} children="GATE" />
        <Value x={345} y={254} children={gate} />
        {hBars.map((b, i) => (
          <Rect key={i} x={b.x} y={210} width={b.w} height={36} fill="#111" />
        ))}

        {/* 오른쪽 */}
        <Label x={597} y={44} children="NAME" />
        {!!name && <Value x={597} y={74} fontSize={nameRight.size} children={nameRight.text} />}
        <Label x={597} y={126} children="FLIGHT" />
        <Label x={705} y={126} children="DEPARTURE" />
        <Value x={597} y={154} children={flight} />
        <Value x={705} y={156} fontSize={26} children={departure} />
        <Label x={597} y={222} children="SEAT" />
        <Label x={712} y={222} children="GATE" />
        <Value x={605} y={252} children={seat} />
        <Value x={722} y={252} children={gate} />
        {vBars.map((b, i) => (
          <Rect key={i} x={990} y={b.y} width={72} height={b.h} fill="#111" />
        ))}
        {qr.map(({ i, j }) => (
          <Rect key={`${i}-${j}`} x={990 + i * qs} y={186 + j * qs} width={qs} height={qs} fill="#111" />
        ))}
        {[finder(0, 0), finder(n - 7, 0), finder(0, n - 7)]}

        {/* 사진 2x2 */}
        {slots.map((slot, i) => (
          <PhotoSlot key={i} slot={slot} photo={photos[i]} clipId={`tp-${r.id}-${i}`} />
        ))}

        {photos.length > 0 ? (
          <G>
            <T f="sansHeavy" x={1078} y={660} fontSize={26} fill={SIDE} letterSpacing={2} transform="rotate(90 1078 660)" children={`${BRAND.en.toUpperCase()}.PIC`} />
            <T f="sansHeavy" x={36} y={1222} fontSize={26} fill={SIDE} letterSpacing={2} transform="rotate(-90 36 1222)" children={`${BRAND.en.toUpperCase()}.PIC`} />
          </G>
        ) : (
          <G>
            <RouteSection from={from} to={to} departure={departure} year={year} />
            <T f="sansHeavy" x={W - 40} y={cardH - 30} fontSize={20} fill={SIDE} textAnchor="end" letterSpacing={2} children={`${BRAND.en.toUpperCase()}.PIC`} />
          </G>
        )}

        <PaperOverlay id={`tv-${r.id}`} d={CARD_PATH} width={W} height={cardH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
