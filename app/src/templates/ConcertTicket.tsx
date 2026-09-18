// 콘서트 티켓 (기본): 가로로 긴 공연 티켓 — 어두운 보라 본권 + 마젠타 스텁(세로 글씨·바코드)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom, won } from '../lib/format';
import { fitLine } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { ConcertRecord } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 980;
const PH = 392;
const PAD = 18;
const STUB_W = 268; // 오른쪽 마젠타 조각
const MAIN_W = PW - STUB_W;
export const CONCERT_DARK = '#241a4a';
export const CONCERT_DEEP = '#170f33';
export const CONCERT_MAGENTA = '#c231d8';
export const CONCERT_CYAN = '#5bd1ff';
const NOTCH = 16;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fontFamily={FONTS[f]} {...p} />;

export function layoutConcert(_r: ConcertRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 1, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 가운데가 삼각으로 파인 가로 티켓 */
function ticketPath(connected: boolean) {
  const x = MAIN_W;
  const R = connected ? 0 : 14;
  return [
    `M${R},0 H${x - 26} L${x},${NOTCH} L${x + 26},0 H${PW - R} Q${PW},0 ${PW},${R}`,
    `V${PH - R} Q${PW},${PH} ${PW - R},${PH} H${x + 26} L${x},${PH - NOTCH} L${x - 26},${PH} H${R}`,
    `Q0,${PH} 0,${PH - R} V${R} Q0,0 ${R},0 Z`,
  ].join(' ');
}

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.42 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** 아래쪽 관객 실루엣 (머리·어깨·든 손) */
function Crowd({ seed }: { seed: string }) {
  const rnd = seededRandom(seed);
  const people = [];
  for (let x = -10; x < MAIN_W + 40; x += 52) {
    const top = PH - 96 - rnd() * 34;
    const r = 15 + rnd() * 4;
    people.push(
      <G key={x}>
        <Path d={`M${x - 26},${PH} V${top + r + 30} Q${x},${top + r + 6} ${x + 26},${top + r + 30} V${PH} Z`} />
        <Path d={`M${x - r},${top + r} a${r},${r} 0 1 1 ${r * 2},0 a${r},${r} 0 1 1 ${-r * 2},0`} />
        {rnd() > 0.45 && <Path d={`M${x - 30},${top + 52} l${-12},${-40} l10,-3 l14,38 Z`} />}
        {rnd() > 0.55 && <Path d={`M${x + 30},${top + 52} l12,-44 l10,4 l-14,42 Z`} />}
      </G>,
    );
  }
  return <G>{people}</G>;
}

export function ConcertTicket({ record: r, width, connected = false }: { record: ConcertRecord; width: number; connected?: boolean }) {
  const L = layoutConcert(r);
  const shape = ticketPath(connected);
  const id = `concert-${r.id}`;
  const rnd = seededRandom(r.id);
  const serial = String(Math.floor(rnd() * 999999999)).padStart(9, '0');

  const artist = fitLine(r.artist.trim() || r.title.trim() || 'LIVE', MAIN_W - 300, 62, 34, 'sansHeavy');
  const title = fitLine(r.title.trim() && r.artist.trim() ? r.title.trim() : '', MAIN_W - 300, 40, 24, 'sansBold');
  const place = fitLine(r.place.trim() || '공연장', MAIN_W - 320, 26, 18, 'sansBold');
  const when = `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`;
  const stubText = fitLine(r.artist.trim() || r.title.trim() || 'LIVE', PH - 150, 30, 18, 'sansHeavy');
  // 오른쪽 작은 칸: 게이트·열·좌석 대신 우리가 아는 값으로
  const boxes: [string, string][] = [
    ['SEAT', r.seat.trim() || `${r.people}명`],
    ['PRICE', r.price > 0 ? `₩${won(r.price)}` : `${r.people}명`],
  ];

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-main`}>
            <Rect x={0} y={0} width={MAIN_W} height={PH} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={CONCERT_DARK} />

        {/* 본권 배경: 사진(있으면) + 번개·별·관객 */}
        <G clipPath={`url(#${id}-main)`}>
          {r.photo && (
            <G>
              <Image href={{ uri: r.photo.uri }} x={0} y={0} width={MAIN_W} height={PH} preserveAspectRatio="xMidYMid slice" opacity={0.5} />
              <Rect x={0} y={0} width={MAIN_W} height={PH} fill={CONCERT_DEEP} opacity={0.55} />
            </G>
          )}
          {[
            [60, 70, 1.3],
            [MAIN_W - 120, 58, 1],
            [150, PH - 120, 0.8],
            [MAIN_W - 80, PH - 150, 1.1],
          ].map(([x, y, s], i) => (
            <Path key={i} d={`M${x},${y} l${22 * s},${-34 * s} l${-6 * s},${26 * s} l${20 * s},${-6 * s} l${-30 * s},${44 * s} l${8 * s},${-30 * s} Z`} fill={CONCERT_MAGENTA} opacity={0.35} />
          ))}
          {[
            [110, 120, 16, CONCERT_CYAN],
            [MAIN_W - 170, 96, 12, '#b48cff'],
            [MAIN_W - 230, 210, 9, CONCERT_CYAN],
            [64, 232, 11, '#b48cff'],
          ].map(([x, y, s, c], i) => (
            <Path key={i} d={starPath(x as number, y as number, s as number)} fill={c as string} opacity={0.75} />
          ))}
          <G fill={CONCERT_DEEP} opacity={r.photo ? 0.8 : 0.95}>
            <Crowd seed={r.id} />
          </G>
        </G>

        {/* 본권 글자 */}
        <T f="sansHeavy" x={MAIN_W / 2 - 60} y={150} fontSize={artist.size} textAnchor="middle" fill="#fff" children={artist.text} />
        {!!title.text && <T f="sansBold" x={MAIN_W / 2 - 60} y={206} fontSize={title.size} textAnchor="middle" fill={CONCERT_CYAN} children={title.text} />}
        <T f="sansBold" x={MAIN_W / 2 - 60} y={title.text ? 262 : 226} fontSize={place.size} textAnchor="middle" fill="#fff" letterSpacing={2} children={place.text} />
        <T f="mono" x={MAIN_W / 2 - 60} y={title.text ? 300 : 264} fontSize={24} textAnchor="middle" fill="#fff" opacity={0.85} children={when} />
        {r.stars > 0 && (
          <G>
            {[0, 1, 2, 3, 4].map((s) => (
              <Path key={s} d={starPath(MAIN_W / 2 - 60 - 76 + s * 38, title.text ? 336 : 300, 13)} fill={s < r.stars ? CONCERT_CYAN : 'none'} stroke={CONCERT_CYAN} strokeWidth={2} strokeLinejoin="round" opacity={s < r.stars ? 1 : 0.4} />
            ))}
          </G>
        )}

        {/* 좌석·금액 칸 (세로 라벨 + 마젠타 값) */}
        {boxes.map(([k, v], i) => {
          const y = 96 + i * 96;
          const value = fitLine(v, 150, 22, 14, 'sansBold');
          return (
            <G key={k}>
              <T f="monoBold" x={MAIN_W - 210} y={y + 46} fontSize={14} letterSpacing={2} fill="#fff" opacity={0.75} textAnchor="middle" transform={`rotate(-90 ${MAIN_W - 210} ${y + 46})`} children={k} />
              <Rect x={MAIN_W - 196} y={y + 16} width={160} height={46} rx={8} fill={CONCERT_MAGENTA} />
              <T f="sansBold" x={MAIN_W - 116} y={y + 47} fontSize={value.size} textAnchor="middle" fill="#fff" children={value.text} />
            </G>
          );
        })}
        {!!r.memo.trim() && (
          <T f="hand" x={MAIN_W - 116} y={PH - 44} fontSize={24} textAnchor="middle" fill="#fff" opacity={0.85} children={fitLine(r.memo.trim(), 220, 24, 16, 'hand').text} />
        )}

        {/* 스텁 */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={MAIN_W} y={0} width={STUB_W} height={PH} fill={CONCERT_MAGENTA} />
        </G>
        <Line x1={MAIN_W} y1={NOTCH + 6} x2={MAIN_W} y2={PH - NOTCH - 6} stroke="#fff" strokeWidth={3} strokeDasharray="10 9" opacity={0.7} />
        {[...stubText.text].slice(0, 9).map((ch, i, all) => (
          <T key={i} f="sansHeavy" x={MAIN_W + 44} y={PH / 2 - ((all.length - 1) * 34) / 2 + i * 34 + 11} fontSize={30} textAnchor="middle" fill="#fff" children={ch} />
        ))}
        <Rect x={MAIN_W + 78} y={40} width={150} height={44} rx={6} fill="#fff" />
        <T f="mono" x={MAIN_W + 153} y={69} fontSize={17} textAnchor="middle" fill={CONCERT_DEEP} letterSpacing={1} children={serial.slice(0, 6)} />
        <T f="monoBold" x={MAIN_W + 153} y={112} fontSize={12} letterSpacing={2} textAnchor="middle" fill="#fff" opacity={0.85} children="TICKET NUMBER" />
        <Rect x={MAIN_W + 84} y={132} width={140} height={190} rx={4} fill="#fff" />
        <Barcode seed={`${r.id}-stub`} x={MAIN_W + 94} y={144} width={120} height={166} color={CONCERT_DEEP} />
        <T f="mono" x={MAIN_W + 153} y={352} fontSize={15} textAnchor="middle" fill="#fff" children={dotDateWithDay(r.date).slice(2)} />

        <PaperOverlay id={id} d={shape} width={PW} height={PH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
