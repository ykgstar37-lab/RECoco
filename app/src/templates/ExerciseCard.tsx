// 운동 (기록 카드): 진한 색 카드에 큰 숫자를 박은 스포츠 기록 카드
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { ExerciseRecord } from '../types';
import { EXERCISE_TYPES, ExerciseIcon, USES_DISTANCE } from './ExerciseSlip';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const M = 40;
const DARK = '#1b1d22';
const DIM = '#9a9ca6';
const LINE = '#33363f';

const STAT = 96; // 큰 숫자 칸 높이
const MOVE_ROW = 46;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill="#fff" fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: ExerciseRecord) {
  const t = EXERCISE_TYPES[r.type] ?? EXERCISE_TYPES.run;
  const far = USES_DISTANCE.includes(r.type) && r.distance > 0;
  const stats: [string, string][] = [
    far ? ['거리', `${r.distance}km`] : ['시간', `${r.minutes}분`],
    far ? ['시간', `${r.minutes}분`] : ['힘든 정도', `${r.effort}/5`],
    [far ? '페이스' : '장소', (far ? r.pace.trim() : r.place.trim()) || '—'],
  ];
  const photoH = r.photo ? Math.round(Math.min(320, Math.max(200, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const statTop = 238;
  const photoTop = statTop + STAT + 30;
  const moves = r.type === 'gym' ? r.moves.filter((m) => m.name.trim()).slice(0, 8) : [];
  const movesTop = photoTop + (photoH ? photoH + 30 : 0);
  const movesBot = movesTop + (moves.length ? moves.length * MOVE_ROW + 16 : 0);
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2, 26, 20, 3, 'hand') : null;
  const memoTop = movesBot + 34;
  const height = memoTop + (memo ? memo.lines.length * 36 + 14 : 0) + 86;
  return { t, far, stats, photoH, statTop, photoTop, moves, movesTop, movesBot, memo, memoTop, height };
}

export function layoutExerciseCard(r: ExerciseRecord): TemplateLayout {
  const { height, statTop } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: statTop + STAT + PAD, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (h: number, connected: boolean) => (connected ? `M0,0 H${PW} V${h} H0 Z` : `M18,0 H${PW - 18} Q${PW},0 ${PW},18 V${h - 18} Q${PW},${h} ${PW - 18},${h} H18 Q0,${h} 0,${h - 18} V18 Q0,0 18,0 Z`);

export function ExerciseCard({ record: r, width, connected = false }: { record: ExerciseRecord; width: number; connected?: boolean }) {
  const L = layoutExerciseCard(r);
  const { t, stats, photoH, statTop, photoTop, moves, movesTop, movesBot, memo, memoTop, height } = computeLayout(r);
  const shape = cardPath(height, connected);
  const id = `excard-${r.id}`;
  const place = fitLine(r.place.trim() || '어딘가', PW - M * 2 - 40, 22, 15, 'sansBold');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={10} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={DARK} />

        {/* 위쪽 색 띠 + 종류 */}
        <G clipPath={`url(#${id}-card)`}>
          <Rect x={0} y={0} width={PW} height={6} fill={t.accent} />
          <Path d={`M${PW - 190},0 L${PW},0 L${PW},150 Z`} fill={t.accent} opacity={0.14} />
        </G>
        <ExerciseIcon type={r.type} x={M} y={54} size={30} color={t.accent} />
        <T f="sansHeavy" x={M + 44} y={78} fontSize={28} children={t.label} />
        <T f="monoBold" x={PW - M} y={78} fontSize={13} letterSpacing={3} fill={DIM} textAnchor="end" children={dotDateWithDay(r.date).replace(/\(.\)/, '')} />
        <T f="sansBold" x={M} y={130} fontSize={place.size} fill={DIM} children={place.text} />
        <Line x1={M} y1={166} x2={PW - M} y2={166} stroke={LINE} strokeWidth={2} />
        <T f="monoBold" x={M} y={202} fontSize={13} letterSpacing={4} fill={t.accent} children="TODAY'S RECORD" />

        {/* 큰 숫자 세 칸 */}
        {stats.map(([k, v], i) => {
          const x = M + i * ((PW - M * 2) / 3);
          const value = fitLine(v, (PW - M * 2) / 3 - 14, 34, 18, 'sansHeavy');
          return (
            <G key={k}>
              <T f="mono" x={x} y={statTop + 18} fontSize={12} letterSpacing={2} fill={DIM} children={k} />
              <T f="sansHeavy" x={x} y={statTop + 60} fontSize={value.size} children={value.text} />
              {i > 0 && <Line x1={x - 16} y1={statTop - 2} x2={x - 16} y2={statTop + 72} stroke={LINE} strokeWidth={1.5} />}
            </G>
          );
        })}

        {/* 사진 */}
        {!!photoH && (
          <G>
            <Image href={{ uri: r.photo!.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={10} fill="none" stroke={LINE} strokeWidth={2} />
          </G>
        )}

        {/* 헬스 종목 */}
        {moves.map((m, i) => {
          const y = movesTop + i * MOVE_ROW;
          const name = fitLine(m.name.trim(), 240, 18, 14, 'sansBold');
          const detail = [m.weight > 0 && `${m.weight}kg`, m.reps > 0 && `${m.reps}회`, m.sets > 0 && `${m.sets}세트`].filter(Boolean).join(' · ');
          return (
            <G key={i}>
              <Rect x={M} y={y + 14} width={6} height={6} rx={3} fill={t.accent} />
              <T f="sansBold" x={M + 20} y={y + 24} fontSize={name.size} children={name.text} />
              <T f="mono" x={PW - M} y={y + 24} fontSize={15} fill={DIM} textAnchor="end" children={detail} />
            </G>
          );
        })}
        {!!moves.length && <Line x1={M} y1={movesBot} x2={PW - M} y2={movesBot} stroke={LINE} strokeWidth={1.5} />}

        {/* 한 줄 */}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={memoTop + 18 + i * 36} fontSize={memo.size} fill="#e7e8ec" children={line} />
        ))}
        <T f="mono" x={PW / 2} y={height - 34} fontSize={12} letterSpacing={4} fill={DIM} textAnchor="middle" children={`${BRAND.ko} · KEEP GOING`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
