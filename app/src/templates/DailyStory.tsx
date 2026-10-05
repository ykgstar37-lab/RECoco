// 일상: 사진첩 사진 한 장(저장해 둔 인스타 스토리 등)을 크림색 카드에 크게 붙인다.
// 사진 위에는 스토리처럼 얇은 진행 막대, 아래에는 소분류 알약 · 제목 · 한 줄 · 장소.
// 스토리는 9:16 이라 세로로 길다 → 사진 비율을 1:1 ~ 9:16 사이로 그대로 살린다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines, measure } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { DailyRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const M = 30;
const PHW = PW - M * 2; // 사진 폭
const PAPER = '#fffdf8';
const INK = '#2b2622';
const SUB = '#8b8074';

/** 소분류 색: 이름으로 정해져서 같은 소분류는 늘 같은 색 */
export const TAG_COLORS = ['#f08fac', '#f5a25d', '#6fbf8e', '#6fa3e0', '#b48ce0', '#e9b93c', '#5fb8b8', '#e07a6f'];

export function tagColorOf(tag: string) {
  if (!tag.trim()) return '#b9b2a6';
  return TAG_COLORS[Math.floor(seededRandom(`tag-${tag.trim()}`)() * TAG_COLORS.length)];
}

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: DailyRecord) {
  const ratio = r.photo ? r.photo.height / Math.max(1, r.photo.width) : 1.5;
  const photoH = Math.round(PHW * Math.min(16 / 9, Math.max(1, ratio)));
  const photoTop = M;
  const infoTop = photoTop + photoH + 34;
  const title = r.title.trim() ? fitLines(r.title.trim(), PHW, 36, 26, 2, 'hand') : null;
  const titleH = title ? title.lines.length * 42 : 0;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PHW, 19, 15, 4, 'serif') : null;
  const memoTop = infoTop + 54 + titleH + (title ? 14 : 0);
  const memoH = memo ? memo.lines.length * 30 : 0;
  const placeY = memoTop + memoH + (memo ? 18 : 0);
  const height = placeY + (r.place.trim() ? 34 : 0) + 54;
  return { photoH, photoTop, infoTop, title, memo, memoTop, placeY, height };
}

export function layoutDaily(r: DailyRecord): TemplateLayout {
  const { height, photoTop, photoH } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: photoTop + photoH + 90 + PAD, displayRatio: 0.82, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (h: number, connected: boolean) =>
  connected ? `M0,0 H${PW} V${h} H0 Z` : `M20,0 H${PW - 20} Q${PW},0 ${PW},20 V${h - 20} Q${PW},${h} ${PW - 20},${h} H20 Q0,${h} 0,${h - 20} V20 Q0,0 20,0 Z`;

export function DailyStory({ record: r, width, connected = false }: { record: DailyRecord; width: number; connected?: boolean }) {
  const L = layoutDaily(r);
  const { photoH, photoTop, infoTop, title, memo, memoTop, placeY, height } = computeLayout(r);
  const shape = cardPath(height, connected);
  const id = `daily-${r.id}`;
  const tag = r.tag.trim();
  const color = tagColorOf(tag);
  const pill = tag ? fitLine(tag, 220, 18, 13, 'sansBold') : null;
  const pillW = pill ? measure(pill.text, pill.size, 'sansBold') + 36 : 0;
  const place = r.place.trim() ? fitLine(r.place.trim(), PHW - 26, 16, 12, 'sans') : null;
  // 스토리 진행 막대: 몇 번째 장인지는 기록마다 달라 보이게
  const bars = 3;
  const lit = 1 + Math.floor(seededRandom(`${r.id}-bar`)() * bars);
  const barW = (PHW - 28 - (bars - 1) * 6) / bars;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} strength={1.3} />}
        <Defs>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PHW} height={photoH} rx={16} />
          </ClipPath>
          <LinearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`${id}-empty`} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor="#f3ece1" />
            <Stop offset="1" stopColor="#e6dccd" />
          </LinearGradient>
        </Defs>
        <Path d={shape} fill={PAPER} />
        {/* 종이 입자는 사진 밑에 깔아서 사진에 점이 앉지 않게 */}
        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />

        {/* 사진 */}
        <G clipPath={`url(#${id}-photo)`}>
          {r.photo ? (
            <Image href={{ uri: r.photo.uri }} x={M} y={photoTop} width={PHW} height={photoH} preserveAspectRatio="xMidYMid slice" />
          ) : (
            <G>
              <Rect x={M} y={photoTop} width={PHW} height={photoH} fill={`url(#${id}-empty)`} />
              <G opacity={0.4}>
                <Rect x={PW / 2 - 46} y={photoTop + photoH / 2 - 38} width={92} height={68} rx={12} fill="none" stroke={INK} strokeWidth={4} />
                <Circle cx={PW / 2} cy={photoTop + photoH / 2 - 4} r={18} fill="none" stroke={INK} strokeWidth={4} />
              </G>
            </G>
          )}
          <Rect x={M} y={photoTop} width={PHW} height={90} fill={`url(#${id}-top)`} />
        </G>
        {Array.from({ length: bars }, (_, i) => (
          <Rect key={i} x={M + 14 + i * (barW + 6)} y={photoTop + 14} width={barW} height={4} rx={2} fill="#fff" opacity={i < lit ? 0.95 : 0.4} />
        ))}

        {/* 소분류 알약 + 날짜 */}
        {pill ? (
          <G>
            <Rect x={M} y={infoTop} width={pillW} height={34} rx={17} fill={color} />
            <Circle cx={M + 16} cy={infoTop + 17} r={4} fill="#fff" />
            <T f="sansBold" x={M + 26} y={infoTop + 23} fontSize={pill.size} fill="#fff" children={pill.text} />
          </G>
        ) : (
          <T f="monoBold" x={M} y={infoTop + 23} fontSize={14} fill={SUB} letterSpacing={3} children="DAILY" />
        )}
        <T f="mono" x={PW - M} y={infoTop + 23} fontSize={15} fill={SUB} textAnchor="end" letterSpacing={1} children={dotDateWithDay(r.date)} />

        {title?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={infoTop + 86 + i * 42} fontSize={title.size} children={line} />
        ))}
        {memo?.lines.map((line, i) => (
          <T key={i} f="serif" x={M} y={memoTop + 20 + i * 30} fontSize={memo.size} fill="#4a4238" children={line} />
        ))}
        {place && (
          <G>
            <G transform={`translate(${M} ${placeY + 6}) scale(${12 / 24} ${17 / 32})`}>
              <Path d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 32 12 32 C12 32 24 21 24 12 C24 5.4 18.6 0 12 0 Z" fill={color} />
              <Circle cx={12} cy={12} r={4.6} fill="#fff" />
            </G>
            <T x={M + 20} y={placeY + 20} fontSize={place.size} fill={SUB} children={place.text} />
          </G>
        )}
        <T f="monoBold" x={PW / 2} y={height - 24} fontSize={11} fill={SUB} opacity={0.7} textAnchor="middle" letterSpacing={4} children={`${BRAND.en.toUpperCase()} · DAILY`} />
      </G>
    </Svg>
  );
}
