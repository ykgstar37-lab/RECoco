// 인생네컷: 앞면 사진(포토부스 완성본 or 사진 4장 + 레이아웃) / 뒷면 오늘의 하루
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { parseDate, seededRandom, withParticle } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, FONTS } from '../theme';
import { FourcutFrame, FourcutLayout, FourcutRecord, Photo } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PAD = 16;

const FRAMES: Record<FourcutFrame, { bg: string; ink: string; slot: string }> = {
  white: { bg: '#fbfbf9', ink: '#1a1a1a', slot: '#e6e6e3' },
  black: { bg: '#171717', ink: '#f4f4f0', slot: '#2c2c2c' },
  pink: { bg: '#f6d9e0', ink: '#6b2f43', slot: '#ecc3cd' },
  sky: { bg: '#f7fafc', ink: '#3b6a9c', slot: '#dbe8f4' },
};

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FrontSpec {
  w: number;
  h: number;
  slots: Slot[];
  /** 브랜드 글자 위치 */
  brand: { x: number; y: number; size: number; dateY: number; dateSize: number; vertical?: boolean };
  displayRatio: number;
}

/** 레이아웃별 카드 크기와 사진 칸 */
export const FOURCUT_LAYOUTS: Record<FourcutLayout, FrontSpec> = {
  // 세로 1×4 스트립 (2x6)
  strip: {
    w: 400,
    h: 1200,
    slots: [0, 1, 2, 3].map((i) => ({ x: 22, y: 24 + i * 268, w: 356, h: 256 })),
    brand: { x: 200, y: 1142, size: 30, dateY: 1172, dateSize: 15 },
    displayRatio: 0.6,
  },
  // 2×2 세로사진 (4x6 엽서형)
  grid: {
    w: 600,
    h: 760,
    slots: [0, 1, 2, 3].map((i) => ({ x: 28 + (i % 2) * 282, y: 28 + Math.floor(i / 2) * 340, w: 262, h: 316 })),
    brand: { x: 300, y: 720, size: 24, dateY: 744, dateSize: 12 },
    displayRatio: 0.8,
  },
  // 가로 카드 2×2 + 오른쪽 세로 브랜드 띠
  wide: {
    w: 900,
    h: 600,
    slots: [0, 1, 2, 3].map((i) => ({ x: 28 + (i % 2) * 396, y: 28 + Math.floor(i / 2) * 282, w: 376, h: 262 })),
    brand: { x: 846, y: 300, size: 28, dateY: 0, dateSize: 13, vertical: true },
    displayRatio: 1,
  },
};

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'serif', ...p }: TProps) => <Text fontFamily={FONTS[f]} {...p} />;

/** QR 완성본이 있으면 그 비율을, 없으면 레이아웃 크기를 쓴다 */
export function fourcutSize(r: FourcutRecord): { w: number; h: number; image: Photo | null; displayRatio: number } {
  const img = r.source === 'qr' ? r.frameImage : null;
  if (img && img.width > 0 && img.height > 0) {
    const ratio = img.height / img.width;
    if (ratio > 2) return { w: 400, h: Math.round(400 * ratio), image: img, displayRatio: 0.6 };
    if (ratio < 1) return { w: 900, h: Math.round(900 * ratio), image: img, displayRatio: 1 };
    return { w: 600, h: Math.round(600 * ratio), image: img, displayRatio: 0.8 };
  }
  const spec = FOURCUT_LAYOUTS[r.layout] ?? FOURCUT_LAYOUTS.strip;
  return { w: spec.w, h: spec.h, image: null, displayRatio: spec.displayRatio };
}

export function layoutFourcut(r: FourcutRecord): TemplateLayout {
  const { w, h, displayRatio } = fourcutSize(r);
  return { width: w + PAD * 2, height: h + PAD * 2 + 14, foldAt: 0, displayRatio };
}

const cardPath = (w: number, h: number, r = 8) =>
  `M${r},0 H${w - r} Q${w},0 ${w},${r} V${h - r} Q${w},${h} ${w - r},${h} H${r} Q0,${h} 0,${h - r} V${r} Q0,0 ${r},0 Z`;

function Gloss({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#fff" stopOpacity={0.16} />
          <Stop offset="0.35" stopColor="#fff" stopOpacity={0} />
          <Stop offset="0.62" stopColor="#fff" stopOpacity={0.07} />
          <Stop offset="1" stopColor="#fff" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={cardPath(w, h)} fill={`url(#${id})`} />
    </G>
  );
}

/** 하늘색 물결 줄무늬 프레임 (레퍼런스의 파란 물결 배경) */
function WaveBands({ w, h, clipId }: { w: number; h: number; clipId: string }) {
  // 회전된 좌표계에서 카드와 겹치는 띠만 만든다 (밖으로 완전히 벗어난 띠는 그리지 않음)
  const rad = (32 * Math.PI) / 180;
  const halfY = (w * Math.sin(rad) + h * Math.cos(rad)) / 2;
  const halfX = Math.ceil(((w * Math.cos(rad) + h * Math.sin(rad)) / 2 + 160) / 160) * 160;
  const bands: string[] = [];
  for (let y = -Math.floor(halfY / 120) * 120; y < halfY; y += 120) {
    let d = `M${-halfX},${y}`;
    for (let x = -halfX; x < halfX; x += 160) d += ' q40,-18 80,0 t80,0';
    d += ` V${y + 46}`;
    for (let x = halfX; x > -halfX; x -= 160) d += ' q-40,18 -80,0 t-80,0';
    bands.push(`${d} Z`);
  }
  return (
    <G clipPath={`url(#${clipId})`}>
      <G transform={`translate(${w / 2} ${h / 2}) rotate(-32)`}>
        {bands.map((d, i) => (
          <Path key={i} d={d} fill="#cfe3f6" opacity={0.85} />
        ))}
      </G>
    </G>
  );
}

function PhotoCell({
  slot: s,
  photo,
  id,
  frame,
}: {
  slot: Slot;
  photo: Photo | null | undefined;
  id: string;
  frame: (typeof FRAMES)[FourcutFrame];
}) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  return (
    <G>
      <Defs>
        <ClipPath id={id}>
          <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={3} />
        </ClipPath>
      </Defs>
      <Rect x={s.x} y={s.y} width={s.w} height={s.h} rx={3} fill={frame.slot} />
      {photo ? (
        <Image href={{ uri: photo.uri }} x={s.x} y={s.y} width={s.w} height={s.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
      ) : (
        <G opacity={0.5}>
          <Rect x={cx - 30} y={cy - 26} width={60} height={44} rx={8} fill="none" stroke={frame.ink} strokeWidth={3} />
          <Circle cx={cx} cy={cy - 4} r={12} fill="none" stroke={frame.ink} strokeWidth={3} />
        </G>
      )}
    </G>
  );
}

export function FourcutFront({ record: r, width }: { record: FourcutRecord; width: number }) {
  const L = layoutFourcut(r);
  const { w, h, image } = fourcutSize(r);
  const spec = FOURCUT_LAYOUTS[r.layout] ?? FOURCUT_LAYOUTS.strip;
  const card = cardPath(w, h);
  const clip = `fc-clip-${r.id}`;
  const frame = FRAMES[r.frame] ?? FRAMES.white;
  const d = parseDate(r.date);
  const dateText = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const b = spec.brand;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={card} strength={1.4} />
        <Defs>
          <ClipPath id={clip}>
            <Path d={card} />
          </ClipPath>
        </Defs>
        {image ? (
          <G>
            <Path d={card} fill="#ddd" />
            <Image href={{ uri: image.uri }} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
          </G>
        ) : (
          <G>
            <Path d={card} fill={frame.bg} />
            {r.frame === 'sky' && <WaveBands w={w} h={h} clipId={clip} />}
            {spec.slots.map((s, i) => (
              <PhotoCell key={i} slot={s} photo={r.photos[i]} id={`${clip}-${i}`} frame={frame} />
            ))}
            {b.vertical ? (
              <G transform={`translate(${b.x} ${b.y}) rotate(90)`}>
                <T f="code" x={0} y={-2} fontSize={b.size} fill={frame.ink} textAnchor="middle" letterSpacing={3} children={BRAND.en} />
                <T f="mono" x={0} y={24} fontSize={b.dateSize} fill={frame.ink} textAnchor="middle" letterSpacing={3} opacity={0.75} children={dateText} />
              </G>
            ) : (
              <G>
                <T f="code" x={b.x} y={b.y} fontSize={b.size} fill={frame.ink} textAnchor="middle" letterSpacing={2} children={BRAND.en} />
                <T f="mono" x={b.x} y={b.dateY} fontSize={b.dateSize} fill={frame.ink} textAnchor="middle" letterSpacing={3} opacity={0.75} children={`FOUR CUTS · ${dateText}`} />
              </G>
            )}
          </G>
        )}
        <Gloss id={`fc-gloss-${r.id}`} w={w} h={h} />
        <Path d={card} fill="none" stroke="#000" strokeOpacity={0.08} strokeWidth={1.5} />
      </G>
    </Svg>
  );
}

const INK = '#2b2622';
const SUB = '#8a8074';
const RULE = '#cfc5b3';

export function FourcutBack({ record: r, width }: { record: FourcutRecord; width: number }) {
  const L = layoutFourcut(r);
  const { w, h } = fourcutSize(r);
  const landscape = w > h;
  // 세로 카드는 폭 400, 가로 카드는 높이 400 기준으로 그리고 비율만큼 확대
  const s = landscape ? h / 400 : Math.min(w / 400, h / 600);
  const VW = w / s;
  const V = h / s;
  const card = cardPath(w, h, 8);

  const d = parseDate(r.date);
  const no = String(1 + Math.floor(seededRandom(r.id)() * 998)).padStart(3, '0');
  const dateDots = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const subParts = [r.place.trim(), r.withWhom.trim() && `${withParticle(r.withWhom.trim())} 함께`].filter(Boolean);
  const diaryText = r.diary.trim() || '오늘 하루를 짧게 남겨보세요.';

  // 가로 카드: 왼쪽 제목 / 오른쪽 일기
  const leftW = landscape ? Math.round(VW * 0.4) : VW;
  const colX = landscape ? leftW : 0;
  const colW = landscape ? VW - leftW : VW;

  const title = fitLines(r.title.trim() || '오늘의 네컷', leftW - 60, 40, 24, landscape ? 3 : 2, 'serif');
  const titleExtra = (title.lines.length - 1) * 44;
  const sub = fitLine(subParts.join(' · '), leftW - 50, 15, 11, 'serif');

  const titleY = landscape ? 130 : 112;
  const diaryHead = landscape ? 84 : 206 + titleExtra;
  const diaryTop = landscape ? 104 : 238 + titleExtra;
  const bottomRule = V - 100;
  const ruled = Math.max(1, Math.floor((bottomRule - diaryTop - 20) / 30));
  // 세로 카드는 도장 자리를 위해 2줄 비워둔다
  const maxLines = Math.max(1, landscape ? ruled : ruled - 2);
  const diary = fitLines(diaryText, colW - 64, 17, 13, maxLines, 'serif');

  const cells = [
    { label: 'DATE', value: `${d.getMonth() + 1}.${d.getDate()}` },
    { label: 'PLACE', value: r.place.trim() || '-' },
    { label: 'WITH', value: r.withWhom.trim() || '-' },
  ];
  const cellsX = colX + 20;
  const cellW = (colW - 40) / 3;
  const stamp = landscape ? { x: leftW / 2, y: V - 96 } : { x: VW - 78, y: bottomRule - 58 };

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={card} strength={1.4} />
        <Path d={card} fill="#f7f2e8" />
        <G transform={`scale(${s})`}>
          <Rect x={12} y={12} width={VW - 24} height={V - 24} rx={4} fill="none" stroke="#e2d9c8" strokeWidth={1.2} />
          <T f="mono" x={26} y={42} fontSize={11} fill={SUB} letterSpacing={1} children={`FOUR CUTS · ${dateDots}`} />
          <T f="mono" x={VW - 26} y={42} fontSize={11} fill={SUB} textAnchor="end" letterSpacing={1} children={`NO. ${no}`} />

          {title.lines.map((line, i) => (
            <T key={i} f="serifBold" x={leftW / 2} y={titleY + i * 44} fontSize={title.size} fill={INK} textAnchor="middle" children={line} />
          ))}
          {!!sub.text && <T x={leftW / 2} y={titleY + 32 + titleExtra} fontSize={sub.size} fill={SUB} textAnchor="middle" children={sub.text} />}
          {landscape ? (
            <Line x1={leftW} y1={62} x2={leftW} y2={V - 26} stroke={RULE} strokeWidth={1.2} strokeDasharray="2 4" />
          ) : (
            <Line x1={26} y1={172 + titleExtra} x2={VW - 26} y2={172 + titleExtra} stroke={RULE} strokeWidth={1.2} strokeDasharray="2 4" />
          )}
          <T f="sansBold" x={colX + colW / 2} y={diaryHead} fontSize={14} fill={INK} textAnchor="middle" letterSpacing={2} children="오늘의 하루" />

          {/* 줄 노트처럼 밑줄을 채우고 그 위에 일기를 쓴다 */}
          {Array.from({ length: ruled }, (_, i) => (
            <Line key={i} x1={colX + 30} y1={diaryTop + 20 + i * 30} x2={colX + colW - 30} y2={diaryTop + 20 + i * 30} stroke="#e6ddcc" strokeWidth={1} />
          ))}
          {diary.lines.map((line, i) => (
            <T key={i} x={colX + 32} y={diaryTop + 14 + i * 30} fontSize={diary.size} fill={INK} children={line} />
          ))}

          <G transform={`translate(${stamp.x} ${stamp.y}) rotate(-12)`} opacity={0.72}>
            <Circle r={36} fill="none" stroke="#c0503f" strokeWidth={2} />
            <Circle r={30} fill="none" stroke="#c0503f" strokeWidth={0.8} />
            <T f="monoBold" y={-9} fontSize={9} fill="#c0503f" textAnchor="middle" letterSpacing={1} children={BRAND.en.toUpperCase()} />
            <T f="sansHeavy" y={9} fontSize={15} fill="#c0503f" textAnchor="middle" children={`${d.getMonth() + 1}.${d.getDate()}`} />
            <T f="mono" y={22} fontSize={7} fill="#c0503f" textAnchor="middle" children="SAVED" />
          </G>

          <Line x1={colX + 26} y1={bottomRule} x2={colX + colW - 26} y2={bottomRule} stroke={RULE} strokeWidth={1.2} strokeDasharray="2 4" />
          <T f="monoBold" x={colX + 26} y={bottomRule + 26} fontSize={11} fill={SUB} letterSpacing={1.5} children="MEMORY" />
          {cells.map((c, i) => {
            const cx = cellsX + cellW * i + cellW / 2;
            const v = fitLine(c.value, cellW - 16, 16, 11, 'sans');
            return (
              <G key={c.label}>
                {i > 0 && <Line x1={cellsX + cellW * i} y1={bottomRule + 40} x2={cellsX + cellW * i} y2={V - 26} stroke={RULE} strokeWidth={1.2} />}
                <T f="mono" x={cx} y={bottomRule + 50} fontSize={9} fill={SUB} textAnchor="middle" letterSpacing={1} children={c.label} />
                <T f="sansBold" x={cx} y={bottomRule + 72} fontSize={v.size} fill={INK} textAnchor="middle" children={v.text} />
              </G>
            );
          })}
        </G>
        <PaperOverlay id={`fcb-${r.id}`} d={card} width={w} height={h} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
