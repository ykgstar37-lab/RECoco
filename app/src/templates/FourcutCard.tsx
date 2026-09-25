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
const PH = 800;
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

/** 카드 틀 그림마다 다른 자리 (원본 1086×1448 에서 재서 600×800 으로 옮긴 값) */
const SPOT: Record<MonsterRank, { win: { x: number; y: number; w: number; h: number; notchFrom: number; notchTo: number; notchY: number }; bar: { y: number; left: number; right: number }; descY: number; foot: { x: number; w: number; y: number; h: number } }> = {
  c: { win: { x: 65.2, y: 116.0, w: 471.8, h: 384.0, notchFrom: 331.5, notchTo: 386.7, notchY: 151.9 }, bar: { y: 562.4, left: 207.2, right: 396.7 }, descY: 638.1, foot: { x: 379.0, w: 181.2, y: 762.4, h: 21.0 } },
  b: { win: { x: 77.3, y: 160.2, w: 444.8, h: 345.3, notchFrom: 337.0, notchTo: 381.2, notchY: 185.1 }, bar: { y: 564.6, left: 207.2, right: 395.0 }, descY: 635.4, foot: { x: 329.3, w: 203.3, y: 740.3, h: 23.2 } },
  a: { win: { x: 66.3, y: 95.0, w: 477.9, h: 395.6, notchFrom: 337.0, notchTo: 386.7, notchY: 142.5 }, bar: { y: 554.1, left: 215.5, right: 408.8 }, descY: 618.8, foot: { x: 235.4, w: 153.6, y: 763.5, h: 22.1 } },
  s: { win: { x: 66.3, y: 151.9, w: 469.6, h: 326.0, notchFrom: 331.5, notchTo: 386.7, notchY: 159.1 }, bar: { y: 545.9, left: 204.4, right: 395.0 }, descY: 618.8, foot: { x: 384.5, w: 168.0, y: 734.8, h: 22.1 } },
  ss: { win: { x: 63.5, y: 124.3, w: 475.1, h: 384.0, notchFrom: 337.0, notchTo: 386.7, notchY: 168.5 }, bar: { y: 566.3, left: 194.5, right: 403.3 }, descY: 651.9, foot: { x: 229.8, w: 149.2, y: 755.8, h: 21.0 } },
  r: { win: { x: 60.8, y: 118.8, w: 491.7, h: 381.2, notchFrom: 331.5, notchTo: 386.7, notchY: 165.7 }, bar: { y: 564.6, left: 197.8, right: 403.3 }, descY: 640.9, foot: { x: 229.8, w: 147.0, y: 754.7, h: 21.0 } },
};

const INSET = 5; // 사진을 창 안쪽으로 물리는 정도
const TITLE = { x: 351, y: 62, w: 214 };
const DESC = { x: 74, w: 452, line: 30 };
/** 사진 위에 다시 얹을 로고 자리 (틀 그림 x360 y798 w368 h134) */
const LOGO = { x: 199, y: 441, w: 203, h: 74 };

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

export function layoutFourcutCard(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (connected: boolean) =>
  connected ? `M0,0 H${PW} V${PH} H0 Z` : `M16,0 H${PW - 16} Q${PW},0 ${PW},16 V${PH - 16} Q${PW},${PH} ${PW - 16},${PH} H16 Q0,${PH} 0,${PH - 16} V16 Q0,0 16,0 Z`;

/** 사진이 들어갈 창 (오른쪽 위가 한 번 꺾인 모양) */
const windowPath = (win: (typeof SPOT)['c']['win']) => {
  // 은색 테두리를 덮지 않게 살짝 안쪽으로
  const x = win.x + INSET;
  const y = win.y + INSET;
  const w = win.w - INSET * 2;
  const h = win.h - INSET * 2;
  const { notchFrom, notchTo, notchY } = win;
  const r = 13;
  return (
    `M${x + r},${y} H${notchFrom} L${notchTo},${notchY} H${x + w - r} Q${x + w},${notchY} ${x + w},${notchY + r}` +
    ` V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r}` +
    ` V${y + r} Q${x},${y} ${x + r},${y} Z`
  );
};

export function FourcutCard({ record: r, width, connected = false }: { record: FourcutRecord; width: number; connected?: boolean }) {
  const L = layoutFourcutCard(r);
  const { rank, info, stats, fortune } = monsterOf(r);
  const shape = cardPath(connected);
  const id = `cocomon-${r.id}`;
  const art = artOf(r);
  const title = fitLine(r.title.trim() || '이름 없는 하루', TITLE.w, 22, 14, 'sansHeavy');
  const desc = fitLines(`${fortune} ${r.diary.trim()}`.trim(), DESC.w, 17, 13, 2, 'sans');
  const spot = SPOT[rank];
  const foot = spot.foot;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-win`}>
            <Path d={windowPath(spot.win)} />
          </ClipPath>
        </Defs>

        {/* 카드 틀 그림 */}
        <G clipPath={`url(#${id}-card)`}>
          <Image href={info.frame} x={0} y={0} width={PW} height={PH} preserveAspectRatio="xMidYMid slice" />
        </G>

        {/* 사진 (틀 위에 얹어 창을 채운다) */}
        {art && <Image href={{ uri: art.uri }} x={spot.win.x + INSET} y={spot.win.y + INSET} width={spot.win.w - INSET * 2} height={spot.win.h - INSET * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-win)`} />}

        {/* 사진에 가린 로고를 다시 얹는다 */}
        {art && <Image href={info.logo} x={LOGO.x} y={LOGO.y} width={LOGO.w} height={LOGO.h} preserveAspectRatio="xMidYMid meet" />}

        {/* 제목 */}
        <T f="sansHeavy" x={TITLE.x} y={TITLE.y} fontSize={title.size} textAnchor="middle" children={title.text} />

        {/* 능력치 두 칸 */}
        <T f="sansHeavy" x={spot.bar.left} y={spot.bar.y} fontSize={22} textAnchor="middle" children={`${stats[0].name} / ${stats[0].value}`} />
        <T f="sansHeavy" x={spot.bar.right} y={spot.bar.y} fontSize={22} textAnchor="middle" children={`${stats[1].name} / ${stats[1].value}`} />

        {/* 설명 칸: 틀에 따라 배경이 없어서 옅은 판을 깔고 그 위에 쓴다 */}
        <Rect x={DESC.x - 12} y={spot.descY - 26} width={DESC.w + 24} height={desc.lines.length * DESC.line + 16} rx={12} fill="#fff" opacity={0.62} />
        {desc.lines.map((line, i) => (
          <T key={i} x={DESC.x} y={spot.descY + i * DESC.line} fontSize={desc.size} children={line} />
        ))}

        {/* 아래: 그림에 굳어 있는 날짜를 덮고 이 기록의 날짜를 쓴다 */}
        <Rect x={foot.x} y={foot.y} width={foot.w} height={foot.h} rx={foot.h / 2} fill="#fff" />
        <T f="sansBold" x={foot.x + foot.w / 2} y={foot.y + foot.h / 2 + 5} fontSize={14} textAnchor="middle" children={`${BRAND.en} ★ ${r.date.replace(/-/g, '.')}`} />

      </G>
    </Svg>
  );
}
