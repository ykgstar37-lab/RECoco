// 인생네컷 유료 테마 "네컷 하우스": 길쭉한 집 벽 가운데 창틀에 네컷 띠를 끼운다.
// 지붕은 색마다 무늬가 다르다 — 분홍 줄무늬(지붕 위 검은 고양이) · 파란 격자(뾰족) · 빨간 땡땡이 · 초록 굴뚝(SWEET MY HOME).
// 뒤집으면 같은 집인데 창틀 안이 줄노트가 되어 그날의 일기가 적혀 있다.
//
// 사진은 채운 장수만큼 띠를 나눈다 (2장이면 두 칸). QR 완성본은 창틀 안에 통째로 넣는다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { parseDate, seededRandom, withParticle } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { FourcutHouseColor, FourcutRecord, Photo } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const CW = 500; // 그림 폭 (집 + 지붕 처마·굴뚝이 삐져나올 자리)
const PAD = 16;
const X0 = 40; // 벽 왼쪽
const X1 = 460; // 벽 오른쪽
const CX = (X0 + X1) / 2;
const FW = 260; // 창틀 폭
const FX = CX - FW / 2;
const FPAD = 12; // 창틀 두께
const STRIP = 726; // 사진 띠 높이
const GAP = 6; // 사진 사이 검은 줄
const INK = '#2b2622';

type Roof = 'stripe' | 'grid' | 'dots' | 'chimney';

/** 지붕 무늬·벽·창틀 색. 레퍼런스 네 장을 그대로 옮겼다 */
export const FOURCUT_HOUSE_COLORS: Record<FourcutHouseColor, { name: string; roof: Roof; tile: string; pattern: string; wall: string; frame: string; swatch: string }> = {
  pink: { name: '분홍', roof: 'stripe', tile: '#eaa7b6', pattern: '#f8dbe2', wall: '#fbf1ee', frame: '#7b5a40', swatch: '#eaa7b6' },
  blue: { name: '파랑', roof: 'grid', tile: '#4a6cc0', pattern: '#dfe7fb', wall: '#ececed', frame: '#7b5a40', swatch: '#4a6cc0' },
  red: { name: '빨강', roof: 'dots', tile: '#d2525e', pattern: '#fff5f2', wall: '#e9f2fa', frame: '#4f8a5b', swatch: '#d2525e' },
  green: { name: '초록', roof: 'chimney', tile: '#4c8c57', pattern: '#4c8c57', wall: '#faf6ea', frame: '#d24c5a', swatch: '#4c8c57' },
};

export const FOURCUT_HOUSE_COLOR_IDS = Object.keys(FOURCUT_HOUSE_COLORS) as FourcutHouseColor[];

export const houseColorOf = (r: FourcutRecord): FourcutHouseColor => (r.houseColor && FOURCUT_HOUSE_COLORS[r.houseColor] ? r.houseColor : 'pink');

/** 지붕마다 머리 위 여백(고양이·뾰족한 꼭대기)과 지붕 높이가 다르다 */
const ROOF_SIZE: Record<Roof, { top: number; h: number; text: number }> = {
  stripe: { top: 126, h: 170, text: 0 },
  grid: { top: 20, h: 280, text: 0 },
  dots: { top: 20, h: 210, text: 0 },
  chimney: { top: 40, h: 200, text: 92 },
};

function geometry(r: FourcutRecord) {
  const color = FOURCUT_HOUSE_COLORS[houseColorOf(r)];
  const size = ROOF_SIZE[color.roof];
  const top = size.top;
  const wallTop = top + size.h;
  const frameTop = wallTop + 56 + size.text;
  const frameBot = frameTop + STRIP + FPAD * 2;
  const wallBot = frameBot + 96;
  return { color, top, wallTop, frameTop, frameBot, wallBot, height: wallBot + 10 };
}

export function layoutFourcutHouse(r: FourcutRecord): TemplateLayout {
  const { height } = geometry(r);
  // 0.6 이하라 롤에 이어 붙일 때는 1×4 띠처럼 반으로 줄어든다
  return { width: CW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.6, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 집 윤곽 (그림자용). 초록은 벽 꼭대기가 뾰족하다 */
function outline(g: ReturnType<typeof geometry>) {
  const { color, top, wallTop, wallBot } = g;
  const wall = `M${X0},${wallTop} H${X1} V${wallBot} H${X0} Z`;
  if (color.roof === 'chimney') return `M${X0},${wallTop} L${CX},${top} L${X1},${wallTop} V${wallBot} H${X0} Z`;
  if (color.roof === 'stripe') return `${wall} M${X0 - 8},${wallTop} L${X0 + 44},${top} H${X1 - 44} L${X1 + 8},${wallTop} Z`;
  return `${wall} M${X0 - 6},${wallTop} L${CX},${top} L${X1 + 6},${wallTop} Z`;
}

/** 지붕 꼭대기에 앉은 검은 고양이 (분홍 지붕) */
function Cat({ x, y }: { x: number; y: number }) {
  const fur = '#1f1d22';
  return (
    <G>
      <Path d={`M${x + 24},${y - 8} Q${x + 66},${y - 4} ${x + 60},${y - 40} Q${x + 57},${y - 54} ${x + 48},${y - 50}`} stroke={fur} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Path d={`M${x - 30},${y} Q${x - 34},${y - 50} ${x - 14},${y - 64} H${x + 14} Q${x + 34},${y - 50} ${x + 30},${y} Z`} fill={fur} />
      <Path d={`M${x - 25},${y - 88} L${x - 22},${y - 120} L${x - 4},${y - 104} Z`} fill={fur} strokeLinejoin="round" stroke={fur} strokeWidth={3} />
      <Path d={`M${x + 25},${y - 88} L${x + 22},${y - 120} L${x + 4},${y - 104} Z`} fill={fur} strokeLinejoin="round" stroke={fur} strokeWidth={3} />
      <Ellipse cx={x} cy={y - 82} rx={28} ry={25} fill={fur} />
      {[-11, 11].map((dx) => (
        <G key={dx}>
          <Circle cx={x + dx} cy={y - 85} r={6.4} fill="#e8c34a" />
          <Ellipse cx={x + dx} cy={y - 85} rx={2.2} ry={4.2} fill={fur} />
        </G>
      ))}
    </G>
  );
}

function RoofArt({ g, id }: { g: ReturnType<typeof geometry>; id: string }) {
  const { color, top, wallTop } = g;
  const clip = `${id}-roof`;

  if (color.roof === 'chimney') {
    // 벽이 뾰족하게 올라가고, 그 두 변을 따라 굵은 초록 띠가 처마처럼 걸린다
    const slope = (wallTop - top) / (CX - X0);
    const over = 34;
    const chX = X1 - 120;
    return (
      <G>
        <Rect x={chX} y={top + 34} width={50} height={wallTop - top - 34 - (X1 - chX - 50) * slope + 10} fill={color.tile} />
        <Path d={`M${X0},${wallTop} L${CX},${top} L${X1},${wallTop} Z`} fill={color.wall} />
        <Path d={`M${X0 - over},${wallTop + over * slope} L${CX},${top} L${X1 + over},${wallTop + over * slope}`} stroke={color.tile} strokeWidth={40} fill="none" strokeLinejoin="miter" />
      </G>
    );
  }

  const shape = color.roof === 'stripe' ? `M${X0 - 8},${wallTop} L${X0 + 44},${top} H${X1 - 44} L${X1 + 8},${wallTop} Z` : `M${X0 - 6},${wallTop} L${CX},${top} L${X1 + 6},${wallTop} Z`;
  const rand = seededRandom(`${id}-dots`);
  return (
    <G>
      <Defs>
        <ClipPath id={clip}>
          <Path d={shape} />
        </ClipPath>
      </Defs>
      <Path d={shape} fill={color.tile} />
      <G clipPath={`url(#${clip})`}>
        {color.roof === 'stripe' &&
          Array.from({ length: 22 }, (_, i) => <Line key={i} x1={X0 + 6 + i * 20} y1={top} x2={X0 + 6 + i * 20} y2={wallTop} stroke={color.pattern} strokeWidth={2.4} />)}
        {color.roof === 'grid' && (
          <G>
            {Array.from({ length: 17 }, (_, i) => (
              <Line key={`v${i}`} x1={X0 + 2 + i * 27} y1={top} x2={X0 + 2 + i * 27} y2={wallTop} stroke={color.pattern} strokeWidth={1.8} opacity={0.85} />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <Line key={`h${i}`} x1={X0 - 10} y1={wallTop - 4 - i * 27} x2={X1 + 10} y2={wallTop - 4 - i * 27} stroke={color.pattern} strokeWidth={1.8} opacity={0.85} />
            ))}
          </G>
        )}
        {color.roof === 'dots' &&
          Array.from({ length: 150 }, (_, i) => (
            <Circle key={i} cx={X0 - 6 + rand() * (X1 - X0 + 12)} cy={top + rand() * (wallTop - top)} r={1.4 + rand() * 2.4} fill={color.pattern} opacity={0.9} />
          ))}
      </G>
      {/* 처마 끝 그늘 */}
      <Rect x={X0} y={wallTop} width={X1 - X0} height={5} fill="#000" opacity={0.06} />
    </G>
  );
}

/** 벽 + 지붕 + 창틀 + 아래 명패. 앞·뒤가 같이 쓴다 */
function Shell({ g, id, connected }: { g: ReturnType<typeof geometry>; id: string; connected: boolean }) {
  const { color, top, wallTop, frameTop, frameBot, wallBot } = g;
  return (
    <G>
      {!connected && <PaperShadow d={outline(g)} strength={1.2} />}
      <Rect x={X0} y={wallTop - 1} width={X1 - X0} height={wallBot - wallTop + 1} fill={color.wall} />
      <RoofArt g={g} id={id} />
      {color.roof === 'stripe' && <Cat x={X1 - 104} y={top + 2} />}
      {color.roof === 'chimney' && (
        <G>
          <T f="monoBold" x={CX} y={wallTop + 22} fontSize={22} fill={color.frame} textAnchor="middle" letterSpacing={6} children="SWEET" />
          <T f="monoBold" x={CX} y={wallTop + 56} fontSize={22} fill={color.frame} textAnchor="middle" letterSpacing={6} children="MY HOME" />
        </G>
      )}
      <Rect x={FX} y={frameTop} width={FW} height={frameBot - frameTop} fill={color.frame} />
      {/* 명패 (레퍼런스의 작은 타원 로고) */}
      <Ellipse cx={CX} cy={frameBot + 46} rx={40} ry={14} fill="#fff" stroke={INK} strokeWidth={1.6} />
      <T f="sansBold" x={CX} y={frameBot + 51} fontSize={14} fill={INK} textAnchor="middle" children={BRAND.en} />
      {/* 질감이 사진을 덮지 않게 창틀 안은 이 다음에 그린다 */}
      <PaperOverlay id={id} d={outline(g)} width={CW} height={g.height} wrinkle="none" surface="grain" />
    </G>
  );
}

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 채운 사진만 모은다. 하나도 없으면 빈 칸 네 개 */
function photosOf(r: FourcutRecord): (Photo | null)[] {
  const filled = r.photos.filter(Boolean) as Photo[];
  return filled.length ? filled.slice(0, 4) : [null, null, null, null];
}

interface Props {
  record: FourcutRecord;
  width: number;
  connected?: boolean;
}

export function FourcutHouseFront({ record: r, width, connected = false }: Props) {
  const L = layoutFourcutHouse(r);
  const g = geometry(r);
  const id = `fhouse-${r.id}`;
  const sx = FX + FPAD;
  const sw = FW - FPAD * 2;
  const sy = g.frameTop + FPAD;
  const qr = r.source === 'qr' ? r.frameImage : null;
  const photos = photosOf(r);
  const cellH = (STRIP - GAP * (photos.length - 1)) / photos.length;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Shell g={g} id={id} connected={connected} />
        <Defs>
          <ClipPath id={`${id}-strip`}>
            <Rect x={sx} y={sy} width={sw} height={STRIP} />
          </ClipPath>
        </Defs>
        <Rect x={sx} y={sy} width={sw} height={STRIP} fill="#1b1a1c" />
        {qr ? (
          <Image href={{ uri: qr.uri }} x={sx} y={sy} width={sw} height={STRIP} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-strip)`} />
        ) : (
          photos.map((p, i) => {
            const y = sy + i * (cellH + GAP);
            const cid = `${id}-cell-${i}`;
            return (
              <G key={i}>
                <Defs>
                  <ClipPath id={cid}>
                    <Rect x={sx} y={y} width={sw} height={cellH} />
                  </ClipPath>
                </Defs>
                {p ? (
                  <Image href={{ uri: p.uri }} x={sx} y={y} width={sw} height={cellH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${cid})`} />
                ) : (
                  <G>
                    <Rect x={sx} y={y} width={sw} height={cellH} fill="#dcd9d3" />
                    <G opacity={0.45}>
                      <Rect x={CX - 30} y={y + cellH / 2 - 26} width={60} height={44} rx={8} fill="none" stroke={INK} strokeWidth={3} />
                      <Circle cx={CX} cy={y + cellH / 2 - 4} r={12} fill="none" stroke={INK} strokeWidth={3} />
                    </G>
                  </G>
                )}
              </G>
            );
          })
        )}
      </G>
    </Svg>
  );
}

/** 뒷면: 같은 집. 창틀 안이 줄노트가 되어 그날의 일기를 적는다 */
export function FourcutHouseBack({ record: r, width }: Props) {
  const L = layoutFourcutHouse(r);
  const g = geometry(r);
  const id = `fhouse-back-${r.id}`;
  const ink = g.color.frame;
  const sx = FX + FPAD;
  const sw = FW - FPAD * 2;
  const sy = g.frameTop + FPAD;
  const inner = sw - 40;

  const d = parseDate(r.date);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const title = fitLines(r.title.trim() || '오늘의 네컷', inner, 30, 20, 2, 'serif');
  const titleTop = sy + 120;
  const ruleTop = titleTop + title.lines.length * 38 + 34;
  const LINE = 36;
  const footTop = sy + STRIP - 120;
  const rows = Math.max(1, Math.floor((footTop - ruleTop - 10) / LINE));
  const diary = fitLines(r.diary.trim() || '오늘 하루를 짧게 남겨보세요.', inner, 19, 14, rows, 'serif');
  const place = r.place.trim();
  const withWhom = r.withWhom.trim();

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Shell g={g} id={id} connected={false} />
        <Rect x={sx} y={sy} width={sw} height={STRIP} fill="#fffdf7" />
        <T f="monoBold" x={CX} y={sy + 50} fontSize={13} fill={ink} textAnchor="middle" letterSpacing={3} children="TODAY'S HOME" />
        <T f="mono" x={CX} y={sy + 76} fontSize={14} fill={INK} opacity={0.6} textAnchor="middle" letterSpacing={2} children={date} />
        {title.lines.map((t, i) => (
          <T key={i} f="serifBold" x={CX} y={titleTop + i * 38} fontSize={title.size} fill={INK} textAnchor="middle" children={t} />
        ))}
        <Line x1={sx + 20} y1={ruleTop - 22} x2={sx + sw - 20} y2={ruleTop - 22} stroke={ink} strokeWidth={1.4} strokeDasharray="2 5" />
        {Array.from({ length: rows }, (_, i) => (
          <Line key={i} x1={sx + 20} y1={ruleTop + 12 + i * LINE} x2={sx + sw - 20} y2={ruleTop + 12 + i * LINE} stroke="#e8e0d0" strokeWidth={1} />
        ))}
        {diary.lines.map((t, i) => (
          <T key={i} f="serif" x={sx + 22} y={ruleTop + 4 + i * LINE} fontSize={diary.size} fill={INK} children={t} />
        ))}
        <Line x1={sx + 20} y1={footTop} x2={sx + sw - 20} y2={footTop} stroke={ink} strokeWidth={1.4} strokeDasharray="2 5" />
        {!!place && <T f="sansBold" x={CX} y={footTop + 42} fontSize={fitLine(place, inner, 17, 12, 'sansBold').size} textAnchor="middle" children={fitLine(place, inner, 17, 12, 'sansBold').text} />}
        {!!withWhom && (
          <T f="sans" x={CX} y={footTop + (place ? 72 : 42)} fontSize={15} fill={INK} opacity={0.7} textAnchor="middle" children={fitLine(`${withParticle(withWhom)} 함께`, inner, 15, 11, 'sans').text} />
        )}
      </G>
    </Svg>
  );
}
