// 운동 (기록표): 흰 영수증에 큰 기록 숫자 + 종류별 칸 (러닝은 거리·페이스, 헬스는 종목별 세트)
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { ExerciseRecord, ExerciseType } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const M = 40;
const PAPER = '#fcfbf8';
const INK = '#23252b';
const SUB = '#8d8f98';
const LINE = '#e5e5e6';

/** 종류마다 이름·포인트 색·큰 숫자로 뭘 보여줄지 */
export const EXERCISE_TYPES: Record<ExerciseType, { label: string; accent: string; card: string; deep: string }> = {
  run: { label: '러닝', accent: '#2f9e6a', card: '#2f9e6a', deep: '#22794f' },
  gym: { label: '헬스', accent: '#e06b3c', card: '#e06b3c', deep: '#b7502a' },
  yoga: { label: '요가', accent: '#9b6ed6', card: '#9b6ed6', deep: '#7a51b0' },
  hike: { label: '등산', accent: '#3f7f4c', card: '#3f7f4c', deep: '#2e6239' },
  swim: { label: '수영', accent: '#2f7fc4', card: '#2f7fc4', deep: '#23639b' },
};

/** 거리를 쓰는 종류 (헬스·요가는 종목·시간만) */
export const USES_DISTANCE: ExerciseType[] = ['run', 'hike', 'swim'];

const ROW = 56;
const MOVE_ROW = 50;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/**
 * 종류 그림. 24×24 칸 안에서 위아래·좌우 가운데에 오도록 그린다
 * (x, y 는 칸의 왼쪽 위, size 는 한 변). 얇은 선이 아니라 굵은 픽토그램으로 그린다
 */
export function ExerciseIcon({ type, x, y, size, color }: { type: ExerciseType; x: number; y: number; size: number; color: string }) {
  const s = size / 24;
  const at = (dx: number, dy: number) => `${(x + dx * s).toFixed(1)},${(y + dy * s).toFixed(1)}`;
  /** 굵은 팔다리 (둥근 끝) */
  const limb = (d: string, w: number) => <Path d={d} stroke={color} strokeWidth={w * s} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  /** 꽉 채운 덩어리 */
  const solid = (d: string) => <Path d={d} fill={color} />;
  const dot = (dx: number, dy: number, r: number) => <Circle cx={x + dx * s} cy={y + dy * s} r={r * s} fill={color} />;

  if (type === 'gym')
    // 아령: 봉 + 안쪽 원판 + 바깥 원판
    return (
      <G>
        {limb(`M${at(8, 12)} L${at(16, 12)}`, 2.8)}
        {limb(`M${at(6.5, 6.5)} L${at(6.5, 17.5)}`, 4)}
        {limb(`M${at(17.5, 6.5)} L${at(17.5, 17.5)}`, 4)}
        {limb(`M${at(3.4, 9.2)} L${at(3.4, 14.8)}`, 3)}
        {limb(`M${at(20.6, 9.2)} L${at(20.6, 14.8)}`, 3)}
      </G>
    );

  if (type === 'yoga')
    // 가부좌: 머리 · 굵은 몸통 · 무릎에 얹은 팔 · 아래로 넓게 퍼진 다리
    return (
      <G>
        {dot(12, 5.4, 3)}
        {solid(`M${at(4.4, 18.4)} Q${at(12, 13.6)} ${at(19.6, 18.4)} Q${at(12, 22)} ${at(4.4, 18.4)} Z`)}
        {limb(`M${at(12, 10)} L${at(12, 15.4)}`, 6)}
        {limb(`M${at(10.6, 11)} L${at(6.8, 15.4)}`, 3.4)}
        {limb(`M${at(13.4, 11)} L${at(17.2, 15.4)}`, 3.4)}
      </G>
    );

  if (type === 'hike')
    // 산 두 봉우리 (채운 산 + 흰 눈금)
    return (
      <G>
        {solid(`M${at(1.8, 19.6)} L${at(9, 5.2)} L${at(13.6, 12.4)} L${at(16.2, 8.6)} L${at(22.2, 19.6)} Z`)}
      </G>
    );

  if (type === 'swim')
    // 자유형: 물 위로 굽어 올라간 팔 · 머리 · 몸통 · 물결 두 줄
    return (
      <G>
        {dot(17.2, 11.2, 2.9)}
        {limb(`M${at(3.6, 14.6)} L${at(13.6, 12.4)}`, 3.6)}
        {limb(`M${at(12.4, 10.4)} L${at(7, 5)} L${at(12.6, 3.2)}`, 3.2)}
        {limb(`M${at(2.6, 17.6)} q${(3.2 * s).toFixed(1)},${(-2.8 * s).toFixed(1)} ${(6.4 * s).toFixed(1)},0 t${(6.4 * s).toFixed(1)},0 t${(6.4 * s).toFixed(1)},0`, 2.4)}
        {limb(`M${at(2.6, 21.2)} q${(3.2 * s).toFixed(1)},${(-2.8 * s).toFixed(1)} ${(6.4 * s).toFixed(1)},0 t${(6.4 * s).toFixed(1)},0 t${(6.4 * s).toFixed(1)},0`, 2.4)}
      </G>
    );

  // 러닝: 앞으로 기울여 달리는 사람
  return (
    <G>
      {dot(16, 4.8, 3)}
      {limb(`M${at(14.6, 8.4)} L${at(10.4, 14.4)}`, 4.8)}
      {limb(`M${at(13.6, 9.6)} L${at(8.6, 8.4)} L${at(6.6, 11.8)}`, 3.4)}
      {limb(`M${at(14.4, 10.4)} L${at(18.8, 12.8)}`, 3.4)}
      {limb(`M${at(10.4, 14.4)} L${at(14, 17.2)} L${at(12.4, 21.2)}`, 3.8)}
      {limb(`M${at(10.4, 14.4)} L${at(6, 16.8)} L${at(3.4, 20.8)}`, 3.8)}
    </G>
  );
}

function computeLayout(r: ExerciseRecord) {
  const t = EXERCISE_TYPES[r.type] ?? EXERCISE_TYPES.run;
  const far = USES_DISTANCE.includes(r.type) && r.distance > 0;
  const photoH = r.photo ? Math.round(Math.min(340, Math.max(220, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const bigTop = 176; // 큰 숫자 줄
  const photoTop = bigTop + 132;
  const rowsTop = photoTop + (photoH ? photoH + 30 : 0);
  const rows: [string, string][] = [
    ['언제', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['어디서', r.place.trim() || '기록 안 함'],
  ];
  const rowsBot = rowsTop + rows.length * ROW;
  const moves = r.type === 'gym' ? r.moves.filter((m) => m.name.trim()).slice(0, 8) : [];
  const movesTop = rowsBot + (moves.length ? 30 : 0);
  const movesBot = movesTop + (moves.length ? 44 + moves.length * MOVE_ROW : 0);
  const effortTop = movesBot + 34;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2, 28, 22, 3, 'hand') : null;
  const memoTop = effortTop + 78;
  const height = memoTop + (memo ? (memo.lines.length - 1) * 38 + 24 : 0) + 64;
  return { t, far, photoH, bigTop, photoTop, rowsTop, rows, rowsBot, moves, movesTop, movesBot, effortTop, memo, memoTop, height };
}

export function layoutExerciseSlip(r: ExerciseRecord): TemplateLayout {
  const { height, rowsTop } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: rowsTop + PAD, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 위는 뜯은 자국, 아래는 둥근 종이 */
function slipPath(h: number, seed: string, connected: boolean) {
  if (connected) return `M0,0 H${PW} V${h} H0 Z`;
  const rnd = seededRandom(seed);
  let d = 'M0,7';
  for (let x = 14; x < PW; x += 14) d += ` L${x},${(3 + rnd() * 6).toFixed(1)}`;
  return `${d} L${PW},7 V${h - 16} Q${PW},${h} ${PW - 16},${h} H16 Q0,${h} 0,${h - 16} Z`;
}

export function ExerciseSlip({ record: r, width, connected = false }: { record: ExerciseRecord; width: number; connected?: boolean }) {
  const L = layoutExerciseSlip(r);
  const { t, far, photoH, bigTop, photoTop, rowsTop, rows, rowsBot, moves, movesTop, movesBot, effortTop, memo, memoTop, height } = computeLayout(r);
  const shape = slipPath(height, r.id, connected);
  const id = `exslip-${r.id}`;
  const big = far ? `${r.distance}` : `${r.minutes}`;
  const bigUnit = far ? 'km' : '분';
  const side = far ? [`${r.minutes}분`, r.pace.trim() && `${r.pace.trim()} /km`].filter(Boolean) : [r.pace.trim()].filter(Boolean);

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={8} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />

        {/* 머리: 종류 칩 + 제목 */}
        <Rect x={M} y={46} width={124} height={40} rx={20} fill={t.accent} />
        <ExerciseIcon type={r.type} x={M + 16} y={54} size={24} color="#fff" />
        <T f="sansBold" x={M + 52} y={72} fontSize={18} fill="#fff" children={t.label} />
        <T f="monoBold" x={PW - M} y={72} fontSize={13} letterSpacing={3} fill={SUB} textAnchor="end" children="WORKOUT LOG" />
        <T f="sansHeavy" x={M} y={132} fontSize={34} children={`${BRAND.ko} 운동 기록표`} />
        <Line x1={M} y1={bigTop - 28} x2={PW - M} y2={bigTop - 28} stroke={INK} strokeWidth={2.5} />

        {/* 큰 기록 */}
        <T f="sansHeavy" x={M} y={bigTop + 62} fontSize={80} fill={t.accent} children={big} />
        <T f="sansBold" x={M + 10 + big.length * 46} y={bigTop + 62} fontSize={28} fill={t.accent} children={bigUnit} />
        {side.map((v, i) => (
          <T key={i} f="sansBold" x={PW - M} y={bigTop + 26 + i * 34} fontSize={20} fill={SUB} textAnchor="end" children={v} />
        ))}
        <Line x1={M} y1={bigTop + 96} x2={PW - M} y2={bigTop + 96} stroke={LINE} strokeWidth={1.5} />

        {/* 사진 */}
        {!!photoH && (
          <G>
            <Image href={{ uri: r.photo!.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={8} fill="none" stroke={LINE} strokeWidth={2} />
          </G>
        )}

        {/* 언제·어디서 */}
        {rows.map(([k, v], i) => {
          const y = rowsTop + i * ROW;
          const value = fitLine(v, PW - M * 2 - 110, 20, 14, 'sansBold');
          return (
            <G key={k}>
              <T f="sansBold" x={M} y={y + 32} fontSize={15} fill={SUB} children={k} />
              <T f="sansBold" x={PW - M} y={y + 32} fontSize={value.size} textAnchor="end" children={value.text} />
              <Line x1={M} y1={y + ROW - 8} x2={PW - M} y2={y + ROW - 8} stroke={LINE} strokeWidth={1.2} strokeDasharray="2 5" strokeLinecap="round" />
            </G>
          );
        })}

        {/* 헬스: 종목표 */}
        {!!moves.length && (
          <G>
            <Rect x={M} y={movesTop} width={PW - M * 2} height={movesBot - movesTop} rx={10} fill="none" stroke={LINE} strokeWidth={2} />
            <Rect x={M} y={movesTop} width={PW - M * 2} height={44} rx={10} fill={t.accent} />
            <T f="sansBold" x={M + 18} y={movesTop + 29} fontSize={15} fill="#fff" children="종목" />
            <T f="sansBold" x={PW - M - 18} y={movesTop + 29} fontSize={15} fill="#fff" textAnchor="end" children="무게 · 횟수" />
            {moves.map((m, i) => {
              const y = movesTop + 44 + i * MOVE_ROW;
              const name = fitLine(m.name.trim(), 230, 19, 14, 'sansBold');
              const detail = [m.weight > 0 && `${m.weight}kg`, m.reps > 0 && `${m.reps}회`, m.sets > 0 && `${m.sets}세트`].filter(Boolean).join(' · ');
              return (
                <G key={i}>
                  <T f="sansBold" x={M + 18} y={y + 31} fontSize={name.size} children={name.text} />
                  <T f="mono" x={PW - M - 18} y={y + 31} fontSize={16} fill={SUB} textAnchor="end" children={detail} />
                  {i < moves.length - 1 && <Line x1={M + 14} y1={y + MOVE_ROW} x2={PW - M - 14} y2={y + MOVE_ROW} stroke={LINE} strokeWidth={1.2} />}
                </G>
              );
            })}
          </G>
        )}

        {/* 힘든 정도 */}
        <T f="sansBold" x={M} y={effortTop + 24} fontSize={15} fill={SUB} children="힘든 정도" />
        {[0, 1, 2, 3, 4].map((s) => (
          <Rect key={s} x={PW - M - 150 + s * 30} y={effortTop + 8} width={22} height={22} rx={5} fill={s < r.effort ? t.accent : 'none'} stroke={s < r.effort ? t.accent : LINE} strokeWidth={2} />
        ))}

        {/* 한 줄 */}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={memoTop + i * 38} fontSize={memo.size} children={line} />
        ))}
        <T f="mono" x={PW / 2} y={height - 36} fontSize={12} letterSpacing={4} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · KEEP GOING`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
