// 인생네컷 유료 테마 "코코몬 카드": 네컷 사진 한 장을 수집 카드로 뽑는다
// 카드 틀은 design/tools/make_cards.js 가 만든 그림(assets/cards/*.jpg)을 그대로 쓰고,
// 사진과 글자만 그 위에 얹는다. 등급은 고를 수 없고 기록 id 로 정해진다 (열 때마다 바뀌지 않는다)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Path, Rect, Text } from 'react-native-svg';

import { coverRect } from '../lib/photoCrop';
import { seededRandom, withParticle } from '../lib/format';
import { fitLine, fitLines, measure } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { FourcutRecord, MonsterRank } from '../types';
import { Pin } from './FourcutCocochi';
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
export const MONSTER_RANKS: Record<MonsterRank, { name: string; tag: string; weight: number; frame: number; win: number; foot: { x: number; w: number; y: number } }> = {
  c: { name: '흔함', tag: 'C', weight: 40, frame: asset(require('../../assets/cards/C.jpg')), win: asset(require('../../assets/cards/win-C.png')), foot: { x: 354, w: 224, y: 740 } },
  b: { name: '보통', tag: 'B', weight: 28, frame: asset(require('../../assets/cards/B.jpg')), win: asset(require('../../assets/cards/win-B.png')), foot: { x: 311, w: 240, y: 734 } },
  a: { name: '좋음', tag: 'A', weight: 18, frame: asset(require('../../assets/cards/A.jpg')), win: asset(require('../../assets/cards/win-A.png')), foot: { x: 216, w: 200, y: 754 } },
  s: { name: '아주 좋음', tag: 'S', weight: 9, frame: asset(require('../../assets/cards/S.jpg')), win: asset(require('../../assets/cards/win-S.png')), foot: { x: 367, w: 206, y: 731 } },
  ss: { name: '최고', tag: 'SS', weight: 4, frame: asset(require('../../assets/cards/SS.jpg')), win: asset(require('../../assets/cards/win-SS.png')), foot: { x: 216, w: 182, y: 751 } },
  r: { name: '무지개', tag: 'R', weight: 1, frame: asset(require('../../assets/cards/R.jpg')), win: asset(require('../../assets/cards/win-R.png')), foot: { x: 213, w: 184, y: 748 } },
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
export function monsterOf(r: Pick<FourcutRecord, 'id' | 'monsterRank'>) {
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
  // 등급을 정해 뒀으면 그 등급으로 (능력치·운세는 그대로 id 로 뽑는다)
  if (r.monsterRank) rank = r.monsterRank;
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
  /** 틀에 설명 칸이 이미 그려져 있으면 우리 판을 겹쳐 그리지 않는다 */
  descPanel: boolean;
  foot: { x0: number; x1: number; y0: number; y1: number };
}

const SPOT: Record<MonsterRank, Spot> = {
  c: {
    crop: { x: 41, y: 34, w: 1004, h: 1381 },
    win: { x0: 118, x1: 972, topL: 210, notchFrom: 600, notchTo: 700, topR: 275, bottom: 905 },
    bar: { y: 1018, left: 375, right: 718 },
    descPanel: true,
    foot: { x0: 688, x1: 1017, y0: 1352, y1: 1395 },
  },
  b: {
    crop: { x: 57, y: 57, w: 972, h: 1355 },
    win: { x0: 140, x1: 945, topL: 290, notchFrom: 610, notchTo: 690, topR: 335, bottom: 915 },
    bar: { y: 1022, left: 375, right: 715 },
    descPanel: false,
    foot: { x0: 594, x1: 965, y0: 1337, y1: 1387 },
  },
  a: {
    crop: { x: 52, y: 0, w: 1027, h: 1448 },
    win: { x0: 100, x1: 1034, topL: 172, notchFrom: 610, notchTo: 700, topR: 258, bottom: 888 }, // 처음엔 좁게 재서 양옆에 흰 틈이 보였다 (2026-10-05 다시 잼)
    bar: { y: 1003, left: 390, right: 740 },
    descPanel: false,
    foot: { x0: 426, x1: 713, y0: 1380, y1: 1420 },
  },
  s: {
    crop: { x: 24, y: 0, w: 1039, h: 1442 },
    win: { x0: 120, x1: 970, topL: 275, notchFrom: 600, notchTo: 700, topR: 288, bottom: 865 },
    bar: { y: 988, left: 370, right: 715 },
    descPanel: false,
    foot: { x0: 690, x1: 1002, y0: 1331, y1: 1371 },
  },
  ss: {
    crop: { x: 0, y: 0, w: 1086, h: 1448 },
    win: { x0: 115, x1: 975, topL: 225, notchFrom: 610, notchTo: 700, topR: 305, bottom: 920 },
    bar: { y: 1025, left: 352, right: 730 },
    descPanel: true,
    foot: { x0: 408, x1: 680, y0: 1365, y1: 1407 },
  },
  r: {
    crop: { x: 0, y: 0, w: 1086, h: 1448 },
    win: { x0: 92, x1: 1000, topL: 215, notchFrom: 600, notchTo: 700, topR: 300, bottom: 905 }, // 왼쪽을 110 으로 재서 은색 테두리와 사진 사이에 바탕이 비쳤다 (2026-10-27 다시 잼)
    bar: { y: 1022, left: 358, right: 730 },
    descPanel: true,
    foot: { x0: 407, x1: 680, y0: 1359, y1: 1400 },
  },
};

/**
 * 사진 창 덮개(win-*.png)가 창보다 넓게 오려진 정도 (원본 px). design/tools/make_card_windows.js 의 PAD 와 같아야 한다.
 * 사진은 이 넓은 칸을 채우고 덮개 아래에 깔린다 — 창에 걸친 별·로고는 사진 위로, 테두리와 사진 사이 틈은 없게
 */
const WIN_PAD = 24;
const winBox = (win: Spot['win']) => ({ x: win.x0 - WIN_PAD, y: win.topL - WIN_PAD, w: win.x1 - win.x0 + WIN_PAD * 2, h: win.bottom - win.topL + WIN_PAD * 2 });
/** 설명 칸: 틀에 있는 칸을 덮고 어느 카드에서나 같은 크기로 (카드 좌표). 맨 윗줄에 제목, 그 아래 설명 */
const PANEL = { x: 30, y: 596, w: 548, h: 140, pad: 22, line: 25 };
/** 오늘의 운세 줄 (맨 아래): 각진 연두 판 위에 네잎클로버 + 흰 글씨 */
const LUCK = { h: 26, pad: 10, clover: 18, size: 14, fill: '#5fae2e' };
/** 아래 날짜 판 (카드 좌표, 모든 카드 공통) */
const FOOT = { w: 218, h: 32 };

/** 네잎클로버 (운세 줄 앞) */
const Clover = ({ x, y }: { x: number; y: number }) => (
  <G transform={`translate(${x} ${y}) rotate(45) scale(0.7)`}>
    <Path d="M0,0 Q4,5 2,10" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" fill="none" transform="rotate(-45)" />
    {[0, 90, 180, 270].map((a) => (
      <Path key={a} transform={`rotate(${a})`} d="M0,-0.8 C-1,-2.6 -5.4,-3.4 -4.6,-6.6 C-4,-9 -1,-8.8 0,-6.8 C1,-8.8 4,-9 4.6,-6.6 C5.4,-3.4 1,-2.6 0,-0.8 Z" fill="#fff" />
    ))}
  </G>
);

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

/**
 * 자르기 화면용: 사진 창의 세로/가로 비율. 등급은 저장할 때 뽑혀서 고를 때는 모르니
 * 여섯 등급 창의 평균으로 잡는다 (등급마다 조금씩 달라도 남는 쪽은 가운데 기준으로 잘린다)
 */
export const cocomonArtAspect = () => {
  const list = Object.values(SPOT).map(({ crop, win }) => {
    const box = winBox(win);
    return (box.h * PH) / crop.h / ((box.w * PW) / crop.w);
  });
  return list.reduce((a, b) => a + b, 0) / list.length;
};

export function layoutFourcutCard(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (connected: boolean) =>
  connected ? `M0,0 H${PW} V${PH} H0 Z` : `M16,0 H${PW - 16} Q${PW},0 ${PW},16 V${PH - 16} Q${PW},${PH} ${PW - 16},${PH} H16 Q0,${PH} 0,${PH - 16} V16 Q0,0 16,0 Z`;

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
  const box = winBox(win);
  const shape = cardPath(connected);
  const id = `cocomon-${r.id}`;
  const art = artOf(r);
  const title = fitLine(r.title.trim() || '이름 없는 하루', PANEL.w - PANEL.pad * 2, 20, 14, 'sansHeavy');
  const luck = fitLine(fortune, PANEL.w - PANEL.pad * 2 - LUCK.pad * 2 - LUCK.clover, LUCK.size, 11, 'sansBold');
  const luckW = measure(luck.text, luck.size, 'sansBold') + LUCK.pad * 2 + LUCK.clover;
  const diary = r.diary.trim();
  const desc = diary ? fitLines(diary, PANEL.w - PANEL.pad * 2, 16, 12, 2, 'sans') : { lines: [] as string[], size: 16 };
  // 날짜 판은 어느 카드에서나 같은 크기로, 카드 밖으로 나가지 않게 살짝 당긴다
  // 제목 · 일기 · 운세 덩어리를 칸 한가운데에 (일기 줄 수가 달라도 위아래 여백이 같게)
  const blockH = title.size + 8 + LUCK.h + (desc.lines.length ? 8 + desc.lines.length * PANEL.line : 0);
  const blockTop = PANEL.y + (PANEL.h - blockH) / 2;
  const titleY = blockTop + title.size * 0.84;
  // 순서: 제목 → 일기 → 맨 아래 운세
  const descTop = blockTop + title.size + 8 + PANEL.line * 0.72;
  const luckY = blockTop + blockH - LUCK.h;
  const footY = (Y(foot.y0) + Y(foot.y1)) / 2;
  const footX = Math.min(Math.max((X(foot.x0) + X(foot.x1)) / 2, FOOT.w / 2 + 18), PW - FOOT.w / 2 - 18);
  // 어디서·누구랑: 날짜 판 왼쪽에 같은 모양의 작은 판으로 (핀은 장소가 있을 때만)
  const where = [r.place.trim(), r.withWhom.trim() && `${withParticle(r.withWhom.trim())} 함께`].filter(Boolean).join(' · ');
  const pinW = r.place.trim() ? 16 : 0;
  const whereRight = footX - FOOT.w / 2 - 8;
  const whereText = where ? fitLine(where, whereRight - 18 - 28 - pinW, 14, 11, 'sansBold') : null;
  const whereW = whereText ? measure(whereText.text, whereText.size, 'sansBold') + 28 + pinW : 0;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-win`}>
            <Rect x={X(box.x)} y={Y(box.y)} width={box.w * kx} height={box.h * ky} />
          </ClipPath>
        </Defs>

        {/* 카드 틀 그림 (흰 여백을 뺀 자리가 카드 전체가 되게 늘린다) */}
        <G clipPath={`url(#${id}-card)`}>
          <Image href={info.frame} x={X(0)} y={Y(0)} width={SHEET.w * kx} height={SHEET.h * ky} preserveAspectRatio="none" />
        </G>

        {/* 사진: 창보다 조금 넓게 깔고, 창 자리만 뚫린 덮개를 위에 얹는다 */}
        {art && (
          <G>
            <Image
              href={{ uri: art.uri }}
              {...coverRect(art, { x: X(box.x), y: Y(box.y), width: box.w * kx, height: box.h * ky })}
              preserveAspectRatio="none"
              clipPath={`url(#${id}-win)`}
            />
            <Image href={info.win} x={X(box.x)} y={Y(box.y)} width={box.w * kx} height={box.h * ky} preserveAspectRatio="none" />
          </G>
        )}

        {/* 능력치 두 칸 */}
        <T f="sansHeavy" x={X(bar.left)} y={Y(bar.y)} fontSize={22} textAnchor="middle" children={`${stats[0].name} / ${stats[0].value}`} />
        <T f="sansHeavy" x={X(bar.right)} y={Y(bar.y)} fontSize={22} textAnchor="middle" children={`${stats[1].name} / ${stats[1].value}`} />

        {/* 설명 칸: 틀에 있는 칸을 덮고 여기에 글을 쓴다 (모든 카드 같은 크기) */}
        {!spot.descPanel && (
          <G>
            <Rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={14} fill="#fff" opacity={0.72} />
            <Rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={14} fill="none" stroke="#fff" strokeWidth={2} opacity={0.85} />
          </G>
        )}
        <T f="sansHeavy" x={PANEL.x + PANEL.w / 2} y={titleY} fontSize={title.size} textAnchor="middle" children={title.text} />
        <G transform={`translate(${PANEL.x + (PANEL.w - luckW) / 2} ${luckY})`}>
          <Rect width={luckW} height={LUCK.h} rx={2} fill={LUCK.fill} />
          <Clover x={LUCK.pad + 6} y={LUCK.h / 2} />
          <T f="sansBold" x={LUCK.pad + LUCK.clover} y={LUCK.h / 2 + luck.size * 0.36} fontSize={luck.size} fill="#fff" children={luck.text} />
        </G>
        {desc.lines.map((line, i) => (
          <T key={i} x={PANEL.x + PANEL.pad} y={descTop + i * PANEL.line} fontSize={desc.size} children={line} />
        ))}

        {/* 아래: 그림에 굳어 있는 날짜를 덮고 이 기록의 날짜를 쓴다 (판 크기는 카드마다 같게) */}
        <Rect x={footX - FOOT.w / 2} y={footY - FOOT.h / 2} width={FOOT.w} height={FOOT.h} rx={FOOT.h / 2} fill="#fff" />
        {whereText && (
          <G>
            <Rect x={whereRight - whereW} y={footY - FOOT.h / 2} width={whereW} height={FOOT.h} rx={FOOT.h / 2} fill="#fff" />
            {!!pinW && <Pin x={whereRight - whereW + 14} y={footY + 7} size={15} fill={INK} />}
            <T f="sansBold" x={whereRight - whereW + 14 + pinW} y={footY + 5} fontSize={whereText.size} children={whereText.text} />
          </G>
        )}
        <T f="sansBold" x={footX} y={footY + 5} fontSize={14} textAnchor="middle" children={`${BRAND.en} ★ ${r.date.replace(/-/g, '.')}`} />
      </G>
    </Svg>
  );
}
