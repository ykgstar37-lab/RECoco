// 공연·전시 입장권 (기본): 크림 종이 + 이중 테두리 + 제목/출연 + 정보 3칸 + 남색 스텁(번호·바코드)
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { ShowRecord } from '../types';
import { RETRO_COLORS, retroColorOf } from './ConcertRetro';
import { SHOW_TYPES } from './ShowTicket';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const M = 46;
export const SHOW_PAPER = '#fbf5ea';
const INK = '#20242f';
const SUB = '#8a8578';
const LINE = '#ded5c4';

const TITLE_LINE = 58;
const STUB_H = 420;
const NOTCH = 20;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: ShowRecord) {
  const title = fitLines(r.title.trim() || '제목 없음', PW - M * 2 - 20, 52, 32, 2, 'sansHeavy');
  const artist = fitLine(r.artist.trim(), PW - M * 2 - 40, 40, 26, 'hand');
  const titleTop = 214;
  const artistTop = titleTop + (title.lines.length - 1) * TITLE_LINE + 54;
  const photoTop = artistTop + (r.artist.trim() ? 30 : 0) + 24;
  const photoH = r.photo ? Math.round(Math.min(360, Math.max(240, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const infoTop = photoTop + (r.photo ? photoH + 30 : 6);
  const infoBot = infoTop + 128;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2 - 30, 30, 24, 3, 'hand') : null;
  const starsTop = infoBot + 22;
  const memoTop = starsTop + 52;
  const bandTop = (memo ? memoTop + memo.lines.length * 38 : starsTop + 46) + 18;
  const cut = bandTop + 78;
  const height = cut + STUB_H;
  return { title, artist, titleTop, artistTop, photoTop, photoH, infoTop, infoBot, starsTop, memo, memoTop, bandTop, cut, height };
}

export function layoutShowRetro(r: ShowRecord): TemplateLayout {
  const { height, cut } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: cut + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 뜯는 선 자리가 파인 티켓 + 스텁 쪽은 톱니 */
export function ticketShape(h: number, cut: number, w = PW, connected = false) {
  const R = connected ? 0 : 16;
  return [
    `M${R},0 H${w - R} Q${w},0 ${w},${R}`,
    `V${cut - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${w},${cut + NOTCH}`,
    `V${h - R} Q${w},${h} ${w - R},${h} H${R} Q0,${h} 0,${h - R}`,
    `V${cut + NOTCH} A${NOTCH},${NOTCH} 0 0 0 0,${cut - NOTCH}`,
    `V${R} Q0,0 ${R},0 Z`,
  ].join(' ');
}

export function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** 작은 아이콘 (달력 / 핀 / 티켓) */
function MiniIcon({ kind, x, y, color }: { kind: 'date' | 'pin' | 'seat'; x: number; y: number; color: string }) {
  if (kind === 'date')
    return (
      <G>
        <Rect x={x} y={y + 2} width={16} height={15} rx={3} fill="none" stroke={color} strokeWidth={2} />
        <Line x1={x} y1={y + 7} x2={x + 16} y2={y + 7} stroke={color} strokeWidth={2} />
        <Line x1={x + 5} y1={y} x2={x + 5} y2={y + 4} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1={x + 11} y1={y} x2={x + 11} y2={y + 4} stroke={color} strokeWidth={2} strokeLinecap="round" />
      </G>
    );
  if (kind === 'pin')
    return (
      <G>
        <Path d={`M${x + 8},${y + 18} C${x + 8},${y + 12} ${x + 15},${y + 10} ${x + 15},${y + 6} A7,7 0 1 0 ${x + 1},${y + 6} C${x + 1},${y + 10} ${x + 8},${y + 12} ${x + 8},${y + 18} Z`} fill="none" stroke={color} strokeWidth={2} />
        <Circle cx={x + 8} cy={y + 6} r={2.4} fill={color} />
      </G>
    );
  return (
    <G>
      <Path d={`M${x},${y + 3} H${x + 16} V${y + 8} A2.6,2.6 0 0 0 ${x + 16},${y + 13} V${y + 17} H${x} V${y + 13} A2.6,2.6 0 0 0 ${x},${y + 8} Z`} fill="none" stroke={color} strokeWidth={2} />
    </G>
  );
}

export function ShowRetro({ record: r, width, connected = false }: { record: ShowRecord; width: number; connected?: boolean }) {
  const L = layoutShowRetro(r);
  const { deep: SHOW_NAVY, accent: SHOW_CORAL } = retroColorOf(r);
  const { title, artist, titleTop, artistTop, photoTop, photoH, infoTop, infoBot, starsTop, memo, memoTop, bandTop, cut, height } = computeLayout(r);
  const shape = ticketShape(height, cut, PW, connected);
  const id = `showretro-${r.id}`;
  const rnd = seededRandom(r.id);
  const serial = String(Math.floor(rnd() * 999999)).padStart(6, '0');

  const t = SHOW_TYPES[r.type] ?? SHOW_TYPES.play;
  const info: [string, string, 'date' | 'pin' | 'seat'][] = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `\n${r.time}` : ''}`, 'date'],
    ['VENUE', r.place.trim() || t.placeWord, 'pin'],
    ['SEAT', r.type === 'exhibition' ? `${r.people}명` : [r.seat.trim(), `${r.people}명`].filter(Boolean).join('\n'), 'seat'],
  ];
  const colW = (PW - M * 2) / 3;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={8} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={SHOW_PAPER} />

        {/* 이중 테두리 + 모서리 별 */}
        <Rect x={22} y={22} width={PW - 44} height={cut - 44} rx={10} fill="none" stroke={SHOW_NAVY} strokeWidth={2} opacity={0.75} />
        <Rect x={30} y={30} width={PW - 60} height={cut - 60} rx={6} fill="none" stroke={SHOW_NAVY} strokeWidth={0.9} opacity={0.5} />
        {[
          [46, 46],
          [PW - 46, 46],
          [46, cut - 46],
          [PW - 46, cut - 46],
        ].map(([x, y]) => (
          <Path key={`${x}-${y}`} d={`M${x},${y - 9} Q${x + 1.6},${y - 1.6} ${x + 9},${y} Q${x + 1.6},${y + 1.6} ${x},${y + 9} Q${x - 1.6},${y + 1.6} ${x - 9},${y} Q${x - 1.6},${y - 1.6} ${x},${y - 9} Z`} fill={SHOW_NAVY} opacity={0.35} />
        ))}

        {/* LIVE YOUR MOMENT */}
        <Line x1={M + 30} y1={86} x2={M + 76} y2={86} stroke={SHOW_NAVY} strokeWidth={1.2} />
        <Line x1={PW - M - 76} y1={86} x2={PW - M - 30} y2={86} stroke={SHOW_NAVY} strokeWidth={1.2} />
        <T f="monoBold" x={PW / 2} y={92} fontSize={15} letterSpacing={5} textAnchor="middle" fill={SHOW_NAVY} children={r.type === 'exhibition' ? "ENJOY THE MOMENT" : "LIVE YOUR MOMENT"} />

        {/* 종류 칩 */}
        <Rect x={PW / 2 - 76} y={116} width={152} height={44} rx={22} fill={SHOW_CORAL} />
        <T f="sansBold" x={PW / 2} y={146} fontSize={21} textAnchor="middle" fill="#fff" children={t.label} />

        {/* 제목 · 아티스트 */}
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={PW / 2} y={titleTop + i * TITLE_LINE} fontSize={title.size} textAnchor="middle" fill={SHOW_NAVY} children={line} />
        ))}
        {!!artist.text && <T f="hand" x={PW / 2} y={artistTop} fontSize={artist.size} textAnchor="middle" fill={SHOW_CORAL} children={artist.text} />}

        {/* 사진 */}
        {r.photo && (
          <G>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={8} fill={LINE} />
            <Image href={{ uri: r.photo.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
          </G>
        )}

        {/* 정보 3칸 */}
        <Line x1={M} y1={infoTop} x2={PW - M} y2={infoTop} stroke={LINE} strokeWidth={1.6} />
        {info.map(([k, v, icon], i) => {
          const x = M + colW * i;
          const lines = v.split('\n');
          return (
            <G key={k}>
              {i > 0 && <Line x1={x} y1={infoTop + 12} x2={x} y2={infoBot - 12} stroke={LINE} strokeWidth={1.4} />}
              <MiniIcon kind={icon} x={x + 14} y={infoTop + 22} color={SHOW_CORAL} />
              <T f="monoBold" x={x + 38} y={infoTop + 36} fontSize={13} letterSpacing={2} fill={SHOW_CORAL} children={k} />
              {lines.map((line, j) => {
                const f = fitLine(line, colW - 28, 19, 13, 'sansBold');
                return <T key={j} f="sansBold" x={x + 14} y={infoTop + 68 + j * 26} fontSize={f.size} children={f.text} />;
              })}
            </G>
          );
        })}
        <Line x1={M} y1={infoBot} x2={PW - M} y2={infoBot} stroke={LINE} strokeWidth={1.6} />

        {/* 별점 · 한 줄 감상 */}
        <T f="monoBold" x={M} y={starsTop + 28} fontSize={13} letterSpacing={2} fill={SHOW_CORAL} children="RATING" />
        {[0, 1, 2, 3, 4].map((s) => (
          <Path key={s} d={starPath(PW - M - 16 - (4 - s) * 38, starsTop + 20, 15)} fill={s < r.stars ? SHOW_CORAL : 'none'} stroke={SHOW_CORAL} strokeOpacity={s < r.stars ? 1 : 0.35} strokeWidth={2} strokeLinejoin="round" />
        ))}
        {memo &&
          memo.lines.map((line, i) => (
            <T key={i} f="hand" x={PW / 2} y={memoTop + i * 38} fontSize={memo.size} textAnchor="middle" fill={INK} children={line} />
          ))}

        {/* 아래 남색 띠 */}
        <Rect x={M + 10} y={bandTop} width={PW - (M + 10) * 2} height={44} rx={22} fill={SHOW_NAVY} />
        <T f="monoBold" x={PW / 2} y={bandTop + 28} fontSize={13} letterSpacing={4} textAnchor="middle" fill="#fff" children={r.type === 'exhibition' ? 'ART · MOMENT · MEMORY' : 'STAGE · MOMENT · MEMORY'} />

        {/* 스텁 (남색) */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={0} y={cut} width={PW} height={height - cut} fill={SHOW_NAVY} />
        </G>
        <Line x1={NOTCH + 12} y1={cut} x2={PW - NOTCH - 12} y2={cut} stroke={SHOW_PAPER} strokeWidth={3} strokeDasharray="9 7" />
        <T f="monoBold" x={PW / 2} y={cut + 62} fontSize={17} letterSpacing={7} textAnchor="middle" fill="#fff" children="TICKET" />
        <Rect x={PW / 2 - 130} y={cut + 84} width={260} height={52} rx={26} fill={SHOW_CORAL} />
        <T f="monoBold" x={PW / 2} y={cut + 118} fontSize={22} letterSpacing={3} textAnchor="middle" fill="#fff" children={`No. ${serial}`} />
        {[
          ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
          ['VENUE', r.place.trim() || '공연장'],
          ['ADMISSION', r.seat.trim() || `${r.people}명`],
        ].map(([k, v], i) => {
          const y = cut + 176 + i * 58;
          const value = fitLine(v, PW - M * 2, 20, 14, 'sansBold');
          return (
            <G key={k}>
              <T f="mono" x={M} y={y} fontSize={13} letterSpacing={2} fill="#fff" opacity={0.6} children={k} />
              <T f="sansBold" x={M} y={y + 26} fontSize={value.size} fill="#fff" children={value.text} />
            </G>
          );
        })}
        <Rect x={M} y={cut + 348} width={PW - M * 2} height={54} rx={4} fill="#fff" />
        <Barcode seed={`${r.id}-show`} x={M + 12} y={cut + 354} width={PW - M * 2 - 24} height={42} color={SHOW_NAVY} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
