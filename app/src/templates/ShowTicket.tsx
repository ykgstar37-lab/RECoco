// 공연·전시 입장권: 종류별 색 머리띠 + 포스터 자리 + 정보 표 + 뜯는 선 아래 스텁(바코드)
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { ShowRecord, ShowType } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const M = 40;
const INK = '#221f26';
const SUB = '#8b8591';
const LINE = '#e6e2ea';

/** 종류마다 종이·머리띠 색과 부르는 이름 */
export const SHOW_TYPES: Record<ShowType, { label: string; head: string; deep: string; paper: string; kindWord: string; placeWord: string; castWord: string }> = {
  concert: { label: '콘서트', head: '#3b2f63', deep: '#241d40', paper: '#f7f4fb', kindWord: '공연 입장권', placeWord: '공연장', castWord: '아티스트' },
  play: { label: '뮤지컬·연극', head: '#a4325a', deep: '#7c2344', paper: '#fdf3f6', kindWord: '공연 입장권', placeWord: '극장', castWord: '출연' },
  exhibition: { label: '전시', head: '#2f5d4a', deep: '#234637', paper: '#f7f6f0', kindWord: '전시 관람권', placeWord: '전시장', castWord: '작가' },
};

const HEAD_H = 132;
const POSTER_W = 300;
const TITLE_LINE = 52;
const INFO_ROW = 62;
const STUB_H = 300;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: ShowRecord) {
  const t = SHOW_TYPES[r.type] ?? SHOW_TYPES.concert;
  const posterH = r.photo ? Math.round(Math.min(420, Math.max(260, (POSTER_W * r.photo.height) / Math.max(1, r.photo.width)))) : 300;
  const posterTop = HEAD_H + 34;
  const posterBot = posterTop + posterH;
  const title = fitLines(r.title.trim() || '제목 없음', PW - M * 2, 46, 30, 2, 'sansHeavy');
  const titleTop = posterBot + 56;
  const artist = r.artist.trim() ? fitLine(r.artist.trim(), PW - M * 2, 26, 18, 'sans') : null;
  const infoTop = titleTop + (title.lines.length - 1) * TITLE_LINE + (artist ? 46 : 16) + 26;
  const info: [string, string][] = ([
    [t.placeWord, r.place.trim()],
    ['일시', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    [r.type === 'exhibition' ? '관람' : '좌석', r.type === 'exhibition' ? `${r.people}명` : [r.seat.trim(), `${r.people}명`].filter(Boolean).join('  ·  ')],
  ] as [string, string][]).filter(([, v]) => v);
  const infoBot = infoTop + info.length * INFO_ROW;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2 - 40, 25, 19, 3, 'sans') : null;
  const starsTop = infoBot + 28;
  const memoTop = starsTop + 54;
  const cut = (memo ? memoTop + 22 + memo.lines.length * 34 : starsTop + 44) + 34;
  const height = cut + STUB_H;
  return { t, posterH, posterTop, posterBot, title, titleTop, artist, info, infoTop, infoBot, starsTop, memo, memoTop, cut, height };
}

export function layoutShow(r: ShowRecord): TemplateLayout {
  const { height, cut } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: cut + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

const NOTCH = 20;

/** 뜯는 선 자리가 양옆으로 파인 티켓 */
function ticketPath(h: number, cut: number) {
  const R = 18;
  return [
    `M${R},0 H${PW - R} Q${PW},0 ${PW},${R}`,
    `V${cut - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${PW},${cut + NOTCH}`,
    `V${h - R} Q${PW},${h} ${PW - R},${h} H${R} Q0,${h} 0,${h - R}`,
    `V${cut + NOTCH} A${NOTCH},${NOTCH} 0 0 0 0,${cut - NOTCH}`,
    `V${R} Q0,0 ${R},0 Z`,
  ].join(' ');
}

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** 포스터가 없을 때 종류마다 그리는 그림 (마이크 / 가면 / 액자) */
function TypeArt({ type, x, y, w, h, color }: { type: ShowType; x: number; y: number; w: number; h: number; color: string }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (type === 'concert') {
    return (
      <G>
        <Rect x={cx - 26} y={cy - 96} width={52} height={104} rx={26} fill={color} />
        <Path d={`M${cx - 52},${cy - 16} Q${cx - 52},${cy + 44} ${cx},${cy + 44} Q${cx + 52},${cy + 44} ${cx + 52},${cy - 16}`} stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />
        <Rect x={cx - 6} y={cy + 40} width={12} height={54} rx={6} fill={color} />
        <Rect x={cx - 34} y={cy + 90} width={68} height={12} rx={6} fill={color} />
        {[-1, 1].map((s) => (
          <Path key={s} d={`M${cx + s * 96},${cy - 40} q${s * 18},40 0,80`} stroke={color} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.45} />
        ))}
      </G>
    );
  }
  if (type === 'play') {
    return (
      <G>
        {[-1, 1].map((s) => (
          <G key={s} transform={`translate(${s * 52} ${s * 10}) rotate(${s * 8} ${cx} ${cy})`}>
            <Path d={`M${cx - 56},${cy - 56} H${cx + 56} V${cy - 6} Q${cx + 56},${cy + 72} ${cx},${cy + 72} Q${cx - 56},${cy + 72} ${cx - 56},${cy - 6} Z`} fill={color} opacity={s > 0 ? 1 : 0.55} />
            <Circle cx={cx - 22} cy={cy - 14} r={9} fill="#fff" />
            <Circle cx={cx + 22} cy={cy - 14} r={9} fill="#fff" />
            <Path d={s > 0 ? `M${cx - 24},${cy + 22} Q${cx},${cy + 48} ${cx + 24},${cy + 22}` : `M${cx - 24},${cy + 40} Q${cx},${cy + 14} ${cx + 24},${cy + 40}`} stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
          </G>
        ))}
      </G>
    );
  }
  return (
    <G>
      <Rect x={cx - 92} y={cy - 104} width={184} height={208} rx={8} fill="none" stroke={color} strokeWidth={12} />
      <Rect x={cx - 70} y={cy - 82} width={140} height={164} rx={4} fill={color} opacity={0.18} />
      <Circle cx={cx + 30} cy={cy - 40} r={18} fill={color} opacity={0.55} />
      <Path d={`M${cx - 66},${cy + 78} L${cx - 14},${cy + 8} L${cx + 18},${cy + 46} L${cx + 44},${cy + 18} L${cx + 66},${cy + 78} Z`} fill={color} opacity={0.75} />
    </G>
  );
}

export function ShowTicket({ record: r, width }: { record: ShowRecord; width: number }) {
  const L = layoutShow(r);
  const { t, posterH, posterTop, posterBot, title, titleTop, artist, info, infoTop, starsTop, memo, memoTop, cut, height } = computeLayout(r);
  const shape = ticketPath(height, cut);
  const id = `show-${r.id}`;
  const rnd = seededRandom(r.id);
  const serial = `${String(1 + Math.floor(rnd() * 98)).padStart(2, '0')}-${String(Math.floor(rnd() * 999999)).padStart(6, '0')}`;
  const posterX = (PW - POSTER_W) / 2;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-poster`}>
            <Rect x={posterX} y={posterTop} width={POSTER_W} height={posterH} rx={6} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={t.paper} />

        {/* 머리띠 */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={0} y={0} width={PW} height={HEAD_H} fill={t.head} />
          <Rect x={0} y={HEAD_H - 10} width={PW} height={10} fill={t.deep} />
          {[70, 170, 430, 530].map((x, i) => (
            <Circle key={x} cx={x} cy={i % 2 ? 40 : 92} r={i % 2 ? 7 : 5} fill="#fff" opacity={0.25} />
          ))}
        </G>
        <T f="sansHeavy" x={M} y={58} fontSize={24} fill="#fff" children={`${BRAND.ko} ${t.kindWord}`} />
        <T f="monoBold" x={M} y={92} fontSize={15} fill="#fff" opacity={0.7} letterSpacing={4} children="ADMIT ONE" />
        <Rect x={PW - M - 108} y={40} width={108} height={38} rx={19} fill="#fff" opacity={0.92} />
        <T f="sansBold" x={PW - M - 54} y={65} fontSize={17} fill={t.head} textAnchor="middle" children={t.label} />

        {/* 포스터 */}
        <Rect x={posterX - 8} y={posterTop - 8} width={POSTER_W + 16} height={posterH + 16} rx={10} fill="#fff" stroke={LINE} strokeWidth={2} />
        {r.photo ? (
          <Image href={{ uri: r.photo.uri }} x={posterX} y={posterTop} width={POSTER_W} height={posterH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-poster)`} />
        ) : (
          <G>
            <Rect x={posterX} y={posterTop} width={POSTER_W} height={posterH} rx={6} fill={t.head} opacity={0.08} />
            <TypeArt type={r.type} x={posterX} y={posterTop} w={POSTER_W} h={posterH} color={t.head} />
          </G>
        )}

        {/* 제목·출연 */}
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={PW / 2} y={titleTop + i * TITLE_LINE} fontSize={title.size} textAnchor="middle" children={line} />
        ))}
        {artist && <T x={PW / 2} y={titleTop + (title.lines.length - 1) * TITLE_LINE + 40} fontSize={artist.size} fill={SUB} textAnchor="middle" children={artist.text} />}

        {/* 정보 */}
        {info.map(([k, v], i) => {
          const y = infoTop + i * INFO_ROW;
          const value = fitLine(v, PW - M * 2 - 120, 24, 17, 'sansBold');
          return (
            <G key={k}>
              <T f="sansBold" x={M} y={y + 30} fontSize={16} fill={t.head} children={k} />
              <T f="sansBold" x={PW - M} y={y + 31} fontSize={value.size} textAnchor="end" children={value.text} />
              <Line x1={M} y1={y + INFO_ROW - 12} x2={PW - M} y2={y + INFO_ROW - 12} stroke={LINE} strokeWidth={1.6} />
            </G>
          );
        })}

        {/* 별점 */}
        <T f="sansBold" x={M} y={starsTop + 30} fontSize={16} fill={t.head} children="관람평" />
        {[0, 1, 2, 3, 4].map((s) => (
          <Path
            key={s}
            d={starPath(PW - M - 18 - (4 - s) * 40, starsTop + 22, 16)}
            fill={s < r.stars ? t.head : 'none'}
            stroke={t.head}
            strokeOpacity={s < r.stars ? 1 : 0.3}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {/* 한 줄 감상 */}
        {memo &&
          memo.lines.map((line, i) => (
            <T key={i} x={M + 20} y={memoTop + 22 + i * 34} fontSize={memo.size} fill={SUB} children={line} />
          ))}
        {memo && <Rect x={M} y={memoTop + 2} width={5} height={memo.lines.length * 34 + 6} rx={2.5} fill={t.head} opacity={0.5} />}

        {/* 뜯는 선 + 스텁 */}
        <Line x1={NOTCH + 12} y1={cut} x2={PW - NOTCH - 12} y2={cut} stroke={LINE} strokeWidth={3} strokeDasharray="10 8" />
        <T f="mono" x={M} y={cut + 50} fontSize={16} fill={SUB} letterSpacing={2} children={`NO. ${serial}`} />
        <T f="sansBold" x={PW - M} y={cut + 50} fontSize={16} fill={t.head} textAnchor="end" children={t.label} />
        <Barcode seed={`${r.id}-show`} x={M} y={cut + 78} width={PW - M * 2} height={104} color={INK} />
        <T f="mono" x={PW / 2} y={cut + 212} fontSize={19} textAnchor="middle" letterSpacing={5} children={serial.replace('-', ' ')} />
        <T f="sans" x={PW / 2} y={cut + 252} fontSize={16} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · 오늘의 자리를 기억해요`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
