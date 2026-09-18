// 영수증 테마 "핑크 포토 티켓": 분홍/검정 블록, ADMIT ONE, 사진 칸, 큰 글자 띠, 아래 바코드
// 콘서트와 공연·전시가 같이 쓴다 (가운데 띠 글자와 마지막 줄만 카테고리에 맞춰 바뀐다)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';
import { TicketRecord, ticketKindOf } from './ticketKind';
import { PAPER_FONTS as FONTS } from '../theme';

/** 이 티켓을 쓸 수 있는 기록 (콘서트 · 공연전시) */
export type PhotoTicketRecord = TicketRecord;

const PW = 560;
const PAD = 16;
const M = 34;
const PINK = '#f7b8cc';
const PINK_DEEP = '#e07fa1';
const DARK = '#141118';
const PAPER = '#fdf3f6';

const TITLE_LINE = 52;
const TOOTH = 14;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: PhotoTicketRecord) {
  const photoH = r.photo ? Math.round(Math.min(420, Math.max(280, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 300;
  const headBot = 236;
  const artistTop = headBot + 56;
  const artist = fitLines(r.artist.trim() || r.title.trim() || 'ARTIST', PW - M * 2, 46, 28, 2, 'sansHeavy');
  const bigTop = artistTop + (artist.lines.length - 1) * TITLE_LINE + 108;
  const photoTop = bigTop + 40;
  const photoBot = photoTop + photoH;
  const infoTop = photoBot + 34;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2 - 20, 26, 20, 2, 'sans') : null;
  // 별점 아래에 소감을 따로 깔고(같은 줄이면 긴 소감이 별점 위로 넘어온다) 그만큼 아래를 늘린다
  const infoBot = infoTop + 224 + (memo ? 44 + (memo.lines.length - 1) * 32 : 0);
  const height = infoBot + 150;
  return { photoH, headBot, artist, artistTop, bigTop, photoTop, photoBot, infoTop, memo, infoBot, height };
}

export function layoutPhotoTicket(r: PhotoTicketRecord): TemplateLayout {
  const { height } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.86, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 위아래가 뜯긴 톱니 모양 티켓 */
function toothPath(h: number) {
  const n = Math.round(PW / TOOTH);
  const step = PW / n;
  let d = `M0,${TOOTH * 0.5}`;
  for (let i = 0; i < n; i++) d += ` L${(step * (i + 0.5)).toFixed(1)},0 L${(step * (i + 1)).toFixed(1)},${TOOTH * 0.5}`;
  d += ` L${PW},${h - TOOTH * 0.5}`;
  for (let i = n; i > 0; i--) d += ` L${(step * (i - 0.5)).toFixed(1)},${h} L${(step * (i - 1)).toFixed(1)},${h - TOOTH * 0.5}`;
  return `${d} Z`;
}

export function PhotoTicket({ record: r, width }: { record: PhotoTicketRecord; width: number }) {
  const L = layoutPhotoTicket(r);
  const { photoH, headBot, artist, artistTop, bigTop, photoTop, photoBot, infoTop, memo, infoBot, height } = computeLayout(r);
  const shape = toothPath(height);
  const id = `photo-${r.id}`;
  const flavor = ticketKindOf(r);
  // 띠 글자가 길면(EXHIBITION) 조금 줄여서 CONCERT 와 비슷한 폭으로 앉힌다
  const band = flavor.band.length > 8 ? { size: 28, gap: 7 } : { size: 34, gap: 10 };
  const rnd = seededRandom(r.id);
  const serial = String(Math.floor(rnd() * 999999999999)).padStart(12, '0');
  const title = fitLine(r.title.trim() || flavor.title, PW - M * 2 - 20, 24, 16, 'sansBold');

  const info: [string, string][] = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['VENUE', r.place.trim() || flavor.place],
    [flavor.seatKey, [flavor.seatValue, flavor.price].filter(Boolean).join('   ')],
  ];

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />

        {/* 머리: 분홍 줄무늬 + TICKET */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={0} y={0} width={PW} height={headBot} fill={PINK} />
          {Array.from({ length: 30 }, (_, i) => (
            <Rect key={i} x={i * 20} y={0} width={9} height={110} fill="#fff" opacity={0.45} />
          ))}
          <Rect x={M} y={30} width={PW - M * 2} height={62} rx={4} fill="none" stroke={DARK} strokeWidth={3} />
          <Rect x={M} y={108} width={PW - M * 2} height={96} rx={4} fill="#fff" opacity={0.75} />
        </G>
        <T f="monoBold" x={PW / 2} y={72} fontSize={26} letterSpacing={8} textAnchor="middle" fill={DARK} children={`A ${String(Math.floor(rnd() * 9999)).padStart(4, '0')}`} />
        <T f="sansHeavy" x={PW / 2} y={178} fontSize={54} letterSpacing={6} textAnchor="middle" fill={DARK} children="TICKET" />

        {/* ADMIT ONE + 아티스트 */}
        <Line x1={M} y1={headBot + 14} x2={PW - M} y2={headBot + 14} stroke={DARK} strokeWidth={2} strokeDasharray="6 5" />
        <T f="monoBold" x={PW / 2} y={headBot + 44} fontSize={19} letterSpacing={5} textAnchor="middle" fill={DARK} children="♡ ADMIT ONE ♡" />
        {artist.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={PW / 2} y={artistTop + 30 + i * TITLE_LINE} fontSize={artist.size} textAnchor="middle" fill={DARK} children={line} />
        ))}
        <T f="sansBold" x={PW / 2} y={artistTop + (artist.lines.length - 1) * TITLE_LINE + 64} fontSize={title.size} textAnchor="middle" fill={PINK_DEEP} children={title.text} />

        {/* 검정 블록: CONCERT / STAGE / EXHIBITION */}
        <Rect x={0} y={bigTop - 14} width={PW} height={64} fill={DARK} />
        <T f="sansHeavy" x={PW / 2} y={bigTop + 30} fontSize={band.size} letterSpacing={band.gap} textAnchor="middle" fill="#fff" children={flavor.band} />

        {/* 사진 */}
        {r.photo ? (
          <Image href={{ uri: r.photo.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
        ) : (
          <G>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} fill={PINK} opacity={0.5} />
            {[0, 1, 2].map((i) => (
              <G key={i}>
                <Rect x={M + 40 + i * 140} y={photoTop + photoH / 2 - 60} width={100} height={120} rx={6} fill="#fff" opacity={0.75} />
                <Path d={`M${M + 60 + i * 140},${photoTop + photoH / 2 + 30} q30,-70 60,0 Z`} fill={PINK_DEEP} opacity={0.6} />
                <Rect x={M + 74 + i * 140} y={photoTop + photoH / 2 - 44} width={32} height={32} rx={16} fill={PINK_DEEP} opacity={0.6} />
              </G>
            ))}
            <T f="monoBold" x={PW / 2} y={photoTop + photoH - 24} fontSize={15} letterSpacing={4} textAnchor="middle" fill={DARK} opacity={0.5} children="PHOTO" />
          </G>
        )}
        <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} fill="none" stroke={DARK} strokeWidth={3} />

        {/* 정보 */}
        {info.map(([k, v], i) => {
          const y = infoTop + 26 + i * 56;
          const value = fitLine(v, PW - M * 2 - 120, 21, 14, 'sansBold');
          return (
            <G key={k}>
              <T f="monoBold" x={M} y={y} fontSize={13} letterSpacing={2} fill={PINK_DEEP} children={k} />
              <T f="sansBold" x={PW - M} y={y + 1} fontSize={value.size} textAnchor="end" fill={DARK} children={value.text} />
              <Line x1={M} y1={y + 18} x2={PW - M} y2={y + 18} stroke={PINK} strokeWidth={1.6} />
            </G>
          );
        })}
        <T f="sansBold" x={M} y={infoTop + 200} fontSize={22} fill={PINK_DEEP} children={'★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)} />
        {memo &&
          memo.lines.map((line, i) => (
            <T key={i} x={PW - M} y={infoTop + 236 + i * 32} fontSize={memo.size} textAnchor="end" fill={DARK} opacity={0.75} children={line} />
          ))}

        {/* 바코드 */}
        <Rect x={0} y={infoBot} width={PW} height={height - infoBot} fill={DARK} />
        <Rect x={M} y={infoBot + 24} width={PW - M * 2} height={64} rx={3} fill="#fff" />
        <Barcode seed={`${r.id}-photo`} x={M + 10} y={infoBot + 30} width={PW - M * 2 - 20} height={52} color={DARK} />
        <T f="mono" x={PW / 2} y={infoBot + 116} fontSize={16} letterSpacing={4} textAnchor="middle" fill="#fff" children={serial} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
