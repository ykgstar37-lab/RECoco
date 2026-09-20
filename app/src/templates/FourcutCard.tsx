// 인생네컷 유료 테마 "코코몬 카드": 네컷 사진 한 장을 수집 카드로 뽑는다
// 등급은 고르는 게 아니라 뽑을 때 무작위로 정해진다 (기록 id 로 정해져서 열 때마다 바뀌지 않는다)
// 생김새: 속성 배경이 카드를 꽉 채우고, 은색 프레임 사진 · 은색 능력치 바 · 아래 설명 한 줄
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { FourcutRecord, MonsterRank } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PH = 800;
const PAD = 16;
const INK = '#1c1a22';
const SUB = '#6d6a75';

/** 속성: 카드 배경을 채우는 색과 무늬 */
const ELEMENTS = [
  { key: 'fire', name: '불꽃', top: '#ffd08a', bot: '#e04a20', mark: '#b8320f', ink: '#7a2a0c' },
  { key: 'water', name: '물결', top: '#bfe9ff', bot: '#3f9fe0', mark: '#2c7fc0', ink: '#14507f' },
  { key: 'grass', name: '풀잎', top: '#e4f7c4', bot: '#6cc158', mark: '#4fa33f', ink: '#255c1d' },
  { key: 'night', name: '한밤', top: '#9f92e8', bot: '#3b2f76', mark: '#2a2159', ink: '#241b52' },
];

/** 등급 (합 100). 귀할수록 별이 많고 배경이 화려하다 */
export const MONSTER_RANKS: Record<MonsterRank, { name: string; tag: string; weight: number; stars: number }> = {
  c: { name: '흔함', tag: 'N', weight: 40, stars: 1 },
  r: { name: '레어', tag: 'R', weight: 28, stars: 2 },
  rr: { name: '더블레어', tag: 'RR', weight: 18, stars: 3 },
  sr: { name: '슈퍼레어', tag: 'SR', weight: 9, stars: 4 },
  ur: { name: '골든', tag: 'UR', weight: 4, stars: 5 },
  hr: { name: '무지개', tag: 'HR', weight: 1, stars: 5 },
};

export const MONSTER_RANK_IDS = Object.keys(MONSTER_RANKS) as MonsterRank[];

const GOLD = { key: 'gold', name: '황금', top: '#fff2b8', bot: '#d9a32c', mark: '#b7841a', ink: '#6f5210' };
const RAINBOW = ['#ffd3e2', '#ffe9c0', '#f6f7bb', '#c8f0cf', '#c3e6ff', '#dcd0ff'];

const MOVES = ['웃음 폭발', '포즈 고민', '셔터 연타', '필름 감기', '우정 파워', '표정 관리 실패', '단체 점프', '눈 감기 신공', '브이 남발', '하이텐션'];

const FORTUNES = [
  '오늘 찍은 사진은 유난히 잘 나온다.',
  '한 장은 반드시 흔들린다. 그게 제일 웃기다.',
  '같이 찍은 사람과 더 친해진다.',
  '지갑 속에 한 장 넣어두면 좋은 일이 생긴다.',
  '다음에도 같은 자리에서 찍고 싶어진다.',
  '이 날의 표정을 오래 기억하게 된다.',
  '누군가 이 사진을 보고 웃는다.',
];

/** 기록 하나가 어떤 등급·속성으로 뽑혔는지 (id 로 정해진다) */
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
  const element = ELEMENTS[Math.floor(rnd() * ELEMENTS.length)];
  const info = MONSTER_RANKS[rank];
  const skin = rank === 'ur' || rank === 'hr' ? GOLD : element;
  // 귀한 카드일수록 행운이 높다
  const luck = (4 + info.stars * 3 + Math.floor(rnd() * 6)) * 10;
  const power = (2 + Math.floor(rnd() * 9)) * 10;
  const move = MOVES[Math.floor(rnd() * MOVES.length)];
  const fortune = FORTUNES[Math.floor(rnd() * FORTUNES.length)];
  return { rank, info, element, skin, luck, power, move, fortune, no: String(1 + Math.floor(rnd() * 150)).padStart(3, '0') };
}

// 자리
const ART_X = 34;
const ART_Y = 112;
const ART_W = PW - ART_X * 2;
const ART_H = 396;
const BAR_Y = 536;
const BAR_H = 46;
const DESC_Y = 614;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

export function layoutFourcutCard(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (connected: boolean) =>
  connected ? `M0,0 H${PW} V${PH} H0 Z` : `M18,0 H${PW - 18} Q${PW},0 ${PW},18 V${PH - 18} Q${PW},${PH} ${PW - 18},${PH} H18 Q0,${PH} 0,${PH - 18} V18 Q0,0 18,0 Z`;

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.44 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** 속성마다 다른 배경 무늬 (불꽃은 넘실대는 불, 물결은 물살, 나머지는 별) */
function Pattern({ kind, color, seed }: { kind: string; color: string; seed: string }) {
  const rnd = seededRandom(seed);
  if (kind === 'fire')
    return (
      <G opacity={0.5}>
        {Array.from({ length: 14 }, (_, i) => {
          const x = 20 + rnd() * (PW - 40);
          const y = 60 + rnd() * (PH - 100);
          const h = 60 + rnd() * 90;
          return <Path key={i} d={`M${x},${y} q${h * 0.38},${-h * 0.42} ${h * 0.18},${-h} q${h * 0.52},${h * 0.32} ${-h * 0.18},${h} Z`} fill={color} opacity={0.5} />;
        })}
      </G>
    );
  if (kind === 'water')
    return (
      <G opacity={0.4}>
        {Array.from({ length: 9 }, (_, i) => (
          <Path key={i} d={`M0,${70 + i * 82} q70,-26 140,0 t140,0 t140,0 t140,0`} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.45} />
        ))}
      </G>
    );
  return (
    <G opacity={0.45}>
      {Array.from({ length: 22 }, (_, i) => {
        const x = 18 + rnd() * (PW - 36);
        const y = 30 + rnd() * (PH - 60);
        return <Path key={i} d={starPath(x, y, 10 + rnd() * 16)} fill={color} opacity={0.5} />;
      })}
    </G>
  );
}

export function FourcutCard({ record: r, width, connected = false }: { record: FourcutRecord; width: number; connected?: boolean }) {
  const L = layoutFourcutCard(r);
  const { rank, info, skin, luck, power, move, fortune, no } = monsterOf(r);
  const shape = cardPath(connected);
  const id = `cocomon-${r.id}`;
  const art = artOf(r);
  const rainbow = rank === 'hr';
  const title = fitLine(r.title.trim() || '이름 없는 하루', 250, 27, 17, 'sansHeavy');
  const desc = fitLines(`${fortune} ${r.diary.trim()}`.trim(), PW - 100, 19, 15, 3, 'sans');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-art`}>
            <Rect x={ART_X + 12} y={ART_Y + 12} width={ART_W - 24} height={ART_H - 24} rx={10} />
          </ClipPath>
          <LinearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.35" y2="1">
            {(rainbow ? RAINBOW : [skin.top, skin.bot]).map((c, i, all) => (
              <Stop key={`${c}-${i}`} offset={`${i / (all.length - 1)}`} stopColor={c} />
            ))}
          </LinearGradient>
          <LinearGradient id={`${id}-silver`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fdfdfd" />
            <Stop offset="0.45" stopColor="#dedede" />
            <Stop offset="0.55" stopColor="#b6b6b8" />
            <Stop offset="1" stopColor="#efefef" />
          </LinearGradient>
        </Defs>

        {/* 배경: 속성 색 + 무늬 */}
        <Path d={shape} fill={`url(#${id}-bg)`} />
        <G clipPath={`url(#${id}-card)`}>
          <Pattern kind={rainbow ? 'star' : skin.key} color={rainbow ? '#ffffff' : skin.mark} seed={`${r.id}-bg`} />
        </G>

        {/* 왼쪽 위 배지 */}
        <Rect x={22} y={20} width={132} height={38} rx={19} fill="#fff" opacity={0.92} />
        <Circle cx={44} cy={39} r={11} fill="none" stroke={INK} strokeWidth={2} />
        <Circle cx={44} cy={35} r={3.4} fill={INK} />
        <Path d="M38,46 q6,-7 12,0 Z" fill={INK} />
        <T f="sansBold" x={60} y={35} fontSize={11} fill={INK} children={BRAND.ko} />
        <T f="mono" x={60} y={49} fontSize={10} letterSpacing={1} fill={SUB} children="PHOTO CARD" />

        {/* 가운데 이름 */}
        <T f="sansHeavy" x={PW / 2} y={46} fontSize={title.size} textAnchor="middle" children={title.text} />

        {/* 오른쪽 위 등급 + 별 */}
        <T f="sansHeavy" x={PW - 30} y={52} fontSize={38} fill={skin.ink} textAnchor="end" children={info.tag} />
        {Array.from({ length: info.stars }, (_, i) => (
          <Path key={i} d={starPath(PW - 36 - i * 28, 80, 11)} fill="#ffd54a" stroke={skin.ink} strokeWidth={1.4} strokeLinejoin="round" />
        ))}

        {/* 은색 프레임 사진 */}
        <Rect x={ART_X} y={ART_Y} width={ART_W} height={ART_H} rx={18} fill={`url(#${id}-silver)`} />
        <Rect x={ART_X + 8} y={ART_Y + 8} width={ART_W - 16} height={ART_H - 16} rx={12} fill="#fff" />
        {art ? (
          <Image href={{ uri: art.uri }} x={ART_X + 12} y={ART_Y + 12} width={ART_W - 24} height={ART_H - 24} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-art)`} />
        ) : (
          <G>
            <Rect x={ART_X + 12} y={ART_Y + 12} width={ART_W - 24} height={ART_H - 24} rx={10} fill="#f1efe9" />
            <T f="mono" x={PW / 2} y={ART_Y + ART_H / 2} fontSize={14} letterSpacing={4} fill="#b6b3ad" textAnchor="middle" children="PHOTO" />
          </G>
        )}

        {/* 사진 아래에 겹치는 로고 */}
        <Rect x={PW / 2 - 92} y={ART_Y + ART_H - 46} width={184} height={34} rx={17} fill="#fff" opacity={0.92} />
        <T f="sansHeavy" x={PW / 2} y={ART_Y + ART_H - 22} fontSize={20} fill={skin.ink} textAnchor="middle" letterSpacing={2} children="COCOMON" />

        {/* 은색 능력치 바 */}
        <Rect x={46} y={BAR_Y} width={PW - 92} height={BAR_H} rx={BAR_H / 2} fill={`url(#${id}-silver)`} />
        <Rect x={50} y={BAR_Y + 4} width={PW - 100} height={BAR_H - 8} rx={(BAR_H - 8) / 2} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.7} />
        <T f="sansHeavy" x={PW / 2 - 66} y={BAR_Y + 31} fontSize={21} textAnchor="middle" children={`행운 / ${luck}`} />
        <T f="sansHeavy" x={PW / 2 + 74} y={BAR_Y + 31} fontSize={21} textAnchor="middle" children={`기운 / ${power}`} />

        {/* 오늘의 기술 + 설명 */}
        <T f="sansBold" x={44} y={DESC_Y - 14} fontSize={17} fill={skin.ink} children={`${move}!`} />
        {desc.lines.map((line, i) => (
          <T key={i} x={44} y={DESC_Y + 16 + i * 26} fontSize={desc.size} children={line} />
        ))}

        {/* 아래 브랜드 줄 */}
        <T f="mono" x={PW / 2} y={PH - 30} fontSize={12} letterSpacing={1} fill={skin.ink} textAnchor="middle" children={`${BRAND.ko} ★ ${dotDateWithDay(r.date)} · NO.${no}`} />

        <PaperOverlay id={id} d={shape} width={PW} height={PH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
