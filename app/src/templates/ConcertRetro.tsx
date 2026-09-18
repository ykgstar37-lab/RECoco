// 콘서트 티켓 (레트로): 가로로 긴 크림 티켓 — 이중 테두리·소리파형·정보 3칸 + 남색 스텁(번호·바코드)
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom, won } from '../lib/format';
import { fitLine } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { ConcertRecord } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 980;
const PH = 392;
const PAD = 18;
const STUB_W = 292;
const MAIN_W = PW - STUB_W;
const PAPER = '#fbf5ea';
const NAVY = '#1f2a44';
const CORAL = '#e2685c';
const LINE = '#ded5c4';
const NOTCH = 15;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={NAVY} fontFamily={FONTS[f]} {...p} />;

export function layoutConcertRetro(_r: ConcertRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 1, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 스텁 경계가 반원으로 파인 가로 티켓 */
function ticketPath() {
  const x = MAIN_W;
  const R = 14;
  return [
    `M${R},0 H${x - NOTCH} A${NOTCH},${NOTCH} 0 0 1 ${x + NOTCH},0 H${PW - R} Q${PW},0 ${PW},${R}`,
    `V${PH - R} Q${PW},${PH} ${PW - R},${PH} H${x + NOTCH} A${NOTCH},${NOTCH} 0 0 1 ${x - NOTCH},${PH} H${R}`,
    `Q0,${PH} 0,${PH - R} V${R} Q0,0 ${R},0 Z`,
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
        <Path
          d={`M${x + 8},${y + 18} C${x + 8},${y + 12} ${x + 15},${y + 10} ${x + 15},${y + 6} A7,7 0 1 0 ${x + 1},${y + 6} C${x + 1},${y + 10} ${x + 8},${y + 12} ${x + 8},${y + 18} Z`}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <Circle cx={x + 8} cy={y + 6} r={2.4} fill={color} />
      </G>
    );
  return (
    <Path
      d={`M${x},${y + 3} H${x + 16} V${y + 8} A2.6,2.6 0 0 0 ${x + 16},${y + 13} V${y + 17} H${x} V${y + 13} A2.6,2.6 0 0 0 ${x},${y + 8} Z`}
      fill="none"
      stroke={color}
      strokeWidth={2}
    />
  );
}

export function ConcertRetro({ record: r, width }: { record: ConcertRecord; width: number }) {
  const L = layoutConcertRetro(r);
  const shape = ticketPath();
  const id = `retro-${r.id}`;
  const rnd = seededRandom(r.id);
  const serial = String(Math.floor(rnd() * 999999)).padStart(6, '0');

  const title = fitLine(r.title.trim() && r.artist.trim() ? r.artist.trim() : r.artist.trim() || r.title.trim() || '공연', MAIN_W - 140, 60, 34, 'sansHeavy');
  const sub = fitLine(r.artist.trim() && r.title.trim() ? r.title.trim() : '', MAIN_W - 200, 42, 26, 'hand');
  const memo = fitLine(r.memo.trim(), MAIN_W - 260, 26, 18, 'hand');

  const info: [string, string, 'date' | 'pin' | 'seat'][] = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `\n${r.time}` : ''}`, 'date'],
    ['VENUE', r.place.trim() || '공연장', 'pin'],
    ['ADMISSION', [r.seat.trim() || `${r.people}명`, r.price > 0 ? `₩ ${won(r.price)}` : ''].filter(Boolean).join('\n'), 'seat'],
  ];
  const colW = (MAIN_W - 96) / 3;
  const infoTop = 250;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-photo`}>
            <Rect x={0} y={0} width={MAIN_W} height={PH} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />

        {/* 사진은 왼쪽에 아주 연하게 (있을 때만) */}
        {r.photo && (
          <G clipPath={`url(#${id}-photo)`}>
            <Image href={{ uri: r.photo.uri }} x={0} y={0} width={MAIN_W} height={PH} preserveAspectRatio="xMidYMid slice" opacity={0.18} />
          </G>
        )}

        {/* 이중 테두리 + 모서리 별 */}
        <Rect x={22} y={22} width={MAIN_W - 48} height={PH - 44} rx={10} fill="none" stroke={NAVY} strokeWidth={2} opacity={0.75} />
        <Rect x={30} y={30} width={MAIN_W - 64} height={PH - 60} rx={6} fill="none" stroke={NAVY} strokeWidth={0.9} opacity={0.45} />
        {[
          [48, 48],
          [MAIN_W - 50, 48],
          [48, PH - 48],
          [MAIN_W - 50, PH - 48],
        ].map(([x, y]) => (
          <Path
            key={`${x}-${y}`}
            d={`M${x},${y - 9} Q${x + 1.6},${y - 1.6} ${x + 9},${y} Q${x + 1.6},${y + 1.6} ${x},${y + 9} Q${x - 1.6},${y + 1.6} ${x - 9},${y} Q${x - 1.6},${y - 1.6} ${x},${y - 9} Z`}
            fill={NAVY}
            opacity={0.35}
          />
        ))}

        {/* LIVE YOUR MOMENT */}
        <Line x1={MAIN_W / 2 - 150} y1={72} x2={MAIN_W / 2 - 96} y2={72} stroke={NAVY} strokeWidth={1.2} />
        <Line x1={MAIN_W / 2 + 96} y1={72} x2={MAIN_W / 2 + 150} y2={72} stroke={NAVY} strokeWidth={1.2} />
        <T f="monoBold" x={MAIN_W / 2} y={78} fontSize={15} letterSpacing={5} textAnchor="middle" children="LIVE YOUR MOMENT" />

        {/* 소리 파형 */}
        {[14, 26, 40, 50, 40, 26, 14].map((h, i) => (
          <Rect key={i} x={MAIN_W / 2 - 45 + i * 14} y={110 - h / 2} width={6} height={h} rx={3} fill={CORAL} />
        ))}

        {/* 제목 · 아티스트 */}
        <T f="sansHeavy" x={MAIN_W / 2} y={180} fontSize={title.size} textAnchor="middle" children={title.text} />
        {!!sub.text && <T f="hand" x={MAIN_W / 2} y={224} fontSize={sub.size} textAnchor="middle" fill={CORAL} children={sub.text} />}

        {/* 정보 3칸 */}
        <Line x1={48} y1={infoTop} x2={MAIN_W - 48} y2={infoTop} stroke={LINE} strokeWidth={1.6} />
        {info.map(([k, v, icon], i) => {
          const x = 48 + colW * i;
          return (
            <G key={k}>
              {i > 0 && <Line x1={x} y1={infoTop + 12} x2={x} y2={infoTop + 92} stroke={LINE} strokeWidth={1.4} />}
              <MiniIcon kind={icon} x={x + 14} y={infoTop + 20} color={CORAL} />
              <T f="monoBold" x={x + 38} y={infoTop + 34} fontSize={13} letterSpacing={2} fill={CORAL} children={k} />
              {v.split('\n').map((line, j) => {
                const f = fitLine(line, colW - 28, 20, 13, 'sansBold');
                return <T key={j} f="sansBold" x={x + 14} y={infoTop + 64 + j * 26} fontSize={f.size} children={f.text} />;
              })}
            </G>
          );
        })}
        <Line x1={48} y1={infoTop + 104} x2={MAIN_W - 48} y2={infoTop + 104} stroke={LINE} strokeWidth={1.6} />

        {/* 별점 · 한 줄 감상 */}
        {[0, 1, 2, 3, 4].map((s) => (
          <Path
            key={s}
            d={starPath(74 + s * 32, infoTop + 132, 12)}
            fill={s < r.stars ? CORAL : 'none'}
            stroke={CORAL}
            strokeOpacity={s < r.stars ? 1 : 0.35}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {!!memo.text && <T f="hand" x={MAIN_W - 60} y={infoTop + 140} fontSize={memo.size} textAnchor="end" children={memo.text} />}

        {/* 스텁 (남색) */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={MAIN_W} y={0} width={STUB_W} height={PH} fill={NAVY} />
        </G>
        <Line x1={MAIN_W} y1={NOTCH + 6} x2={MAIN_W} y2={PH - NOTCH - 6} stroke={PAPER} strokeWidth={3} strokeDasharray="9 8" />
        <T f="monoBold" x={MAIN_W + STUB_W / 2} y={56} fontSize={16} letterSpacing={7} textAnchor="middle" fill="#fff" children="TICKET" />
        <Rect x={MAIN_W + 36} y={76} width={STUB_W - 72} height={46} rx={23} fill={CORAL} />
        <T f="monoBold" x={MAIN_W + STUB_W / 2} y={106} fontSize={20} letterSpacing={2} textAnchor="middle" fill="#fff" children={`No. ${serial}`} />
        {[
          ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
          ['VENUE', r.place.trim() || '공연장'],
          ['ADMISSION', r.seat.trim() || `${r.people}명`],
        ].map(([k, v], i) => {
          const y = 158 + i * 56;
          const value = fitLine(v, STUB_W - 60, 18, 12, 'sansBold');
          return (
            <G key={k}>
              <T f="mono" x={MAIN_W + 30} y={y} fontSize={12} letterSpacing={2} fill="#fff" opacity={0.6} children={k} />
              <T f="sansBold" x={MAIN_W + 30} y={y + 24} fontSize={value.size} fill="#fff" children={value.text} />
            </G>
          );
        })}
        <Rect x={MAIN_W + 30} y={326} width={STUB_W - 60} height={40} rx={4} fill="#fff" />
        <Barcode seed={`${r.id}-retro`} x={MAIN_W + 38} y={331} width={STUB_W - 76} height={30} color={NAVY} />

        <PaperOverlay id={id} d={shape} width={PW} height={PH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
