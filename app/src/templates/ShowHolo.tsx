// 공연·전시 영수증 테마 "홀로그램": 진한 파란 종이에 칸을 나눈 기록표 (Title / Cast / Rating / Review)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { HoloColor, ShowRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';
import { SHOW_TYPES } from './ShowTicket';

const PW = 560;
const PAD = 16;
const M = 34;
/** 기록표 종이 색 (바탕 · 그림자 · 위쪽 홀로그램 띠 · 의자 아이콘) */
export const HOLO_COLORS: Record<HoloColor, { name: string; base: string; deep: string; gold: string; holo: string[]; shine: number }> = {
  blue: { name: '파랑', base: '#17359b', deep: '#0f2470', gold: '#ffd84d', holo: ['#8be9f7', '#ffe27a', '#f7a8d8', '#9bf5c0'], shine: 0.09 },
  violet: { name: '보라', base: '#4b2a9b', deep: '#331a70', gold: '#ffd84d', holo: ['#c9a8f7', '#ffe27a', '#f7a8d8', '#a8f0f7'], shine: 0.09 },
  teal: { name: '청록', base: '#0e6b6b', deep: '#074f4f', gold: '#ffe08a', holo: ['#8be9f7', '#ffe27a', '#9bf5c0', '#a8d8f7'], shine: 0.09 },
  wine: { name: '와인', base: '#7a1f45', deep: '#571030', gold: '#ffd07a', holo: ['#f7a8d8', '#ffe27a', '#f7c8a8', '#e9a8f7'], shine: 0.09 },
  black: { name: '검정', base: '#17171c', deep: '#0b0b0e', gold: '#ffd84d', holo: ['#8be9f7', '#f7a8d8', '#ffe27a', '#9bf5c0'], shine: 0.2 },
};

export const HOLO_COLOR_IDS = Object.keys(HOLO_COLORS) as HoloColor[];

export const holoColorOf = (r: Pick<ShowRecord, 'color'>) => HOLO_COLORS[(r.color as HoloColor) in HOLO_COLORS ? (r.color as HoloColor) : 'blue'];

const ROW = 74;
const TOOTH = 16;
const TITLE_HEAD = 40; // 제목 칸에서 "Title." 딱지가 쓰는 윗자리
const TITLE_LINE = 52; // 제목 한 줄이 쓰는 높이

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: ShowRecord) {
  const t = SHOW_TYPES[r.type] ?? SHOW_TYPES.play;
  const title = fitLines(r.title.trim() || '제목 없음', PW - M * 2 - 30, 44, 26, 2, 'sansHeavy');
  const titleTop = 128;
  const titleBoxH = TITLE_HEAD + title.lines.length * TITLE_LINE;
  const photoTop = titleTop + titleBoxH + 14;
  const photoH = r.photo ? Math.round(Math.min(380, Math.max(240, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const rowsTop = photoTop + (r.photo ? photoH + 14 : 0);
  const rows: [string, string, string][] = [
    ['Date.', '날짜', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['Place.', t.placeWord, r.place.trim()],
    ['Cast.', t.castWord, r.artist.trim()],
    ...(r.type === 'exhibition' ? [] : ([['Seat.', '좌석', r.seat.trim()]] as [string, string, string][])),
  ];
  const rowsBot = rowsTop + rows.length * ROW;
  const ratingBot = rowsBot + 84;
  const memo = fitLines(r.memo.trim(), PW - M * 2 - 40, 26, 20, 3, 'hand');
  const reviewH = 56 + Math.max(2, r.memo.trim() ? memo.lines.length : 2) * 38;
  const height = ratingBot + reviewH + 96;
  return { t, title, titleTop, titleBoxH, photoTop, photoH, rowsTop, rows, rowsBot, ratingBot, memo, reviewH, height };
}

export function layoutShowHolo(r: ShowRecord): TemplateLayout {
  const { height } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.84, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 위아래가 뜯긴 톱니 (홀로그램 티켓 느낌) */
function toothPath(h: number, connected: boolean) {
  if (connected) return `M0,0 H${PW} V${h} H0 Z`;
  const n = Math.round(PW / TOOTH);
  const step = PW / n;
  let d = `M0,${TOOTH * 0.55}`;
  for (let i = 0; i < n; i++) d += ` L${(step * (i + 0.5)).toFixed(1)},0 L${(step * (i + 1)).toFixed(1)},${TOOTH * 0.55}`;
  d += ` L${PW},${h - TOOTH * 0.55}`;
  for (let i = n; i > 0; i--) d += ` L${(step * (i - 0.5)).toFixed(1)},${h} L${(step * (i - 1)).toFixed(1)},${h - TOOTH * 0.55}`;
  return `${d} Z`;
}

/** 접이식 극장 의자 (별점 대신) */
function SeatIcon({ x, y, s, on, gold }: { x: number; y: number; s: number; on: boolean; gold: string }) {
  const c = on ? gold : '#ffffff';
  const o = on ? 1 : 0.32;
  return (
    <G opacity={o}>
      <Path d={`M${x + s * 0.18},${y + s * 0.34} V${y + s * 0.1} Q${x + s * 0.18},${y} ${x + s * 0.3},${y} H${x + s * 0.7} Q${x + s * 0.82},${y} ${x + s * 0.82},${y + s * 0.1} V${y + s * 0.34}`} stroke={c} strokeWidth={s * 0.11} fill="none" strokeLinecap="round" />
      <Rect x={x + s * 0.1} y={y + s * 0.38} width={s * 0.8} height={s * 0.16} rx={s * 0.08} fill={c} />
      <Path d={`M${x + s * 0.22},${y + s * 0.56} V${y + s * 0.92} M${x + s * 0.78},${y + s * 0.56} V${y + s * 0.92}`} stroke={c} strokeWidth={s * 0.11} strokeLinecap="round" />
    </G>
  );
}

export function ShowHolo({ record: r, width, connected = false }: { record: ShowRecord; width: number; connected?: boolean }) {
  const L = layoutShowHolo(r);
  const c = holoColorOf(r);
  const { base: BLUE, deep: BLUE_DEEP, gold: GOLD, holo: HOLO, shine: SHINE } = c;
  const { t, title, titleTop, titleBoxH, photoTop, photoH, rowsTop, rows, rowsBot, ratingBot, memo, reviewH, height } = computeLayout(r);
  const shape = toothPath(height, connected);
  const id = `holo-${r.id}`;
  const rnd = seededRandom(r.id);
  const year = r.date.slice(0, 4);

  const box = (x: number, y: number, w: number, h: number, key: string) => (
    <Rect key={key} x={x} y={y} width={w} height={h} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.55} />
  );

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={BLUE} />

        {/* 홀로그램: 비스듬한 색 띠 */}
        <G clipPath={`url(#${id}-card)`}>
          {HOLO.map((c, i) => (
            <Path key={c} d={`M${-120 + i * 150},${height} L${120 + i * 150},0 L${190 + i * 150},0 L${-50 + i * 150},${height} Z`} fill={c} opacity={SHINE} />
          ))}
          <Rect x={0} y={0} width={PW} height={10} fill={BLUE_DEEP} opacity={0.5} />
        </G>
        {/* 테두리 */}
        <Rect x={18} y={18} width={PW - 36} height={height - 36} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.5} />

        {/* 머리 */}
        <T f="monoBold" x={M} y={58} fontSize={15} letterSpacing={3} fill="#fff" opacity={0.85} children="ORIGINAL TICKET" />
        <T f="mono" x={PW - M} y={58} fontSize={15} textAnchor="end" fill="#fff" opacity={0.7} children={`(${year})`} />
        <T f="sansBold" x={M} y={92} fontSize={16} fill={HOLO[1]} children={`${t.label} · ${BRAND.ko}`} />

        {/* 제목 칸 */}
        {box(M, titleTop, PW - M * 2, titleBoxH, 'title')}
        <T f="mono" x={M + 14} y={titleTop + 26} fontSize={15} fill="#fff" opacity={0.7} children="Title." />
        {/* 제목은 Title. 딱지 아래 남은 자리(줄마다 TITLE_LINE)의 한가운데에 앉힌다 */}
        {title.lines.map((line, i) => (
          <T
            key={i}
            f="sansHeavy"
            x={PW / 2}
            y={titleTop + TITLE_HEAD + i * TITLE_LINE + (TITLE_LINE + title.size * 0.72) / 2}
            fontSize={title.size}
            textAnchor="middle"
            fill={GOLD}
            children={line}
          />
        ))}

        {/* 사진 */}
        {r.photo && (
          <G>
            {box(M, photoTop, PW - M * 2, photoH, 'photo')}
            <Image href={{ uri: r.photo.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} opacity={0.92} />
          </G>
        )}

        {/* 정보 칸 */}
        {rows.map(([en, ko, v], i) => {
          const y = rowsTop + i * ROW;
          const value = fitLine(v || '—', PW - M * 2 - 190, 22, 15, 'sansBold');
          return (
            <G key={en}>
              {box(M, y, PW - M * 2, ROW, en)}
              <T f="mono" x={M + 14} y={y + 30} fontSize={15} fill="#fff" opacity={0.7} children={en} />
              <T f="sans" x={M + 14} y={y + 56} fontSize={13} fill="#fff" opacity={0.45} children={ko} />
              <T f="sansBold" x={PW - M - 16} y={y + 46} fontSize={value.size} textAnchor="end" fill="#fff" children={value.text} />
            </G>
          );
        })}

        {/* 별점: 극장 의자 */}
        {box(M, rowsBot, PW - M * 2, 84, 'rating')}
        <T f="mono" x={M + 14} y={rowsBot + 30} fontSize={15} fill="#fff" opacity={0.7} children="Rating." />
        {[0, 1, 2, 3, 4].map((s) => (
          <SeatIcon key={s} x={PW - M - 40 - (4 - s) * 46} y={rowsBot + 22} s={40} on={s < r.stars} gold={GOLD} />
        ))}
        <T f="mono" x={M + 14} y={rowsBot + 62} fontSize={14} fill="#fff" opacity={0.45} children={`( ${r.stars} / 5 )`} />

        {/* 감상 칸 */}
        {box(M, ratingBot, PW - M * 2, reviewH, 'review')}
        <T f="mono" x={M + 14} y={ratingBot + 30} fontSize={15} fill="#fff" opacity={0.7} children="Review." />
        {r.memo.trim() ? (
          memo.lines.map((line, i) => (
            <T key={i} f="hand" x={M + 24} y={ratingBot + 68 + i * 38} fontSize={memo.size} fill="#fff" children={line} />
          ))
        ) : (
          [0, 1].map((i) => <Line key={i} x1={M + 24} y1={ratingBot + 62 + i * 38} x2={PW - M - 24} y2={ratingBot + 62 + i * 38} stroke="#fff" strokeWidth={1.2} opacity={0.22} strokeDasharray="6 6" />)
        )}

        {/* 아래 */}
        <T f="mono" x={M} y={height - 44} fontSize={14} fill="#fff" opacity={0.55} letterSpacing={2} children={`No. ${String(Math.floor(rnd() * 999999)).padStart(6, '0')}`} />
        <T f="sans" x={PW - M} y={height - 44} fontSize={14} textAnchor="end" fill="#fff" opacity={0.55} children={`${r.people}명 관람`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
