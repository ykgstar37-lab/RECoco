// 영수증 테마 "흰 무지 티켓": 흰 종이에 먹색 글씨만 있는 담백한 입장권 (가운데 뜯는 선 + 아래 반쪽)
// 콘서트와 공연·전시가 같이 쓰는 기본 모양 (낱말과 금액 줄만 카테고리에 맞춰 바뀐다)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';
import { TicketRecord, ticketKindOf } from './ticketKind';

/** 이 티켓을 쓸 수 있는 기록 (콘서트 · 공연전시) */
export type PlainTicketRecord = TicketRecord;

const PW = 560;
const PAD = 16;
const M = 44; // 좌우 여백
const PAPER = '#ffffff';
const INK = '#2a2a2e';
const SUB = '#9a9aa2';
const LINE = '#e4e4e8';
const NOTCH = 15;

const TITLE_LINE = 50;
const INFO_ROW = 62;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: PlainTicketRecord) {
  const k = ticketKindOf(r);
  const title = fitLines(r.title.trim() || k.title, PW - M * 2, 44, 28, 2, 'sansHeavy');
  const artist = r.artist.trim() ? fitLine(r.artist.trim(), PW - M * 2, 22, 16, 'sansBold') : null;
  // 아티스트 줄이 없으면 그만큼 위로 당긴다
  const titleBot = (artist ? 162 : 124) + title.lines.length * TITLE_LINE;
  const photoH = r.photo ? Math.round(Math.min(360, Math.max(240, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const photoTop = titleBot + 22;
  const infoTop = photoTop + (photoH ? photoH + 40 : 26);
  const rows: [string, string][] = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['VENUE', r.place.trim() || k.place],
    [k.seatKey, [k.seatValue, k.price].filter(Boolean).join('   ')],
  ];
  const infoBot = infoTop + rows.length * INFO_ROW;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2, 28, 22, 3, 'hand') : null;
  const memoBot = infoBot + 58 + (memo ? 16 + memo.lines.length * 38 : 0);
  const cut = memoBot + 24; // 뜯는 선
  const height = cut + 172;
  return { k, title, artist, titleBot, photoH, photoTop, infoTop, rows, infoBot, memo, memoBot, cut, height };
}

export function layoutPlainTicket(r: PlainTicketRecord): TemplateLayout {
  const { height, cut } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: cut + PAD, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 뜯는 선 자리만 옆구리가 둥글게 파인 종이 */
function ticketPath(h: number, cut: number, connected: boolean) {
  if (connected) return `M0,0 H${PW} V${h} H0 Z`;
  const R = 14;
  return (
    `M${R},0 H${PW - R} Q${PW},0 ${PW},${R}` +
    ` V${cut - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${PW},${cut + NOTCH}` +
    ` V${h - R} Q${PW},${h} ${PW - R},${h} H${R} Q0,${h} 0,${h - R}` +
    ` V${cut + NOTCH} A${NOTCH},${NOTCH} 0 0 0 0,${cut - NOTCH}` +
    ` V${R} Q0,0 ${R},0 Z`
  );
}

export function PlainTicket({ record: r, width, connected = false }: { record: PlainTicketRecord; width: number; connected?: boolean }) {
  const L = layoutPlainTicket(r);
  const { k, title, artist, titleBot, photoH, photoTop, infoTop, rows, infoBot, memo, memoBot, cut, height } = computeLayout(r);
  const shape = ticketPath(height, cut, connected);
  const id = `plain-${r.id}`;
  const rnd = seededRandom(`${r.id}-plain`);
  const serial = String(1 + Math.floor(rnd() * 999999)).padStart(6, '0');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={2} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />
        {!connected && <Path d={shape} fill="none" stroke={LINE} strokeWidth={2} />}

        {/* 머리: 낱말 띠 + 브랜드 */}
        <T f="monoBold" x={M} y={62} fontSize={13} letterSpacing={5} fill={SUB} children={k.band} />
        <T f="monoBold" x={PW - M} y={62} fontSize={13} letterSpacing={3} fill={SUB} textAnchor="end" children="ADMIT ONE" />
        <Line x1={M} y1={86} x2={PW - M} y2={86} stroke={INK} strokeWidth={2.5} />

        {/* 제목 + 아티스트 */}
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={M} y={148 + i * TITLE_LINE} fontSize={title.size} children={line} />
        ))}
        {artist && <T f="sansBold" x={M} y={titleBot - 4} fontSize={artist.size} fill={SUB} children={artist.text} />}

        {/* 사진 (있을 때만, 테두리만 두른 담백한 칸) */}
        {!!photoH && (
          <G>
            <Image href={{ uri: r.photo!.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={2} fill="none" stroke={LINE} strokeWidth={2} />
          </G>
        )}

        {/* 정보: 라벨은 작게 위, 값은 아래 */}
        {rows.map(([key, value], i) => {
          const y = infoTop + i * INFO_ROW;
          const v = fitLine(value, PW - M * 2, 22, 15, 'sansBold');
          return (
            <G key={key}>
              <T f="mono" x={M} y={y + 18} fontSize={11} letterSpacing={2} fill={SUB} children={key} />
              <T f="sansBold" x={M} y={y + 44} fontSize={v.size} children={v.text} />
              <Line x1={M} y1={y + INFO_ROW - 6} x2={PW - M} y2={y + INFO_ROW - 6} stroke={LINE} strokeWidth={1.5} />
            </G>
          );
        })}

        {/* 별점 */}
        <T f="mono" x={M} y={infoBot + 22} fontSize={11} letterSpacing={2} fill={SUB} children="RATING" />
        {[0, 1, 2, 3, 4].map((s) => (
          <T key={s} f="sans" x={M + 4 + s * 26} y={infoBot + 50} fontSize={21} fill={s < r.stars ? INK : LINE} children="★" />
        ))}

        {/* 한 줄 소감 */}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={infoBot + 88 + i * 38} fontSize={memo.size} fill={INK} children={line} />
        ))}

        {/* 뜯는 선 + 아래 반쪽 */}
        <Line x1={NOTCH + 4} y1={cut} x2={PW - NOTCH - 4} y2={cut} stroke={LINE} strokeWidth={2} strokeDasharray="7 7" strokeLinecap="round" />
        <T f="mono" x={M} y={cut + 46} fontSize={11} letterSpacing={2} fill={SUB} children="NO." />
        <T f="monoBold" x={M} y={cut + 74} fontSize={22} letterSpacing={3} children={serial} />
        <T f="mono" x={PW - M} y={cut + 46} fontSize={11} letterSpacing={2} fill={SUB} textAnchor="end" children="DATE" />
        <T f="sansBold" x={PW - M} y={cut + 74} fontSize={18} textAnchor="end" children={r.date.replace(/-/g, '.')} />
        <Line x1={M} y1={cut + 104} x2={PW - M} y2={cut + 104} stroke={LINE} strokeWidth={1.5} />
        <T f="mono" x={PW / 2} y={cut + 134} fontSize={12} letterSpacing={4} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · ${k.chant}`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}

export { computeLayout as plainTicketLayout };
