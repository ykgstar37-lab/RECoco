// 인생네컷 유료 테마 "코코몬 카드": 네컷 사진 한 장을 수집용 카드로 뽑는다
// 등급은 고르는 게 아니라 뽑을 때 무작위로 정해진다 (기록 id 로 정해져서 열 때마다 바뀌지 않는다)
// 포켓몬 카드를 흉내 내지 않는다 — 능력치 대신 그날의 기록(함께한 사람·장소·일기)을 적는다
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
const M = 26; // 카드 테두리 두께
const INK = '#23212a';
const SUB = '#8b8794';
const SILVER = '#d8d5cf';

/** 속성 (등급이 낮을 때 테두리 색이 된다) */
const ELEMENTS = [
  { key: 'fire', name: '불꽃', band: '#e8623c', band2: '#f3a03c', inner: '#fdf1e8', ink: '#8c3418', shine: '#ffd9a8' },
  { key: 'water', name: '물결', band: '#3c86d8', band2: '#6fc7e8', inner: '#eaf4fd', ink: '#1d4f86', shine: '#bfe6ff' },
  { key: 'grass', name: '풀잎', band: '#41a05e', band2: '#8fd06a', inner: '#eefaef', ink: '#256036', shine: '#cdf0c8' },
  { key: 'night', name: '한밤', band: '#4b3f86', band2: '#8a6fd0', inner: '#f1eefb', ink: '#332a63', shine: '#d6c9ff' },
];

/** 그날 뽑히는 기술 이름과 운세 한 줄 */
const MOVES = [
  '웃음 폭발',
  '포즈 고민',
  '셔터 연타',
  '필름 감기',
  '우정 파워',
  '표정 관리 실패',
  '단체 점프',
  '눈 감기 신공',
  '브이 남발',
  '하이텐션',
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

/** 속성 심볼 (포켓몬 것이 아니라 레코코가 그린 그림) */
function EnergyMark({ kind, cx, cy, r, color }: { kind: string; cx: number; cy: number; r: number; color: string }) {
  const k = r / 10;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#fff" stroke={color} strokeWidth={1.6 * k} />
      {kind === 'fire' && <Path d={`M${cx},${cy - 6 * k} q4.5,4 3,7.5 q-1.2,2.8 -3,2.8 q-1.8,0 -3,-2.8 q-1.5,-3.5 3,-7.5 Z`} fill={color} />}
      {kind === 'water' && <Path d={`M${cx},${cy - 6 * k} q5,5.5 5,8.4 a5,5 0 0 1 -10,0 q0,-2.9 5,-8.4 Z`} fill={color} />}
      {kind === 'grass' && <Path d={`M${cx - 5 * k},${cy + 5 * k} q0,-9 10,-10 q1,9 -10,10 Z`} fill={color} />}
      {kind === 'night' && <Path d={`M${cx + 2 * k},${cy - 6 * k} a6.4,6.4 0 1 0 0,12 a5,5 0 1 1 0,-12 Z`} fill={color} />}
    </G>
  );
}

/**
 * 등급. weight 는 뽑힐 확률(합 100), stars 는 별 개수, shine 은 비스듬한 반짝임 진하기.
 * 흔할수록 수수하고 귀할수록 요란하게 — 포켓몬 카드의 C · R · RR · SR · UR(금색) · HR(무지개)을 참고했다
 */
export const MONSTER_RANKS: Record<MonsterRank, { name: string; tag: string; weight: number; stars: number; shine: number }> = {
  c: { name: '흔함', tag: 'C', weight: 40, stars: 1, shine: 0 },
  r: { name: '레어', tag: 'R', weight: 28, stars: 2, shine: 0.18 },
  rr: { name: '더블레어', tag: 'RR', weight: 18, stars: 3, shine: 0.34 },
  sr: { name: '슈퍼레어', tag: 'SR', weight: 9, stars: 4, shine: 0.5 },
  ur: { name: '골든', tag: 'UR', weight: 4, stars: 5, shine: 0.55 },
  hr: { name: '무지개', tag: 'HR', weight: 1, stars: 5, shine: 0.6 },
};

export const MONSTER_RANK_IDS = Object.keys(MONSTER_RANKS) as MonsterRank[];

const GRAY = { name: '무지', band: '#b9b6b0', band2: '#e6e3de', inner: '#fbfaf8', ink: '#6b6862', shine: '#ffffff' };
const GOLD = { name: '황금', band: '#d6a43a', band2: '#f5e3a4', inner: '#fdf8e9', ink: '#7d5a12', shine: '#fff3c4' };
const RAINBOW = ['#f08a8a', '#f5c77a', '#f2ef92', '#8fd6a0', '#7fc6ea', '#a99ae8'];

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
  const skin = rank === 'hr' ? { ...GOLD, name: '무지개' } : rank === 'ur' ? GOLD : rank === 'c' ? GRAY : element;
  // 귀한 카드일수록 행운 HP 가 높다
  const hp = (4 + info.stars * 3 + Math.floor(rnd() * 6)) * 10;
  const picked = [...MOVES];
  const moves = Array.from({ length: info.stars >= 3 ? 2 : 1 }, () => {
    const name = picked.splice(Math.floor(rnd() * picked.length), 1)[0];
    return { name, power: (2 + Math.floor(rnd() * 9)) * 10, cost: 1 + Math.floor(rnd() * 2) };
  });
  const fortune = FORTUNES[Math.floor(rnd() * FORTUNES.length)];
  return { rank, info, element, skin, hp, moves, fortune, no: String(1 + Math.floor(rnd() * 150)).padStart(3, '0') };
}

const ART_TOP = 146;
const ART_H = 272;
const NAME_LINE = 44;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

function computeLayout(r: FourcutRecord) {
  const { moves } = monsterOf(r);
  const name = fitLines(r.title.trim() || '이름 없는 하루', PW - M * 2 - 210, 34, 23, 2, 'sansHeavy');
  const movesTop = ART_TOP + ART_H + 58;
  const moveRow = 62;
  const fortuneTop = movesTop + moves.length * moveRow + 10;
  const diary = r.diary.trim() ? fitLines(r.diary.trim(), PW - M * 2 - 48, 21, 16, 2, 'hand') : null;
  const diaryTop = fortuneTop + 50;
  return { name, movesTop, moveRow, fortuneTop, diary, diaryTop };
}

export function layoutFourcutCard(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (connected: boolean) =>
  connected ? `M0,0 H${PW} V${PH} H0 Z` : `M22,0 H${PW - 22} Q${PW},0 ${PW},22 V${PH - 22} Q${PW},${PH} ${PW - 22},${PH} H22 Q0,${PH} 0,${PH - 22} V22 Q0,0 22,0 Z`;

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.44 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(' L')} Z`;
}

export function FourcutCard({ record: r, width, connected = false }: { record: FourcutRecord; width: number; connected?: boolean }) {
  const L = layoutFourcutCard(r);
  const { rank, info, element, skin, hp, moves, fortune, no } = monsterOf(r);
  const { name, movesTop, moveRow, fortuneTop, diary, diaryTop } = computeLayout(r);
  const shape = cardPath(connected);
  const id = `cocomon-${r.id}`;
  const art = artOf(r);
  const rainbow = rank === 'hr';
  const people = r.withWhom.trim() ? r.withWhom.trim().split(/[,·]/).filter(Boolean).length + 1 : 1;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-art`}>
            <Rect x={M + 16} y={ART_TOP} width={PW - (M + 16) * 2} height={ART_H} rx={8} />
          </ClipPath>
          <LinearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="1">
            {(rainbow ? RAINBOW : [skin.band, skin.band2, skin.band]).map((c, i, all) => (
              <Stop key={`${c}-${i}`} offset={`${i / (all.length - 1)}`} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>

        {/* 테두리 + 등급마다 다른 반짝임 */}
        <Path d={shape} fill={`url(#${id}-band)`} />
        {info.shine > 0 && (
          <G clipPath={`url(#${id}-card)`}>
            {[0, 1, 2, 3].map((i) => (
              <Path key={i} d={`M${-200 + i * 190},${PH} L${80 + i * 190},0 L${150 + i * 190},0 L${-130 + i * 190},${PH} Z`} fill={skin.shine} opacity={info.shine} />
            ))}
          </G>
        )}
        <Rect x={M} y={M} width={PW - M * 2} height={PH - M * 2} rx={10} fill={skin.inner} />

        {/* 머리: 이름 · 등급 딱지 · 별 */}
        <T f="sansHeavy" x={M + 22} y={M + 52} fontSize={name.size} children={name.lines[0]} />
        {name.lines[1] && <T f="sansHeavy" x={M + 22} y={M + 52 + NAME_LINE} fontSize={name.size} children={name.lines[1]} />}
        <T f="mono" x={PW - M - 92} y={M + 44} fontSize={15} letterSpacing={1} fill={SUB} textAnchor="end" children="행운 HP" />
        <T f="sansHeavy" x={PW - M - 24} y={M + 46} fontSize={34} fill={skin.ink} textAnchor="end" children={String(hp)} />
        <Rect x={PW - M - 88} y={M + 58} width={64} height={26} rx={13} fill={skin.band} />
        <T f="monoBold" x={PW - M - 56} y={M + 76} fontSize={14} letterSpacing={2} fill="#fff" textAnchor="middle" children={info.tag} />
        {Array.from({ length: info.stars }, (_, i) => (
          <Path key={i} d={starPath(PW - M - 34 - i * 24, M + 100, 9)} fill={skin.band} />
        ))}
        <T f="monoBold" x={M + 22} y={M + 86 + (name.lines[1] ? NAME_LINE : 0)} fontSize={13} letterSpacing={3} fill={SUB} children={`${dotDateWithDay(r.date)} · ${people}명`} />

        {/* 사진 창 */}
        <Rect x={M + 10} y={ART_TOP - 6} width={PW - (M + 10) * 2} height={ART_H + 12} rx={12} fill={SILVER} />
        {art ? (
          <Image href={{ uri: art.uri }} x={M + 16} y={ART_TOP} width={PW - (M + 16) * 2} height={ART_H} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-art)`} />
        ) : (
          <G>
            <Rect x={M + 16} y={ART_TOP} width={PW - (M + 16) * 2} height={ART_H} rx={8} fill="#ece9e2" />
            <Path
              d={`M${PW / 2 - 78},${ART_TOP + ART_H / 2 + 54} Q${PW / 2 - 92},${ART_TOP + ART_H / 2 - 36} ${PW / 2},${ART_TOP + ART_H / 2 - 44} Q${PW / 2 + 92},${ART_TOP + ART_H / 2 - 36} ${PW / 2 + 78},${ART_TOP + ART_H / 2 + 54} Z`}
              fill="#fff"
            />
            <Circle cx={PW / 2 - 24} cy={ART_TOP + ART_H / 2 + 6} r={5} fill="#c9c6c0" />
            <Circle cx={PW / 2 + 24} cy={ART_TOP + ART_H / 2 + 6} r={5} fill="#c9c6c0" />
            <Path d={`M${PW / 2 - 10},${ART_TOP + ART_H / 2 + 26} q10,9 20,0`} stroke="#c9c6c0" strokeWidth={3} fill="none" strokeLinecap="round" />
            <T f="mono" x={PW / 2} y={ART_TOP + ART_H - 26} fontSize={13} letterSpacing={3} fill={SUB} textAnchor="middle" children="PHOTO" />
          </G>
        )}
        <Rect x={M + 16} y={ART_TOP} width={PW - (M + 16) * 2} height={ART_H} rx={8} fill="none" stroke="#fff" strokeWidth={2} opacity={0.6} />

        {/* 사진 아래 띠: 속성 이름 */}
        <Rect x={M + 10} y={ART_TOP + ART_H + 18} width={PW - (M + 10) * 2} height={30} rx={15} fill={skin.band} opacity={0.16} />
        <Circle cx={M + 34} cy={ART_TOP + ART_H + 33} r={7} fill={skin.band} />
        <T f="monoBold" x={PW / 2} y={ART_TOP + ART_H + 39} fontSize={14} letterSpacing={5} fill={skin.ink} textAnchor="middle" children={`${element.name} · ${info.name}`} />

        {/* 오늘의 기술 (에너지 심볼 + 이름 + 위력) */}
        {moves.map((mv, i) => {
          const y = movesTop + i * moveRow;
          const nm = fitLine(mv.name, PW - M * 2 - 190, 24, 17, 'sansBold');
          return (
            <G key={mv.name}>
              {Array.from({ length: mv.cost }, (_, j) => (
                <EnergyMark key={j} kind={element.key} cx={M + 40 + j * 34} cy={y + 20} r={14} color={skin.band} />
              ))}
              <T f="sansBold" x={M + 28 + mv.cost * 34 + 14} y={y + 28} fontSize={nm.size} children={nm.text} />
              <T f="sansHeavy" x={PW - M - 24} y={y + 30} fontSize={30} fill={skin.ink} textAnchor="end" children={String(mv.power)} />
              <Path d={`M${M + 24},${y + 46} H${PW - M - 24}`} stroke={skin.band} strokeWidth={1.4} opacity={0.35} />
            </G>
          );
        })}

        {/* 오늘의 운세 */}
        <T f="monoBold" x={M + 24} y={fortuneTop + 18} fontSize={12} letterSpacing={3} fill={SUB} children="오늘의 운세" />
        <T x={M + 24} y={fortuneTop + 42} fontSize={fitLine(fortune, PW - M * 2 - 48, 17, 13, 'sans').size} children={fitLine(fortune, PW - M * 2 - 48, 17, 13, 'sans').text} />

        {/* 일기 */}
        {diary?.lines.map((line, i) => (
          <T key={i} f="hand" x={M + 24} y={diaryTop + 22 + i * 26} fontSize={diary.size} children={line} />
        ))}

        {/* 아래: 함께·어디 + 카드 번호 */}
        <T f="mono" x={M + 24} y={PH - M - 46} fontSize={13} letterSpacing={1} fill={SUB} children={`${r.withWhom.trim() || '혼자'} · ${r.place.trim() || '어딘가'}`} />
        <T f="mono" x={M + 24} y={PH - M - 22} fontSize={13} letterSpacing={2} fill={SUB} children={`NO. ${no}/150`} />
        <T f="mono" x={PW - M - 24} y={PH - M - 22} fontSize={13} letterSpacing={2} fill={SUB} textAnchor="end" children={`${BRAND.ko} COCOMON`} />

        <PaperOverlay id={id} d={shape} width={PW} height={PH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
