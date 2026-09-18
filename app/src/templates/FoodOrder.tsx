// 카페·맛집: 가게 테이블에서 뜯어 온 주문서 (초록 인쇄 표 + 메뉴별 별점 + 포스트잇 후기 + 또 갈래요 체크)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom, won } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { FoodRecord, FoodType } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const M = 36; // 좌우 여백
const PAPER = '#fbf7ec';
const GREEN = '#2f6b52';
const GREEN_SOFT = '#cfe1d6';
// 단색(plain) 테마: 초록 대신 먹색 한 가지로
const PLAIN = { paper: '#fcfbf7', main: '#3b3a36', soft: '#dcdad2', star: '#3b3a36', note: '#f1efe7' };
const INK = '#26241f';
const SUB = '#8a8578';
const STAR = '#ff8a3d';
const NOTE = '#fff1a8';

export const FOOD_TYPES: Record<FoodType, string> = { cafe: '카페', meal: '식당', dessert: '디저트', bar: '술집' };
export const REVISIT: [FoodRecord['revisit'], string][] = [
  ['yes', '응!'],
  ['maybe', '글쎄요'],
  ['no', '아니요'],
];

const HEAD_BOT = 176;
const INFO_ROW = 58;
const MENU_HEAD = 48;
const MENU_ROW = 62;
const MIN_ROWS = 3;
const NOTE_LINE = 44;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: FoodRecord) {
  const info = [
    ['가게', r.place.trim() || '이름 모를 가게'],
    ['위치', r.area.trim()],
    ['날짜', dotDateWithDay(r.date)],
    ['함께', r.withWhom.trim()],
  ].filter(([k, v]) => v || k === '가게');
  const infoBot = HEAD_BOT + 18 + info.length * INFO_ROW;
  const photoTop = infoBot + 26;
  const photoH = r.photo ? Math.round(Math.min(420, Math.max(300, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const photoBot = r.photo ? photoTop + photoH : infoBot;
  const menuTop = photoBot + 34;
  const rows = Math.max(MIN_ROWS, r.menus.length);
  const menuBot = menuTop + MENU_HEAD + rows * MENU_ROW;
  const totalBot = r.total > 0 ? menuBot + 64 : menuBot;
  const note = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2 - 70, 36, 28, 4, 'hand') : null;
  const noteTop = totalBot + 34;
  const noteH = note ? 36 + note.lines.length * NOTE_LINE : 0;
  const revisitTop = note ? noteTop + noteH + 40 : totalBot + 30;
  const height = revisitTop + 150;
  return { info, infoBot, photoTop, photoH, photoBot, menuTop, rows, menuBot, totalBot, note, noteTop, noteH, revisitTop, height };
}

export function layoutFood(r: FoodRecord): TemplateLayout {
  const { height, photoBot } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: photoBot + 20 + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 주문서 묶음에서 뜯어낸 위쪽 가장자리 (살짝 들쭉날쭉) + 둥근 아래 모서리 */
function paperPath(h: number, seed: string) {
  const rnd = seededRandom(seed);
  let d = 'M0,6';
  for (let x = 12; x < PW; x += 12) d += ` L${x},${(3 + rnd() * 5).toFixed(1)}`;
  return `${d} L${PW},6 V${h - 18} Q${PW},${h} ${PW - 18},${h} H18 Q0,${h} 0,${h - 18} Z`;
}

/** 가운데 (cx, cy), 바깥 반지름 r 인 별 */
function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

export function FoodOrder({ record: r, width }: { record: FoodRecord; width: number }) {
  const plain = r.design === 'plain';
  const PAPER_C = plain ? PLAIN.paper : PAPER;
  const GREEN_C = plain ? PLAIN.main : GREEN;
  const SOFT_C = plain ? PLAIN.soft : GREEN_SOFT;
  const STAR_C = plain ? PLAIN.star : STAR;
  const NOTE_C = plain ? PLAIN.note : NOTE;
  const L = layoutFood(r);
  const { info, infoBot, photoTop, photoH, menuTop, rows, menuBot, note, noteTop, noteH, revisitTop, height } = computeLayout(r);
  const shape = paperPath(height, r.id);
  const clipId = `food-${r.id}`;
  const rnd = seededRandom(`${r.id}-no`);
  const orderNo = String(1 + Math.floor(rnd() * 9998)).padStart(4, '0');
  const tilt = (rnd() - 0.5) * 3;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${clipId}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={12} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER_C} />

        {/* 머리: 가게 종류 칩 + 제목 + 주문번호 */}
        <Rect x={M} y={34} width={86} height={34} rx={17} fill="none" stroke={GREEN_C} strokeWidth={2} />
        <T f="sansBold" x={M + 43} y={57} fontSize={17} fill={GREEN_C} textAnchor="middle" children={FOOD_TYPES[r.type] ?? '카페'} />
        <T f="mono" x={PW - M} y={57} fontSize={17} fill={GREEN_C} textAnchor="end" letterSpacing={1} children={`No. ${orderNo}`} />
        <T f="sansHeavy" x={PW / 2} y={124} fontSize={44} fill={GREEN_C} textAnchor="middle" children={`${BRAND.ko} 맛집 주문서`} />
        <T f="monoBold" x={PW / 2} y={154} fontSize={14} fill={GREEN_C} textAnchor="middle" letterSpacing={5} opacity={0.75} children="TABLE ORDER · TASTE NOTE" />
        <Line x1={M} y1={HEAD_BOT} x2={PW - M} y2={HEAD_BOT} stroke={GREEN_C} strokeWidth={3} />
        <Line x1={M} y1={HEAD_BOT + 6} x2={PW - M} y2={HEAD_BOT + 6} stroke={GREEN_C} strokeWidth={1.2} />

        {/* 가게 정보 */}
        {info.map(([k, v], i) => {
          const y = HEAD_BOT + 18 + i * INFO_ROW;
          const big = k === '가게';
          const value = fitLine(v, PW - M * 2 - 96, big ? 32 : 24, 18, big ? 'sansHeavy' : 'sansBold');
          return (
            <G key={k}>
              <T f="sansBold" x={M + 2} y={y + 38} fontSize={18} fill={GREEN_C} children={k} />
              <T f={big ? 'sansHeavy' : 'sansBold'} x={M + 90} y={y + 39} fontSize={value.size} children={value.text} />
              <Line x1={M + 80} y1={y + INFO_ROW - 4} x2={PW - M} y2={y + INFO_ROW - 4} stroke={SOFT_C} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
            </G>
          );
        })}

        {/* 사진 + 마스킹 테이프 */}
        {r.photo && (
          <G>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={12} fill={SOFT_C} />
            <Image href={{ uri: r.photo.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId}-photo)`} />
            <Rect x={PW / 2 - 60} y={photoTop - 16} width={120} height={34} fill="#f4dba8" opacity={0.85} transform={`rotate(${tilt - 2} ${PW / 2} ${photoTop})`} />
          </G>
        )}

        {/* 메뉴 표 */}
        <Rect x={M} y={menuTop} width={PW - M * 2} height={menuBot - menuTop} rx={10} fill="none" stroke={GREEN_C} strokeWidth={2} />
        <Path d={`M${M},${menuTop + MENU_HEAD} V${menuTop + 10} Q${M},${menuTop} ${M + 10},${menuTop} H${PW - M - 10} Q${PW - M},${menuTop} ${PW - M},${menuTop + 10} V${menuTop + MENU_HEAD} Z`} fill={GREEN_C} />
        <T f="sansBold" x={M + 20} y={menuTop + 32} fontSize={19} fill="#fff" children="메뉴" />
        <T f="sansBold" x={PW - M - 20} y={menuTop + 32} fontSize={19} fill="#fff" textAnchor="end" children="맛" />
        <Line x1={PW - M - 190} y1={menuTop + MENU_HEAD} x2={PW - M - 190} y2={menuBot} stroke={SOFT_C} strokeWidth={2} />
        {Array.from({ length: rows }, (_, i) => {
          const y = menuTop + MENU_HEAD + i * MENU_ROW;
          const m = r.menus[i];
          const name = m ? fitLine(m.name.trim(), PW - M * 2 - 230, 25, 17, 'sans') : null;
          return (
            <G key={i}>
              {i > 0 && <Line x1={M + 12} y1={y} x2={PW - M - 12} y2={y} stroke={SOFT_C} strokeWidth={1.5} strokeDasharray="6 5" />}
              {name && <T x={M + 20} y={y + 40} fontSize={name.size} children={name.text} />}
              {m &&
                [0, 1, 2, 3, 4].map((s) => (
                  <Path
                    key={s}
                    d={starPath(PW - M - 170 + s * 34, y + 31, 14)}
                    fill={s < m.stars ? STAR_C : 'none'}
                    stroke={s < m.stars ? STAR_C : SOFT_C}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                ))}
            </G>
          );
        })}
        {r.total > 0 && (
          <G>
            <T f="sansBold" x={M + 20} y={menuBot + 44} fontSize={20} fill={GREEN_C} children="합계" />
            <T f="sansHeavy" x={PW - M - 16} y={menuBot + 46} fontSize={30} textAnchor="end" children={`${won(r.total)}원`} />
          </G>
        )}

        {/* 한 줄 후기: 포스트잇 */}
        {note && (
          <G transform={`rotate(${tilt} ${PW / 2} ${noteTop + noteH / 2})`}>
            <Rect x={M + 24} y={noteTop + 4} width={PW - M * 2 - 48} height={noteH} fill="#000" opacity={0.06} />
            <Rect x={M + 20} y={noteTop} width={PW - M * 2 - 48} height={noteH} fill={NOTE_C} />
            {note.lines.map((line, i) => (
              <T key={i} f="hand" x={M + 50} y={noteTop + 48 + i * NOTE_LINE} fontSize={note.size} fill="#3a3326" children={line} />
            ))}
          </G>
        )}

        {/* 또 갈래요? */}
        <Line x1={M} y1={revisitTop} x2={PW - M} y2={revisitTop} stroke={GREEN_C} strokeWidth={1.2} />
        <T f="sansBold" x={M + 2} y={revisitTop + 46} fontSize={20} fill={GREEN_C} children="또 갈래요?" />
        {REVISIT.map(([key, label], i) => {
          const x = M + 2 + i * 180;
          const on = r.revisit === key;
          return (
            <G key={key}>
              <Rect x={x} y={revisitTop + 70} width={28} height={28} rx={6} fill="#fff" stroke={GREEN_C} strokeWidth={2} />
              {on && <Path d={`M${x + 4},${revisitTop + 82} L${x + 13},${revisitTop + 94} L${x + 34},${revisitTop + 62}`} stroke={STAR_C} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
              <T f={on ? 'sansHeavy' : 'sans'} x={x + 40} y={revisitTop + 92} fontSize={21} fill={on ? INK : SUB} children={label} />
            </G>
          );
        })}

        <PaperOverlay id={clipId} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
