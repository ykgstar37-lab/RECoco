// 카페·맛집 (집 모양): 지붕 + 간판 + 줄무늬 차양 + 사진 창문 + 칠판 메뉴 + 문 팻말(또 갈래요) + 후기 쪽지
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { StickerArt } from '../components/Stickers';
import { dotDateWithDay, seededRandom, won } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { FoodRecord, FoodType } from '../types';
import { FOOD_TYPES } from './FoodOrder';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const BL = 40; // 벽 왼쪽
const BR = 560; // 벽 오른쪽
const RB = 230; // 지붕 아랫단
const WALL = '#fbf3e4';
const TRIM = '#6b4a3a';
const INK = '#2b2622';
const SUB = '#8b8074';
const BOARD = '#34493f';
const CHALK = '#f4f1e8';
const STAR = '#ffd166';
const NOTE = '#fff1a8';
const STONE = '#e3d3bc';

// 가게 종류마다 지붕·차양 색과 창문 속 그림
const ROOFS: Record<FoodType, { roof: string; deep: string; emoji: string }> = {
  cafe: { roof: '#d9774f', deep: '#b95c38', emoji: '☕' },
  meal: { roof: '#e0584a', deep: '#bd4034', emoji: '🍚' },
  dessert: { roof: '#f29bb5', deep: '#d9738f', emoji: '🍰' },
  bar: { roof: '#4f6fa8', deep: '#3a5687', emoji: '🍺' },
};

const DOOR_SIGN: Record<FoodRecord['revisit'], string> = { yes: '또 올래요!', maybe: '고민 중', no: '한 번이면 돼' };

const SIGN_TOP = RB + 26;
const SIGN_H = 92;
const AWN_TOP = SIGN_TOP + SIGN_H + 24;
const AWN_H = 50;
const WIN_X = 90;
const WIN_W = 420;
const WIN_TOP = AWN_TOP + AWN_H + 44;
const BOARD_X = 70;
const BOARD_W = 460;
const BOARD_HEAD = 72;
const MENU_ROW = 58;
const NOTE_LINE = 40;
const DOOR_W = 140;
const DOOR_H = 250;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: FoodRecord) {
  const winH = r.photo ? Math.round(Math.min(380, Math.max(260, (WIN_W * r.photo.height) / Math.max(1, r.photo.width)))) : 260;
  const winBot = WIN_TOP + winH;
  const boardTop = winBot + 70;
  const rows = Math.max(2, r.menus.length);
  const totalH = r.total > 0 ? 58 : 0;
  const boardBot = boardTop + BOARD_HEAD + rows * MENU_ROW + totalH + 20;
  const lowTop = boardBot + 44;
  const note = r.memo.trim() ? fitLines(r.memo.trim(), 230, 30, 24, 4, 'hand') : null;
  const noteH = note ? 34 + note.lines.length * NOTE_LINE : 0;
  const plaqueTop = note ? lowTop + noteH + 26 : lowTop + 110;
  const ground = Math.max(lowTop + DOOR_H + 10, plaqueTop + 78);
  const height = ground + 44;
  return { winH, winBot, boardTop, rows, totalH, boardBot, lowTop, note, noteH, ground, height };
}

export function layoutFoodHouse(r: FoodRecord): TemplateLayout {
  const { height, winBot } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: winBot + 40 + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

const roofPath = `M18,${RB} L300,22 L582,${RB} Z`;
const chimneyPath = 'M412,150 V78 H458 V150 Z M404,64 H466 V84 H404 Z';

/** 집 윤곽 (지붕 + 굴뚝 + 벽): 그림자·질감용 */
function housePath(h: number) {
  return `${roofPath} ${chimneyPath} M${BL},${RB - 1} H${BR} V${h - 8} Q${BR},${h} ${BR - 8},${h} H${BL + 8} Q${BL},${h} ${BL},${h - 8} Z`;
}

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

export function FoodHouse({ record: r, width }: { record: FoodRecord; width: number }) {
  const L = layoutFoodHouse(r);
  const { winH, winBot, boardTop, rows, totalH, boardBot, lowTop, note, noteH, ground, height } = computeLayout(r);
  const color = ROOFS[r.type] ?? ROOFS.cafe;
  const shape = housePath(height);
  const id = `house-${r.id}`;
  const tilt = (seededRandom(`${r.id}-tilt`)() - 0.5) * 4;

  const place = fitLine(r.place.trim() || '이름 모를 가게', 360, 40, 24, 'sansHeavy');
  const area = r.area.trim() ? fitLine(r.area.trim(), 360, 19, 15, 'sans') : null;
  const stripes = 8;
  const sw = (BR - BL) / stripes;
  const doorX = BR - 40 - DOOR_W;
  const doorTop = ground - DOOR_H;
  const sign = fitLine(DOOR_SIGN[r.revisit] ?? DOOR_SIGN.yes, 96, 20, 14, 'sansHeavy');
  const plaqueTop = ground - 78;
  const withWhom = r.withWhom.trim();

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${id}-roof`}>
            <Path d={roofPath} />
          </ClipPath>
          <ClipPath id={`${id}-win`}>
            <Rect x={WIN_X} y={WIN_TOP} width={WIN_W} height={winH} rx={6} />
          </ClipPath>
        </Defs>

        {/* 굴뚝 + 지붕 */}
        <Path d={chimneyPath} fill={color.deep} />
        <Path d={roofPath} fill={color.roof} stroke={color.roof} strokeWidth={16} strokeLinejoin="round" />
        <G clipPath={`url(#${id}-roof)`}>
          {[96, 144, 192].map((y) => (
            <Line key={y} x1={0} y1={y} x2={PW} y2={y} stroke={color.deep} strokeWidth={3} opacity={0.45} />
          ))}
        </G>
        <Circle cx={300} cy={150} r={40} fill={WALL} stroke={TRIM} strokeWidth={6} />
        <T f="sansHeavy" x={300} y={158} fontSize={22} fill={TRIM} textAnchor="middle" children={FOOD_TYPES[r.type] ?? '카페'} />

        {/* 벽 */}
        <Path d={`M${BL},${RB - 1} H${BR} V${height - 8} Q${BR},${height} ${BR - 8},${height} H${BL + 8} Q${BL},${height} ${BL},${height - 8} Z`} fill={WALL} />
        <Rect x={BL} y={ground + 8} width={BR - BL} height={height - ground - 8} fill={STONE} />

        {/* 간판 */}
        <Line x1={170} y1={RB} x2={170} y2={SIGN_TOP} stroke={TRIM} strokeWidth={4} />
        <Line x1={430} y1={RB} x2={430} y2={SIGN_TOP} stroke={TRIM} strokeWidth={4} />
        <Rect x={100} y={SIGN_TOP} width={400} height={SIGN_H} rx={14} fill="#fff" stroke={TRIM} strokeWidth={5} />
        <T f="sansHeavy" x={300} y={SIGN_TOP + (area ? 50 : 60)} fontSize={place.size} textAnchor="middle" children={place.text} />
        {area && <T x={300} y={SIGN_TOP + 78} fontSize={area.size} fill={SUB} textAnchor="middle" children={area.text} />}

        {/* 줄무늬 차양 */}
        {Array.from({ length: stripes }, (_, i) => {
          const x = BL + i * sw;
          return <Path key={i} d={`M${x},${AWN_TOP} V${AWN_TOP + AWN_H} Q${x + sw / 2},${AWN_TOP + AWN_H + 28} ${x + sw},${AWN_TOP + AWN_H} V${AWN_TOP} Z`} fill={i % 2 ? '#fff' : color.roof} />;
        })}
        <Rect x={BL - 6} y={AWN_TOP - 8} width={BR - BL + 12} height={12} rx={6} fill={color.deep} />

        {/* 창문 (사진) */}
        <Rect x={WIN_X - 14} y={WIN_TOP - 14} width={WIN_W + 28} height={winH + 28} rx={12} fill={TRIM} />
        {r.photo ? (
          <Image href={{ uri: r.photo.uri }} x={WIN_X} y={WIN_TOP} width={WIN_W} height={winH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-win)`} />
        ) : (
          <G>
            <Rect x={WIN_X} y={WIN_TOP} width={WIN_W} height={winH} rx={6} fill="#dcecf2" />
            <Path d={`M${WIN_X},${WIN_TOP} H${WIN_X + 90} Q${WIN_X + 50},${WIN_TOP + winH * 0.45} ${WIN_X + 30},${WIN_TOP + winH} H${WIN_X} Z`} fill="#fff" opacity={0.85} />
            <Path d={`M${WIN_X + WIN_W},${WIN_TOP} H${WIN_X + WIN_W - 90} Q${WIN_X + WIN_W - 50},${WIN_TOP + winH * 0.45} ${WIN_X + WIN_W - 30},${WIN_TOP + winH} H${WIN_X + WIN_W} Z`} fill="#fff" opacity={0.85} />
            <StickerArt emoji={color.emoji} x={300} y={WIN_TOP + winH / 2 + 6} size={130} rotate={-4} />
          </G>
        )}
        <Rect x={WIN_X - 30} y={winBot + 12} width={WIN_W + 60} height={20} rx={5} fill={TRIM} />

        {/* 칠판 메뉴 */}
        <Rect x={BOARD_X} y={boardTop} width={BOARD_W} height={boardBot - boardTop} rx={10} fill={BOARD} stroke="#a47a55" strokeWidth={10} />
        <T f="hand" x={300} y={boardTop + 52} fontSize={40} fill={CHALK} textAnchor="middle" children="오늘 먹은 메뉴" />
        <Line x1={BOARD_X + 40} y1={boardTop + BOARD_HEAD} x2={BOARD_X + BOARD_W - 40} y2={boardTop + BOARD_HEAD} stroke={CHALK} strokeWidth={2} opacity={0.5} />
        {Array.from({ length: rows }, (_, i) => {
          const y = boardTop + BOARD_HEAD + i * MENU_ROW;
          const m = r.menus[i];
          const name = m ? fitLine(m.name.trim(), 230, 34, 24, 'hand') : null;
          return (
            <G key={i}>
              {name && <T f="hand" x={BOARD_X + 34} y={y + 42} fontSize={name.size} fill={CHALK} children={name.text} />}
              {m &&
                [0, 1, 2, 3, 4].map((s) => (
                  <Path
                    key={s}
                    d={starPath(BOARD_X + BOARD_W - 150 + s * 28, y + 30, 12)}
                    fill={s < m.stars ? STAR : 'none'}
                    stroke={s < m.stars ? STAR : CHALK}
                    strokeOpacity={s < m.stars ? 1 : 0.35}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                ))}
              {!m && <Line x1={BOARD_X + 34} y1={y + 40} x2={BOARD_X + BOARD_W - 34} y2={y + 40} stroke={CHALK} strokeWidth={1.5} strokeDasharray="4 8" opacity={0.3} />}
            </G>
          );
        })}
        {r.total > 0 && (
          <G>
            <Line x1={BOARD_X + 34} y1={boardTop + BOARD_HEAD + rows * MENU_ROW + 6} x2={BOARD_X + BOARD_W - 34} y2={boardTop + BOARD_HEAD + rows * MENU_ROW + 6} stroke={CHALK} strokeWidth={1.5} strokeDasharray="4 8" opacity={0.5} />
            <T f="hand" x={BOARD_X + 34} y={boardTop + BOARD_HEAD + rows * MENU_ROW + totalH - 6} fontSize={32} fill={CHALK} children="합계" />
            <T f="hand" x={BOARD_X + BOARD_W - 34} y={boardTop + BOARD_HEAD + rows * MENU_ROW + totalH - 4} fontSize={38} fill={STAR} textAnchor="end" children={`${won(r.total)}원`} />
          </G>
        )}

        {/* 후기 쪽지 */}
        {note && (
          <G transform={`rotate(${tilt} 205 ${lowTop + noteH / 2})`}>
            <Rect x={74} y={lowTop + 4} width={266} height={noteH} fill="#000" opacity={0.06} />
            <Rect x={70} y={lowTop} width={266} height={noteH} fill={NOTE} />
            <Circle cx={203} cy={lowTop + 12} r={7} fill={color.roof} />
            {note.lines.map((line, i) => (
              <T key={i} f="hand" x={92} y={lowTop + 50 + i * NOTE_LINE} fontSize={note.size} fill="#3a3326" children={line} />
            ))}
          </G>
        )}

        {!note && <StickerArt emoji="💐" x={203} y={plaqueTop - 70} size={110} rotate={3} />}

        {/* 날짜 명판 */}
        <Rect x={70} y={plaqueTop} width={266} height={withWhom ? 66 : 50} rx={8} fill="#fff" stroke={TRIM} strokeWidth={3} />
        <T f="sansBold" x={203} y={plaqueTop + 32} fontSize={20} textAnchor="middle" children={dotDateWithDay(r.date)} />
        {!!withWhom && <T x={203} y={plaqueTop + 56} fontSize={17} fill={SUB} textAnchor="middle" children={fitLine(`함께 · ${withWhom}`, 230, 17, 13, 'sans').text} />}

        {/* 문 + 팻말 */}
        <Path
          d={`M${doorX},${ground} V${doorTop + 70} Q${doorX},${doorTop} ${doorX + DOOR_W / 2},${doorTop} Q${doorX + DOOR_W},${doorTop} ${doorX + DOOR_W},${doorTop + 70} V${ground} Z`}
          fill={color.deep}
          stroke={TRIM}
          strokeWidth={6}
        />
        <Circle cx={doorX + DOOR_W - 20} cy={doorTop + 160} r={7} fill={STAR} stroke={TRIM} strokeWidth={2} />
        <Circle cx={doorX + DOOR_W / 2} cy={doorTop + 42} r={4} fill={TRIM} />
        <Path d={`M${doorX + 28},${doorTop + 76} L${doorX + DOOR_W / 2},${doorTop + 42} L${doorX + DOOR_W - 28},${doorTop + 76}`} stroke={TRIM} strokeWidth={2} fill="none" />
        <Rect x={doorX + 12} y={doorTop + 76} width={DOOR_W - 24} height={48} rx={8} fill="#fff" stroke={TRIM} strokeWidth={3} />
        <T f="sansHeavy" x={doorX + DOOR_W / 2} y={doorTop + 107} fontSize={sign.size} textAnchor="middle" children={sign.text} />
        <Rect x={doorX - 20} y={ground - 2} width={DOOR_W + 40} height={14} rx={4} fill={TRIM} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
