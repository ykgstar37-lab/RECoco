// 영수증 테마 "흰 무지 티켓": 흰 종이에 먹색 글씨만 있는 담백한 입장권
// 콘서트는 가로로 긴 티켓(오른쪽 조각), 공연·전시는 세로 티켓(아래 조각). 둘 다 바코드가 들어간다.
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';
import { TicketRecord, ticketKindOf } from './ticketKind';

/** 이 티켓을 쓸 수 있는 기록 (콘서트 · 공연전시) */
export type PlainTicketRecord = TicketRecord;

const PAD = 16;
const PAPER = '#ffffff';
const INK = '#2a2a2e';
const SUB = '#9a9aa2';
const LINE = '#e4e4e8';

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

const serialOf = (r: PlainTicketRecord) => String(1 + Math.floor(seededRandom(`${r.id}-plain`)() * 999999)).padStart(6, '0');

// ── 세로 (공연·전시) ──
const PW = 560;
const M = 44;
const NOTCH = 15;
const TITLE_LINE = 50;
const INFO_ROW = 62;

function tallLayout(r: PlainTicketRecord) {
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
  const height = cut + 236;
  return { k, title, artist, titleBot, photoH, photoTop, infoTop, rows, infoBot, memo, cut, height };
}

/** 뜯는 선 자리만 옆구리가 둥글게 파인 세로 종이 */
function tallPath(h: number, cut: number, connected: boolean) {
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

function TallTicket({ record: r, width, connected }: { record: PlainTicketRecord; width: number; connected: boolean }) {
  const L = layoutPlainTicket(r);
  const { k, title, artist, titleBot, photoH, photoTop, infoTop, rows, infoBot, memo, cut, height } = tallLayout(r);
  const shape = tallPath(height, cut, connected);
  const id = `plain-${r.id}`;
  const serial = serialOf(r);

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

        {/* 머리 */}
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

        {/* 뜯는 선 + 아래 조각 (번호 · 날짜 · 바코드) */}
        <Line x1={NOTCH + 4} y1={cut} x2={PW - NOTCH - 4} y2={cut} stroke={LINE} strokeWidth={2} strokeDasharray="7 7" strokeLinecap="round" />
        <T f="mono" x={M} y={cut + 42} fontSize={11} letterSpacing={2} fill={SUB} children="NO." />
        <T f="monoBold" x={M} y={cut + 70} fontSize={22} letterSpacing={3} children={serial} />
        <T f="mono" x={PW - M} y={cut + 42} fontSize={11} letterSpacing={2} fill={SUB} textAnchor="end" children="DATE" />
        <T f="sansBold" x={PW - M} y={cut + 70} fontSize={18} textAnchor="end" children={r.date.replace(/-/g, '.')} />
        <Barcode seed={`${r.id}-plain`} x={M} y={cut + 96} width={PW - M * 2} height={66} color={INK} />
        <T f="mono" x={PW / 2} y={cut + 204} fontSize={12} letterSpacing={4} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · ${k.chant}`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}

// ── 가로 (콘서트) ──
const WPW = 980;
const WPH = 400;
const WSTUB = 280; // 오른쪽 조각
const WMAIN = WPW - WSTUB;
const WM = 44;
const WNOTCH = 15;
const WCOL = 452; // 오른쪽 정보 칸이 시작하는 자리
const WTITLE_LINE = 48;

function wideLayout(r: PlainTicketRecord) {
  const k = ticketKindOf(r);
  const title = fitLines(r.title.trim() || k.title, WCOL - WM - 40, 40, 26, 2, 'sansHeavy');
  const artist = r.artist.trim() ? fitLine(r.artist.trim(), WCOL - WM - 40, 21, 15, 'sansBold') : null;
  const rows: [string, string][] = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['VENUE', r.place.trim() || k.place],
    [k.seatKey, k.seatValue],
    ...((k.price ? [['PRICE', k.price]] : []) as [string, string][]),
  ];
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), WCOL - WM - 40, 25, 19, 2, 'hand') : null;
  return { k, title, artist, rows, memo };
}

/** 조각 자리만 위아래가 반원으로 파인 가로 종이 */
function widePath(connected: boolean) {
  if (connected) return `M0,0 H${WPW} V${WPH} H0 Z`;
  const R = 14;
  return (
    `M${R},0 H${WMAIN - WNOTCH} A${WNOTCH},${WNOTCH} 0 0 0 ${WMAIN + WNOTCH},0 H${WPW - R} Q${WPW},0 ${WPW},${R}` +
    ` V${WPH - R} Q${WPW},${WPH} ${WPW - R},${WPH} H${WMAIN + WNOTCH} A${WNOTCH},${WNOTCH} 0 0 0 ${WMAIN - WNOTCH},${WPH} H${R}` +
    ` Q0,${WPH} 0,${WPH - R} V${R} Q0,0 ${R},0 Z`
  );
}

function WideTicket({ record: r, width, connected }: { record: PlainTicketRecord; width: number; connected: boolean }) {
  const L = layoutPlainTicket(r);
  const { k, title, artist, rows, memo } = wideLayout(r);
  const shape = widePath(connected);
  const id = `plainw-${r.id}`;
  const serial = serialOf(r);
  const titleBot = 122 + (title.lines.length - 1) * WTITLE_LINE;
  const stubMid = WMAIN + WSTUB / 2;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Path d={shape} fill={PAPER} />
        {!connected && <Path d={shape} fill="none" stroke={LINE} strokeWidth={2} />}

        {/* 왼쪽: 낱말 띠 + 제목 + 아티스트 */}
        <T f="monoBold" x={WM} y={56} fontSize={13} letterSpacing={5} fill={SUB} children={k.band} />
        <Line x1={WM} y1={78} x2={WCOL - 40} y2={78} stroke={INK} strokeWidth={2.5} />
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={WM} y={122 + i * WTITLE_LINE} fontSize={title.size} children={line} />
        ))}
        {artist && <T f="sansBold" x={WM} y={titleBot + 34} fontSize={artist.size} fill={SUB} children={artist.text} />}

        {/* 왼쪽 아래: 별점 + 손글씨 한 줄 */}
        <T f="mono" x={WM} y={WPH - 130} fontSize={11} letterSpacing={2} fill={SUB} children="RATING" />
        {[0, 1, 2, 3, 4].map((s) => (
          <T key={s} f="sans" x={WM + 4 + s * 26} y={WPH - 102} fontSize={21} fill={s < r.stars ? INK : LINE} children="★" />
        ))}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={WM} y={WPH - 62 + i * 30} fontSize={memo.size} children={line} />
        ))}

        {/* 오른쪽 칸: 날짜·장소·좌석 */}
        {rows.map(([key, value], i) => {
          const y = 56 + i * 76;
          const v = fitLine(value, WMAIN - WCOL - WM, 21, 14, 'sansBold');
          return (
            <G key={key}>
              <T f="mono" x={WCOL} y={y} fontSize={11} letterSpacing={2} fill={SUB} children={key} />
              <T f="sansBold" x={WCOL} y={y + 28} fontSize={v.size} children={v.text} />
              <Line x1={WCOL} y1={y + 46} x2={WMAIN - WM} y2={y + 46} stroke={LINE} strokeWidth={1.5} />
            </G>
          );
        })}

        {/* 뜯는 선 */}
        <Line x1={WMAIN} y1={WNOTCH + 4} x2={WMAIN} y2={WPH - WNOTCH - 4} stroke={LINE} strokeWidth={2} strokeDasharray="7 7" strokeLinecap="round" />

        {/* 오른쪽 조각: 날짜 + 바코드 + 번호 */}
        <T f="monoBold" x={stubMid} y={58} fontSize={12} letterSpacing={3} fill={SUB} textAnchor="middle" children="ADMIT ONE" />
        <T f="sansBold" x={stubMid} y={100} fontSize={20} textAnchor="middle" children={r.date.replace(/-/g, '.')} />
        {!!r.time && <T f="mono" x={stubMid} y={126} fontSize={15} letterSpacing={1} fill={SUB} textAnchor="middle" children={r.time} />}
        <Barcode seed={`${r.id}-plain`} x={WMAIN + 32} y={152} width={WSTUB - 64} height={110} color={INK} />
        <T f="monoBold" x={stubMid} y={294} fontSize={17} letterSpacing={3} textAnchor="middle" children={serial} />
        <T f="mono" x={stubMid} y={WPH - 46} fontSize={11} letterSpacing={4} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · ${k.chant}`} />

        <PaperOverlay id={id} d={shape} width={WPW} height={WPH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}

/** 콘서트는 가로, 공연·전시는 세로 */
export function layoutPlainTicket(r: PlainTicketRecord): TemplateLayout {
  if (r.kind === 'concert') return { width: WPW + PAD * 2, height: WPH + PAD * 2 + 14, foldAt: 0, displayRatio: 1, inset: { top: PAD, bottom: PAD + 14 } };
  const { height, cut } = tallLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: cut + PAD, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

export function PlainTicket({ record: r, width, connected = false }: { record: PlainTicketRecord; width: number; connected?: boolean }) {
  return r.kind === 'concert' ? <WideTicket record={r} width={width} connected={connected} /> : <TallTicket record={r} width={width} connected={connected} />;
}
