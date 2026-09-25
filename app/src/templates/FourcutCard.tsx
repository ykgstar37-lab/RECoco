// 인생네컷 유료 테마 "코코몬 카드": 네컷 사진 한 장을 수집 카드로 뽑는다
// 카드 틀은 design/tools/make_cards.js 가 만든 그림(assets/cards/*.webp)을 그대로 쓰고,
// 사진과 글자만 그 위에 얹는다. 등급은 고를 수 없고 기록 id 로 정해진다 (열 때마다 바뀌지 않는다)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Path, Rect, Text } from 'react-native-svg';

import { seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { FourcutRecord, MonsterRank } from '../types';
import { PaperShadow, TemplateLayout } from './shared';

/** require 한 그림. 미리보기 도구에서는 { default: 'data:...' } 로 와서 한 겹 벗긴다 */
const asset = (m: unknown) => (m && typeof m === 'object' && 'default' in (m as Record<string, unknown>) ? (m as { default: number }).default : (m as number));

const PW = 600;
const PH = 800; // 등급마다 틀 비율이 조금씩 달라도 카드 크기는 하나로 맞춘다
const PAD = 14;
const INK = '#1c1a22';

/**
 * 등급 (weight 합 100). 카드 틀 그림이 등급마다 하나씩 있다.
 * foot 은 그림에 굳어 있는 "RECoco ★ 날짜" 를 덮을 자리 (카드마다 다르다)
 */
export const MONSTER_RANKS: Record<MonsterRank, { name: string; tag: string; weight: number; frame: number; logo: number; foot: { x: number; w: number; y: number } }> = {
  c: { name: '흔함', tag: 'C', weight: 40, frame: asset(require('../../assets/cards/C.jpg')), logo: asset(require('../../assets/cards/logo-C.png')), foot: { x: 354, w: 224, y: 740 } },
  b: { name: '보통', tag: 'B', weight: 28, frame: asset(require('../../assets/cards/B.jpg')), logo: asset(require('../../assets/cards/logo-B.png')), foot: { x: 311, w: 240, y: 734 } },
  a: { name: '좋음', tag: 'A', weight: 18, frame: asset(require('../../assets/cards/A.jpg')), logo: asset(require('../../assets/cards/logo-A.png')), foot: { x: 216, w: 200, y: 754 } },
  s: { name: '아주 좋음', tag: 'S', weight: 9, frame: asset(require('../../assets/cards/S.jpg')), logo: asset(require('../../assets/cards/logo-S.png')), foot: { x: 367, w: 206, y: 731 } },
  ss: { name: '최고', tag: 'SS', weight: 4, frame: asset(require('../../assets/cards/SS.jpg')), logo: asset(require('../../assets/cards/logo-SS.png')), foot: { x: 216, w: 182, y: 751 } },
  r: { name: '무지개', tag: 'R', weight: 1, frame: asset(require('../../assets/cards/R.jpg')), logo: asset(require('../../assets/cards/logo-R.png')), foot: { x: 213, w: 184, y: 748 } },
};

export const MONSTER_RANK_IDS = Object.keys(MONSTER_RANKS) as MonsterRank[];

/** 능력치 이름은 두 개씩 짝지어 뽑는다 */
const STAT_PAIRS = [
  ['행운', '기운'],
  ['행운', '기분'],
  ['행복', '추억'],
  ['매력', '웃음'],
  ['기운', '설렘'],
  ['행복', '우정'],
  ['웃음', '추억'],
  ['매력', '기분'],
];

const FORTUNES = [
  '오늘 찍은 사진은 유난히 잘 나온다.',
  '한 장은 반드시 흔들린다. 그게 제일 웃기다.',
  '같이 찍은 사람과 더 친해진다.',
  '지갑 속에 한 장 넣어두면 좋은 일이 생긴다.',
  '다음에도 같은 자리에서 찍고 싶어진다.',
  '이 날의 표정을 오래 기억하게 된다.',
  '누군가 이 사진을 보고 웃는다.',
];

/** 기록 하나가 어떤 등급으로 뽑혔는지 · 능력치와 운세 (id 로 정해진다) */
export function monsterOf(r: Pick<FourcutRecord, 'id'>) {
  const rnd = seededRandom(`${r.id}-cocomon`);
  let roll = rnd() * 100;
  let rank: MonsterRank = 'c';
  for (const id of MONSTER_RANK_IDS) {
    roll -= MONSTER_RANKS[id].weight;
    if (roll <= 0) {
      rank = id;
      break;
    }
  }
  const info = MONSTER_RANKS[rank];
  const [leftName, rightName] = STAT_PAIRS[Math.floor(rnd() * STAT_PAIRS.length)];
  // 귀한 카드일수록 숫자가 높다
  const base = 50 + MONSTER_RANK_IDS.indexOf(rank) * 7;
  const left = Math.min(100, base + Math.floor(rnd() * 8) * 5);
  const right = Math.min(100, base + Math.floor(rnd() * 8) * 5);
  const fortune = FORTUNES[Math.floor(rnd() * FORTUNES.length)];
  return {
    rank,
    info,
    stats: [
      { name: leftName, value: left },
      { name: rightName, value: right },
    ],
    fortune,
  };
}

/**
 * 카드 틀 그림마다 다른 자리. 값은 모두 **원본 그림(1086×1448) 픽셀**이다.
 * crop 은 그림 둘레의 흰 여백을 뺀 실제 카드 자리 — 이 네모가 카드 전체가 되도록 늘려 그린다.
 */
const SHEET = { w: 1086, h: 1448 };

interface Spot {
  crop: { x: number; y: number; w: number; h: number };
  win: { x0: number; x1: number; topL: number; notchFrom: number; notchTo: number; topR: number; bottom: number };
  bar: { y: number; left: number; right: number };
  descY: number;
  foot: { x0: number; x1: number; y0: number; y1: number };
}

const SPOT: Record<MonsterRank, Spot> = {
  c: {
    crop: { x: 41, y: 34, w: 1004, h: 1381 },
    win: { x0: 118, x1: 972, topL: 210, notchFrom: 600, notchTo: 700, topR: 275, bottom: 905 },
    bar: { y: 1018, left: 375, right: 718 },
    descY: 1155,
    foot: { x0: 688, x1: 1017, y0: 1352, y1: 1395 },
  },
  b: {
    crop: { x: 57, y: 57, w: 972, h: 1355 },
    win: { x0: 140, x1: 945, topL: 290, notchFrom: 610, notchTo: 690, topR: 335, bottom: 915 },
    bar: { y: 1022, left: 375, right: 715 },
    descY: 1150,
    foot: { x0: 594, x1: 965, y0: 1337, y1: 1387 },
  },
  a: {
    crop: { x: 52, y: 0, w: 1027, h: 1448 },
    win: { x0: 120, x1: 985, topL: 172, notchFrom: 610, notchTo: 700, topR: 258, bottom: 888 },
    bar: { y: 1003, left: 390, right: 740 },
    descY: 1120,
    foot: { x0: 426, x1: 713, y0: 1380, y1: 1420 },
  },
  s: {
    crop: { x: 24, y: 0, w: 1039, h: 1442 },
    win: { x0: 120, x1: 970, topL: 275, notchFrom: 600, notchTo: 700, topR: 288, bottom: 865 },
    bar: { y: 988, left: 370, right: 715 },
    descY: 1120,
    foot: { x0: 690, x1: 1002, y0: 1331, y1: 1371 },
  },
  ss: {
    crop: { x: 0, y: 0, w: 1086, h: 1448 },
    win: { x0: 115, x1: 975, topL: 225, notchFrom: 610, notchTo: 700, topR: 305, bottom: 920 },
    bar: { y: 1025, left: 352, right: 730 },
    descY: 1180,
    foot: { x0: 408, x1: 680, y0: 1365, y1: 1407 },
  },
  r: {
    crop: { x: 0, y: 0, w: 1086, h: 1448 },
    win: { x0: 110, x1: 1000, topL: 215, notchFrom: 600, notchTo: 700, topR: 300, bottom: 905 },
    bar: { y: 1022, left: 358, right: 730 },
    descY: 1160,
    foot: { x0: 407, x1: 680, y0: 1359, y1: 1400 },
  },
};

const INSET = 9; // 사진을 창 안쪽으로 물리는 정도 (원본 px)
const TITLE = { cx: 635, y: 112, w: 388 };
const LOGO = { x: 360, y: 798, w: 368, h: 134 };
const DESC = { x: 134, w: 818, line: 54 };

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

export function layoutFourcutCard(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (connected: boolean) =>
  connected ? `M0,0 H${PW} V${PH} H0 Z` : `M16,0 H${PW - 16} Q${PW},0 ${PW},16 V${PH - 16} Q${PW},${PH} ${PW - 16},${PH} H16 Q0,${PH} 0,${PH - 16} V16 Q0,0 16,0 Z`;

/** 사진이 들어갈 창 (오른쪽 위가 한 번 꺾인 모양). 원본 좌표를 받아 카드 좌표로 옮긴다 */
const windowPath = (win: Spot['win'], X: (v: number) => number, Y: (v: number) => number) => {
  // 은색 테두리를 덮지 않게 살짝 안쪽으로
  const x = X(win.x0 + INSET);
  const x2 = X(win.x1 - INSET);
  const yL = Y(win.topL + INSET);
  const yR = Y(win.topR + INSET);
  const yB = Y(win.bottom - INSET);
  const nf = X(win.notchFrom);
  const nt = X(win.notchTo);
  const r = 12;
  return (
    `M${x + r},${yL} H${nf} L${nt},${yR} H${x2 - r} Q${x2},${yR} ${x2},${yR + r}` +
    ` V${yB - r} Q${x2},${yB} ${x2 - r},${yB} H${x + r} Q${x},${yB} ${x},${yB - r}` +
    ` V${yL + r} Q${x},${yL} ${x + r},${yL} Z`
  );
};

export function FourcutCard({ record: r, width, connected = false }: { record: FourcutRecord; width: number; connected?: boolean }) {
  const L = layoutFourcutCard(r);
  const { rank, info, stats, fortune } = monsterOf(r);
  const spot = SPOT[rank];
  const { crop, win, bar, foot } = spot;
  // 원본 그림 좌표 → 카드 좌표 (가로·세로 배율이 조금 다르다)
  const kx = PW / crop.w;
  const ky = PH / crop.h;
  const k = (kx + ky) / 2; // 글자·로고처럼 비율을 지켜야 하는 것
  const X = (v: number) => Math.round((v - crop.x) * kx * 10) / 10;
  const Y = (v: number) => Math.round((v - crop.y) * ky * 10) / 10;
  const shape = cardPath(connected);
  const id = `cocomon-${r.id}`;
  const art = artOf(r);
  const title = fitLine(r.title.trim() || '이름 없는 하루', TITLE.w * k, 22, 14, 'sansHeavy');
  const desc = fitLines(`${fortune} ${r.diary.trim()}`.trim(), DESC.w * k, 17, 13, 2, 'sans');
  const descLine = DESC.line * ky;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-win`}>
            <Path d={windowPath(win, X, Y)} />
          </ClipPath>
        </Defs>

        {/* 카드 틀 그림 (흰 여백을 뺀 자리가 카드 전체가 되게 늘린다) */}
        <G clipPath={`url(#${id}-card)`}>
          <Image href={info.frame} x={X(0)} y={Y(0)} width={SHEET.w * kx} height={SHEET.h * ky} preserveAspectRatio="none" />
        </G>

        {/* 사진 (틀 위에 얹어 창을 채운다) */}
        {art && (
          <Image
            href={{ uri: art.uri }}
            x={X(win.x0 + INSET)}
            y={Y(win.topL + INSET)}
            width={X(win.x1 - INSET) - X(win.x0 + INSET)}
            height={Y(win.bottom - INSET) - Y(win.topL + INSET)}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${id}-win)`}
          />
        )}

        {/* 사진에 가린 로고를 다시 얹는다 */}
        {art && <Image href={info.logo} x={X(LOGO.x)} y={Y(LOGO.y)} width={LOGO.w * kx} height={LOGO.h * ky} preserveAspectRatio="xMidYMid meet" />}

        {/* 제목 (카드마다 무늬가 있어서 옅은 판을 깔고 쓴다) */}
        <Rect x={X(TITLE.cx) - title.text.length * title.size * 0.32 - 14} y={Y(TITLE.y) - title.size - 4} width={title.text.length * title.size * 0.64 + 28} height={title.size + 16} rx={(title.size + 16) / 2} fill="#fff" opacity={0.7} />
        <T f="sansHeavy" x={X(TITLE.cx)} y={Y(TITLE.y)} fontSize={title.size} textAnchor="middle" children={title.text} />

        {/* 능력치 두 칸 */}
        <T f="sansHeavy" x={X(bar.left)} y={Y(bar.y)} fontSize={22} textAnchor="middle" children={`${stats[0].name} / ${stats[0].value}`} />
        <T f="sansHeavy" x={X(bar.right)} y={Y(bar.y)} fontSize={22} textAnchor="middle" children={`${stats[1].name} / ${stats[1].value}`} />

        {/* 설명 칸: 틀에 따라 배경이 없어서 옅은 판을 깔고 그 위에 쓴다 */}
        <Rect
          x={X(DESC.x) - 12}
          y={Y(spot.descY) - 26}
          width={DESC.w * kx + 24}
          height={desc.lines.length * descLine + 16}
          rx={12}
          fill="#fff"
          opacity={0.62}
        />
        {desc.lines.map((line, i) => (
          <T key={i} x={X(DESC.x)} y={Y(spot.descY) + i * descLine} fontSize={desc.size} children={line} />
        ))}

        {/* 아래: 그림에 굳어 있는 날짜를 덮고 이 기록의 날짜를 쓴다 */}
        <Rect x={X(foot.x0)} y={Y(foot.y0)} width={X(foot.x1) - X(foot.x0)} height={Y(foot.y1) - Y(foot.y0)} rx={(Y(foot.y1) - Y(foot.y0)) / 2} fill="#fff" />
        <T
          f="sansBold"
          x={(X(foot.x0) + X(foot.x1)) / 2}
          y={(Y(foot.y0) + Y(foot.y1)) / 2 + 5}
          fontSize={14}
          textAnchor="middle"
          children={`${BRAND.en} ★ ${r.date.replace(/-/g, '.')}`}
        />
      </G>
    </Svg>
  );
}
