// 운동 (사진 위 기록, 무료 기본 모양 `design: 'card'`): 사용자 사진을 배경으로 꽉 깔고 그 위에 기록을 띄운다.
// 러닝 앱 공유 화면처럼 오른쪽 위에 제목·큰 거리 숫자·작은 기록 칸, 아래에 장소·한 줄.
// 글자가 사진에 묻히지 않게 오른쪽과 아래에 옅은 검은 그늘을 깐다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { pad2, parseDate } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { ExerciseRecord } from '../types';
import { EXERCISE_TYPES, ExerciseIcon, USES_DISTANCE } from './ExerciseSlip';
import { PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const COL = 268; // 오른쪽 기록 칸이 시작하는 자리
const RIGHT = PW - 34;
const PALE = 'rgba(255,255,255,0.74)';

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill="#fff" fontFamily={FONTS[f]} {...p} />;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 07:10 → 아침, 20:43 → 저녁 */
function partOfDay(time: string) {
  const h = Number(time.split(':')[0]);
  if (!Number.isFinite(h)) return '';
  return h < 5 ? '새벽' : h < 11 ? '아침' : h < 14 ? '점심' : h < 18 ? '오후' : h < 22 ? '저녁' : '밤';
}

/** 20:43 → 오후 8:43 */
function clock(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad2(m)}`;
}

/** 42분 → 42:00, 65분 → 1:05:00 (러닝 앱처럼 시계 모양) */
const duration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}:${pad2(min % 60)}:00` : `${min}:00`);

function computeLayout(r: ExerciseRecord) {
  const ratio = r.photo ? r.photo.height / Math.max(1, r.photo.width) : 1.25;
  const height = Math.round(PW * Math.min(1.45, Math.max(1.12, ratio)));
  return { height };
}

export function layoutExercisePhoto(r: ExerciseRecord): TemplateLayout {
  const { height } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (h: number, connected: boolean) =>
  connected ? `M0,0 H${PW} V${h} H0 Z` : `M22,0 H${PW - 22} Q${PW},0 ${PW},22 V${h - 22} Q${PW},${h} ${PW - 22},${h} H22 Q0,${h} 0,${h - 22} V22 Q0,0 22,0 Z`;

export function ExercisePhoto({ record: r, width, connected = false }: { record: ExerciseRecord; width: number; connected?: boolean }) {
  const L = layoutExercisePhoto(r);
  const { height } = computeLayout(r);
  const shape = cardPath(height, connected);
  const id = `exphoto-${r.id}`;
  const t = EXERCISE_TYPES[r.type] ?? EXERCISE_TYPES.run;
  const far = USES_DISTANCE.includes(r.type) && r.distance > 0;
  const day = DAYS[parseDate(r.date).getDay()];
  const d = parseDate(r.date);

  // 큰 숫자: 거리가 있으면 거리, 아니면 운동한 시간
  const big = far ? r.distance.toFixed(2) : String(r.minutes || 0);
  const unit = far ? '킬로미터' : '분';
  const bigFit = fitLine(big, RIGHT - COL, 84, 48, 'sansHeavy');

  const moves = r.type === 'gym' ? r.moves.filter((m) => m.name.trim()) : [];
  const stats: [string, string][] = [];
  if (far) {
    if (r.type === 'run' && r.pace.trim()) stats.push([r.pace.trim(), '평균 페이스']);
    if (r.minutes > 0) stats.push([duration(r.minutes), '시간']);
  } else if (moves.length) {
    stats.push([`${moves.length}개`, '종목']);
    const sets = moves.reduce((n, m) => n + (m.sets || 0), 0);
    if (sets) stats.push([`${sets}`, '세트']);
  }
  if (r.effort > 0) stats.push([`${r.effort}/5`, '힘든 정도']);
  const cellW = (RIGHT - COL) / 3;

  const title = fitLine(`${day}요일 ${partOfDay(r.time)} ${t.label}`.replace(/\s+/g, ' '), RIGHT - COL, 23, 16, 'sansBold');
  const when = [`${d.getMonth() + 1}월 ${d.getDate()}일`, clock(r.time)].filter(Boolean).join(' · ');

  // 헬스 종목은 기록 칸 아래 오른쪽에 작게
  const movesTop = stats.length > 3 ? 450 : 376;
  const shownMoves = moves.slice(0, Math.max(0, Math.floor((height - 110 - movesTop) / 30)));

  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - 80, 30, 22, 2, 'hand') : null;
  const place = r.place.trim() ? fitLine(r.place.trim(), PW - 120, 17, 13, 'sansBold') : null;
  const memoTop = height - 46 - (memo ? (memo.lines.length - 1) * 36 : 0);
  const placeY = memo ? memoTop - 42 : height - 46;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} strength={1.4} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <LinearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0.3" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.42} />
          </LinearGradient>
          <LinearGradient id={`${id}-foot`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.55} />
          </LinearGradient>
          <LinearGradient id={`${id}-empty`} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={t.card} />
            <Stop offset="1" stopColor="#15171b" />
          </LinearGradient>
        </Defs>

        <G clipPath={`url(#${id}-card)`}>
          {r.photo ? (
            <Image href={{ uri: r.photo.uri }} x={0} y={0} width={PW} height={height} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <G>
              {/* 사진이 없으면 종류 색 그러데이션 + 큰 그림 */}
              <Rect x={0} y={0} width={PW} height={height} fill={`url(#${id}-empty)`} />
              <G opacity={0.16}>
                <ExerciseIcon type={r.type} x={20} y={height * 0.3} size={260} color="#fff" />
              </G>
            </G>
          )}
          <Rect x={0} y={0} width={PW} height={height} fill={`url(#${id}-side)`} />
          <Rect x={0} y={height * 0.62} width={PW} height={height * 0.38} fill={`url(#${id}-foot)`} />
        </G>

        {/* 오른쪽 위: 언제 · 제목 · 큰 숫자 · 기록 칸 */}
        <T x={COL} y={64} fontSize={15} fill={PALE} children={when} />
        <T f="sansBold" x={COL} y={98} fontSize={title.size} children={title.text} />
        <T f="sansHeavy" x={COL - 3} y={196} fontSize={bigFit.size} fontStyle="italic" children={bigFit.text} />
        <T x={COL} y={228} fontSize={15} fill={PALE} children={unit} />

        {stats.slice(0, 3).map(([v, k], i) => {
          const x = COL + i * cellW;
          const value = fitLine(v, cellW - 14, 24, 15, 'sansBold');
          return (
            <G key={k}>
              <T f="sansBold" x={x} y={300} fontSize={value.size} children={value.text} />
              <T x={x} y={324} fontSize={13} fill={PALE} children={k} />
            </G>
          );
        })}
        {stats.length > 3 && (
          <G>
            <T f="sansBold" x={COL} y={380} fontSize={26} children={stats[3][0]} />
            <T x={COL} y={404} fontSize={13} fill={PALE} children={stats[3][1]} />
          </G>
        )}

        {shownMoves.map((m, i) => {
          const y = movesTop + i * 30;
          const name = fitLine(m.name.trim(), 112, 16, 12, 'sansBold');
          const detail = [m.weight > 0 && `${m.weight}kg`, m.reps > 0 && `${m.reps}회`, m.sets > 0 && `${m.sets}세트`].filter(Boolean).join(' · ');
          return (
            <G key={i}>
              <T f="sansBold" x={COL} y={y} fontSize={name.size} children={name.text} />
              <T x={RIGHT} y={y} fontSize={13} fill={PALE} textAnchor="end" children={detail} />
            </G>
          );
        })}

        {/* 아래: 장소 · 한 줄 */}
        {place && (
          <G>
            {/* 핀 (이모지는 종이 글꼴에 없어서 그린다) */}
            <G transform={`translate(34 ${placeY - 16}) scale(${12 / 24} ${17 / 32})`}>
              <Path d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 32 12 32 C12 32 24 21 24 12 C24 5.4 18.6 0 12 0 Z" fill={PALE} />
              <Circle cx={12} cy={12} r={4.6} fill="#000" opacity={0.35} />
            </G>
            <T f="sansBold" x={54} y={placeY} fontSize={place.size} fill={PALE} children={place.text} />
          </G>
        )}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={34} y={memoTop + i * 36} fontSize={memo.size} children={line} />
        ))}
        <T f="monoBold" x={RIGHT} y={height - 24} fontSize={11} letterSpacing={3} fill={PALE} textAnchor="end" children={BRAND.en.toUpperCase()} />
      </G>
    </Svg>
  );
}
