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
  { name: '불꽃', band: '#e8623c', band2: '#f3a03c', inner: '#fdf1e8', ink: '#8c3418', shine: '#ffd9a8' },
  { name: '물결', band: '#3c86d8', band2: '#6fc7e8', inner: '#eaf4fd', ink: '#1d4f86', shine: '#bfe6ff' },
  { name: '풀잎', band: '#41a05e', band2: '#8fd06a', inner: '#eefaef', ink: '#256036', shine: '#cdf0c8' },
  { name: '한밤', band: '#4b3f86', band2: '#8a6fd0', inner: '#f1eefb', ink: '#332a63', shine: '#d6c9ff' },
];

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
  return { rank, info, element, skin, no: String(1 + Math.floor(rnd() * 150)).padStart(3, '0') };
}

const ART_TOP = 150;
const ART_H = 360;
const NAME_LINE = 44;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 카드에 쓸 그림: 고른 사진이 있으면 첫 장, 없으면 QR로 받은 네컷 전체 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

function computeLayout(r: FourcutRecord) {
  const name = fitLines(r.title.trim() || '이름 없는 하루', PW - M * 2 - 190, 36, 24, 2, 'sansHeavy');
  const rows: [string, string][] = [
    ['함께', r.withWhom.trim() || '혼자'],
    ['어디', r.place.trim() || '어딘가'],
  ];
  const rowsTop = ART_TOP + ART_H + 68;
  const diary = r.diary.trim() ? fitLines(r.diary.trim(), PW - M * 2 - 48, 23, 17, 2, 'hand') : null;
  const diaryTop = rowsTop + rows.length * 46 + 4;
  return { name, rows, rowsTop, diary, diaryTop };
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
  const { rank, info, element, skin, no } = monsterOf(r);
  const { name, rows, rowsTop, diary, diaryTop } = computeLayout(r);
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
        <Rect x={PW - M - 88} y={M + 20} width={64} height={30} rx={15} fill={skin.band} />
        <T f="monoBold" x={PW - M - 56} y={M + 41} fontSize={15} letterSpacing={2} fill="#fff" textAnchor="middle" children={info.tag} />
        {Array.from({ length: info.stars }, (_, i) => (
          <Path key={i} d={starPath(PW - M - 34 - i * 26, M + 70, 10)} fill={skin.band} />
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

        {/* 그날의 기록 */}
        {rows.map(([k, v], i) => {
          const y = rowsTop + i * 46;
          const value = fitLine(v, PW - M * 2 - 130, 22, 15, 'sansBold');
          return (
            <G key={k}>
              <T f="sansBold" x={M + 24} y={y + 24} fontSize={16} fill={skin.ink} children={k} />
              <T f="sansBold" x={PW - M - 24} y={y + 24} fontSize={value.size} textAnchor="end" children={value.text} />
              <Path d={`M${M + 24},${y + 38} H${PW - M - 24}`} stroke={skin.band} strokeWidth={1.4} opacity={0.35} />
            </G>
          );
        })}

        {/* 일기 */}
        {diary?.lines.map((line, i) => (
          <T key={i} f="hand" x={M + 24} y={diaryTop + 22 + i * 30} fontSize={diary.size} children={line} />
        ))}

        {/* 아래: 카드 번호 */}
        <T f="mono" x={M + 24} y={PH - M - 22} fontSize={13} letterSpacing={2} fill={SUB} children={`NO. ${no}/150`} />
        <T f="mono" x={PW - M - 24} y={PH - M - 22} fontSize={13} letterSpacing={2} fill={SUB} textAnchor="end" children={`${BRAND.ko} COCOMON`} />

        <PaperOverlay id={id} d={shape} width={PW} height={PH} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
