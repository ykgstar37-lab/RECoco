// 인생네컷 유료 테마 "하우스네컷": 길쭉한 집 벽 가운데 창틀에 네컷 띠를 끼운다.
// 지붕은 색마다 무늬가 다르다 — 분홍 줄무늬(지붕 위에 코코) · 파란 격자(둥근 다락창) · 빨간 땡땡이 · 초록 굴뚝(연기).
// 창틀은 둥근 모서리에 창턱이 달리고, 처마 끝엔 물결 장식이 붙는다 (레퍼런스를 그대로 따르지 않고 조금 바꿨다).
// 뒤집으면 같은 집 벽에 그날의 일기를 바로 적는다 (창틀·흰 종이 없이).
//
// 사진은 채운 장수만큼 띠를 나눈다 (2장이면 두 칸). QR 완성본은 창틀 안에 통째로 넣는다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { coverRect } from '../lib/photoCrop';
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
const FPAD = 14; // 창틀 두께
const FR = 18; // 창틀 모서리
const STRIP = 726; // 사진 띠 높이
const GAP = 6; // 사진 사이 검은 줄
const INK = '#2b2622';

type Roof = 'stripe' | 'grid' | 'dots' | 'chimney';

/** 지붕 무늬·벽·창틀 색 */
export const FOURCUT_HOUSE_COLORS: Record<FourcutHouseColor, { name: string; roof: Roof; tile: string; pattern: string; wall: string; frame: string; swatch: string }> = {
  pink: { name: '분홍', roof: 'stripe', tile: '#eaa7b6', pattern: '#f8dbe2', wall: '#fbf1ee', frame: '#8a6448', swatch: '#eaa7b6' },
  blue: { name: '파랑', roof: 'grid', tile: '#4a6cc0', pattern: '#dfe7fb', wall: '#ebebeb', frame: '#8a6448', swatch: '#4a6cc0' },
  red: { name: '빨강', roof: 'dots', tile: '#d2525e', pattern: '#fff5f2', wall: '#e9f2fa', frame: '#4f8a5b', swatch: '#d2525e' },
  green: { name: '초록', roof: 'chimney', tile: '#4c8c57', pattern: '#78ae80', wall: '#faf6ea', frame: '#d24c5a', swatch: '#4c8c57' },
};

export const FOURCUT_HOUSE_COLOR_IDS = Object.keys(FOURCUT_HOUSE_COLORS) as FourcutHouseColor[];

export const houseColorOf = (r: FourcutRecord): FourcutHouseColor => (r.houseColor && FOURCUT_HOUSE_COLORS[r.houseColor] ? r.houseColor : 'pink');

/** 지붕마다 머리 위 여백(코코·뾰족한 꼭대기·연기)과 지붕 높이가 다르다 */
const ROOF_SIZE: Record<Roof, { top: number; h: number }> = {
  stripe: { top: 116, h: 170 },
  grid: { top: 20, h: 280 },
  dots: { top: 20, h: 210 },
  chimney: { top: 100, h: 200 },
};

function geometry(r: FourcutRecord) {
  const color = FOURCUT_HOUSE_COLORS[houseColorOf(r)];
  const size = ROOF_SIZE[color.roof];
  const top = size.top;
  const wallTop = top + size.h;
  const frameTop = wallTop + 60;
  const frameBot = frameTop + STRIP + FPAD * 2;
  const wallBot = frameBot + 104;
  return { color, top, wallTop, frameTop, frameBot, wallBot, height: wallBot + 10 };
}

type Geo = ReturnType<typeof geometry>;

export function layoutFourcutHouse(r: FourcutRecord): TemplateLayout {
  const { height } = geometry(r);
  // 0.6 이하라 롤에 이어 붙일 때는 1×4 띠처럼 반으로 줄어든다
  return { width: CW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.6, inset: { top: PAD, bottom: PAD + 14 } };
}

const roofShape = (g: Geo) =>
  g.color.roof === 'stripe' ? `M${X0 - 10},${g.wallTop} L${X0 + 44},${g.top} H${X1 - 44} L${X1 + 10},${g.wallTop} Z` : `M${X0 - 8},${g.wallTop} L${CX},${g.top} L${X1 + 8},${g.wallTop} Z`;

/** 집 윤곽 (그림자·질감용) */
function outline(g: Geo) {
  const { wallTop, wallBot } = g;
  return `M${X0},${wallTop} H${X1} V${wallBot} H${X0} Z ${roofShape(g)}`;
}

// 코코 (components/Coco.tsx 의 몸통·꼭지를 그대로 옮겼다. 그 파일은 애니메이션을 끌고 와서 양식에서 바로 못 쓴다)
const COCO_BODY =
  'M40,256 C40,150 108,84 186,78 C196,58 206,40 222,40 C232,40 238,46 240,52 C250,46 262,50 264,60 C272,62 276,72 270,82 C330,98 360,160 360,256 C360,292 336,300 300,301 C250,303 150,303 100,301 C64,300 40,292 40,256 Z';

/** 지붕 꼭대기에 앉은 코코 (x: 가운데, y: 앉은 자리, w: 폭) */
function CocoSitting({ x, y, w }: { x: number; y: number; w: number }) {
  const s = w / 320; // 몸통이 viewBox 40~360 (폭 320)
  return (
    <G transform={`translate(${x - 200 * s} ${y - 302 * s}) scale(${s})`}>
      {/* 흰 코코 (메인 화면의 white 톤). 흰 바탕에 묻히지 않게 아주 옅은 테두리만 */}
      <Path d={COCO_BODY} fill="#ffffff" stroke="#f1dccf" strokeWidth={6} strokeLinejoin="round" />
      <Path d="M214,58 Q206,72 196,80" stroke="#ffc9a1" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Path d="M246,64 Q238,76 242,90" stroke="#ffc9a1" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Ellipse cx={108} cy={228} rx={24} ry={13} fill="#ffb18c" opacity={0.85} />
      <Ellipse cx={292} cy={228} rx={24} ry={13} fill="#ffb18c" opacity={0.85} />
      <Circle cx={158} cy={190} r={14.5} fill="#3a2a22" />
      <Circle cx={242} cy={190} r={14.5} fill="#3a2a22" />
      <Path d="M158,224 Q200,217 242,224 Q247,227 240,236 C228,272 172,272 160,236 Q153,227 158,224 Z" fill="#3a2a22" />
      <Ellipse cx={200} cy={258} rx={22} ry={11} fill="#f06470" />
    </G>
  );
}

/** 창턱 왼쪽 끝에 올려 둔 작은 화분 (파란 지붕 집). x: 가운데, y: 화분 밑바닥 */
function FlowerPot({ x, y }: { x: number; y: number }) {
  const leaf = '#5f9463';
  return (
    <G>
      {/* 줄기 + 잎 */}
      <Path d={`M${x},${y - 30} Q${x - 2},${y - 38} ${x + 1},${y - 44}`} stroke={leaf} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Ellipse cx={x - 11} cy={y - 34} rx={9} ry={4.5} fill={leaf} transform={`rotate(-28 ${x - 11} ${y - 34})`} />
      <Ellipse cx={x + 11} cy={y - 37} rx={9} ry={4.5} fill={leaf} transform={`rotate(24 ${x + 11} ${y - 37})`} />
      {/* 꽃 한 송이 */}
      {[0, 72, 144, 216, 288].map((a) => (
        <Circle key={a} cx={x + 1 + Math.cos((a * Math.PI) / 180) * 5.5} cy={y - 46 + Math.sin((a * Math.PI) / 180) * 5.5} r={4.2} fill="#f4a6b8" />
      ))}
      <Circle cx={x + 1} cy={y - 46} r={3} fill="#ffd166" />
      {/* 토분 */}
      <Path d={`M${x - 15},${y - 26} H${x + 15} L${x + 11},${y} H${x - 11} Z`} fill="#d0805a" />
      <Rect x={x - 18} y={y - 32} width={36} height={8} rx={2.5} fill="#b9683f" />
    </G>
  );
}

/** 처마 끝 물결 장식 */
function Scallop({ y, x0, x1, fill }: { y: number; x0: number; x1: number; fill: string }) {
  const n = 12;
  const w = (x1 - x0) / n;
  let d = `M${x0},${y}`;
  for (let i = 0; i < n; i++) d += ` q${w / 2},${w * 0.55} ${w},0`;
  return <Path d={`${d} Z`} fill={fill} />;
}

/** 초록 지붕 굴뚝 + 서로 떨어진 연기 동그라미 (지붕 뒤에 그린다) */
function Chimney({ g }: { g: Geo }) {
  const { color, top, wallTop } = g;
  const slope = (wallTop - top) / (CX - X0);
  const chX = X1 - 120;
  const chTop = top + 40;
  return (
    <G>
      {[
        // 동그라미끼리 떨어뜨려 한 김씩 피어오르게
        [chX + 22, chTop - 20, 10],
        [chX + 46, chTop - 52, 13],
        [chX + 30, chTop - 86, 9],
      ].map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill="#fff" stroke="#d9d4c8" strokeWidth={2} />
      ))}
      <Rect x={chX} y={chTop} width={50} height={wallTop - chTop - (X1 - chX - 50) * slope + 10} rx={4} fill={color.tile} />
      <Rect x={chX - 6} y={chTop - 4} width={62} height={14} rx={4} fill="#3d7347" />
    </G>
  );
}

function RoofArt({ g, id }: { g: Geo; id: string }) {
  const { color, top, wallTop } = g;
  const clip = `${id}-roof`;

  const shape = roofShape(g);
  const rand = seededRandom(`${id}-dots`);
  return (
    <G>
      <Defs>
        <ClipPath id={clip}>
          <Path d={shape} />
        </ClipPath>
      </Defs>
      {color.roof === 'chimney' && <Chimney g={g} />}
      <Path d={shape} fill={color.tile} />
      <G clipPath={`url(#${clip})`}>
        {/* 초록 지붕: 가로 기와 줄 */}
        {color.roof === 'chimney' &&
          Array.from({ length: 9 }, (_, i) => <Line key={i} x1={X0 - 10} y1={wallTop - 26 - i * 26} x2={X1 + 10} y2={wallTop - 26 - i * 26} stroke={color.pattern} strokeWidth={2.4} />)}
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
      {/* 파란 지붕엔 둥근 다락창 */}
      {color.roof === 'grid' && (
        <G>
          <Circle cx={CX} cy={wallTop - 82} r={38} fill="#f4f1e8" stroke="#fff" strokeWidth={8} />
          <Line x1={CX - 38} y1={wallTop - 82} x2={CX + 38} y2={wallTop - 82} stroke={color.tile} strokeWidth={4} />
          <Line x1={CX} y1={wallTop - 120} x2={CX} y2={wallTop - 44} stroke={color.tile} strokeWidth={4} />
        </G>
      )}
      {/* 초록 지붕엔 작은 하트 창 */}
      {color.roof === 'chimney' && (
        <Path
          d={`M${CX},${wallTop - 52} C${CX - 30},${wallTop - 74} ${CX - 22},${wallTop - 100} ${CX},${wallTop - 86} C${CX + 22},${wallTop - 100} ${CX + 30},${wallTop - 74} ${CX},${wallTop - 52} Z`}
          fill="#f4f1e8"
        />
      )}
      {/* 처마 끝: 초록은 곧은 선, 나머지는 물결 (벽 쪽으로 늘어진다) */}
      {color.roof === 'chimney' ? (
        <Rect x={X0 - 8} y={wallTop - 4} width={X1 - X0 + 16} height={8} rx={3} fill="#3d7347" />
      ) : (
        <Scallop y={wallTop - 1} x0={X0 - (color.roof === 'stripe' ? 10 : 8)} x1={X1 + (color.roof === 'stripe' ? 10 : 8)} fill={color.tile} />
      )}
    </G>
  );
}

/** 벽 + 지붕 + 아래 명패. 앞·뒤가 같이 쓴다 (창틀은 앞면만) */
function Shell({ g, id, connected }: { g: Geo; id: string; connected: boolean }) {
  const { color, top, wallTop, wallBot } = g;
  return (
    <G>
      {!connected && <PaperShadow d={outline(g)} strength={1.2} />}
      <Rect x={X0} y={wallTop - 1} width={X1 - X0} height={wallBot - wallTop + 1} fill={color.wall} />
      <RoofArt g={g} id={id} />
      {color.roof === 'stripe' && <CocoSitting x={X1 - 116} y={top + 8} w={124} />}
      {/* 명패 */}
      <Rect x={CX - 46} y={wallBot - 66} width={92} height={30} rx={15} fill="#fff" stroke={color.frame} strokeWidth={2.4} />
      <T f="sansBold" x={CX} y={wallBot - 46} fontSize={14} fill={INK} textAnchor="middle" children={BRAND.en} />
      <PaperOverlay id={id} d={outline(g)} width={CW} height={g.height} wrinkle="none" surface="grain" />
    </G>
  );
}

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 자르기 화면용: 사진을 n 장 넣었을 때 한 칸의 세로/가로 비율 */
export const houseCellAspect = (n: number) => {
  const k = Math.min(4, Math.max(1, n));
  return (STRIP - GAP * (k - 1)) / k / (FW - FPAD * 2);
};

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
  const inR = FR - FPAD / 2;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Shell g={g} id={id} connected={connected} />
        <Defs>
          <ClipPath id={`${id}-strip`}>
            <Rect x={sx} y={sy} width={sw} height={STRIP} rx={inR} />
          </ClipPath>
        </Defs>
        {/* 둥근 창틀 + 아래 창턱 */}
        <Rect x={FX} y={g.frameTop} width={FW} height={g.frameBot - g.frameTop} rx={FR} fill={g.color.frame} />
        <Rect x={FX - 18} y={g.frameBot - 8} width={FW + 36} height={18} rx={6} fill={g.color.frame} />
        <Rect x={FX - 18} y={g.frameBot + 6} width={FW + 36} height={4} rx={2} fill="#000" opacity={0.1} />
        <G clipPath={`url(#${id}-strip)`}>
          <Rect x={sx} y={sy} width={sw} height={STRIP} fill="#1b1a1c" />
          {qr ? (
            <Image href={{ uri: qr.uri }} x={sx} y={sy} width={sw} height={STRIP} preserveAspectRatio="xMidYMid slice" />
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
                    <Image href={{ uri: p.uri }} {...coverRect(p, { x: sx, y, width: sw, height: cellH })} preserveAspectRatio="none" clipPath={`url(#${cid})`} />
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
        {/* 사진보다 앞에 그려야 화분이 띠에 안 가린다 */}
        {g.color.roof === 'grid' && <FlowerPot x={FX + 4} y={g.frameBot - 8} />}
      </G>
    </Svg>
  );
}

/** 뒷면: 같은 집 벽에 그날의 일기를 바로 적는다 (흰 종이·창틀 없이) */
export function FourcutHouseBack({ record: r, width }: Props) {
  const L = layoutFourcutHouse(r);
  const g = geometry(r);
  const id = `fhouse-back-${r.id}`;
  const ink = g.color.frame;
  const left = X0 + 44;
  const right = X1 - 44;
  const inner = right - left;

  const d = parseDate(r.date);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const title = fitLines(r.title.trim() || '오늘의 네컷', inner, 36, 22, 2, 'serif');
  const top = g.frameTop + 20;
  const titleTop = top + 96;
  const ruleTop = titleTop + (title.lines.length - 1) * 46 + 74;
  const LINE = 42;
  const footTop = g.frameBot - 70;
  const rows = Math.max(1, Math.floor((footTop - ruleTop - 20) / LINE));
  const diary = fitLines(r.diary.trim() || '오늘 하루를 짧게 남겨보세요.', inner - 8, 22, 16, rows, 'serif');
  const place = r.place.trim();
  const withWhom = r.withWhom.trim();
  const foot = [place, withWhom && `${withParticle(withWhom)} 함께`].filter(Boolean).join(' · ');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Shell g={g} id={id} connected={false} />
        <T f="monoBold" x={CX} y={top + 20} fontSize={14} fill={ink} textAnchor="middle" letterSpacing={4} children="OUR LITTLE HOME" />
        <T f="mono" x={CX} y={top + 46} fontSize={15} fill={INK} opacity={0.55} textAnchor="middle" letterSpacing={2} children={date} />
        {title.lines.map((t, i) => (
          <T key={i} f="serifBold" x={CX} y={titleTop + i * 46} fontSize={title.size} fill={INK} textAnchor="middle" children={t} />
        ))}
        <Line x1={left} y1={ruleTop - 30} x2={right} y2={ruleTop - 30} stroke={ink} strokeWidth={1.6} strokeDasharray="2 6" />
        {/* 벽지에 연필로 줄을 긋고 쓴 느낌 */}
        {Array.from({ length: rows }, (_, i) => (
          <Line key={i} x1={left} y1={ruleTop + 12 + i * LINE} x2={right} y2={ruleTop + 12 + i * LINE} stroke={ink} strokeWidth={1} opacity={0.22} />
        ))}
        {diary.lines.map((t, i) => (
          <T key={i} f="serif" x={left + 4} y={ruleTop + 2 + i * LINE} fontSize={diary.size} fill={INK} children={t} />
        ))}
        <Line x1={left} y1={footTop} x2={right} y2={footTop} stroke={ink} strokeWidth={1.6} strokeDasharray="2 6" />
        {!!foot && <T f="sansBold" x={CX} y={footTop + 40} fontSize={fitLine(foot, inner, 18, 12, 'sansBold').size} textAnchor="middle" children={fitLine(foot, inner, 18, 12, 'sansBold').text} />}
      </G>
    </Svg>
  );
}
