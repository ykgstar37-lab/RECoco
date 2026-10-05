// 일상: 사진첩 사진 한 장을 그대로 붙인다. 비율은 사진 그대로(폭만 맞춘다) —
// 롤로 이으면 사진이 틈 없이 줄줄이 붙어 한 장의 긴 앨범처럼 보인다.
// 탭해서 뒤집으면 같은 사진이 옅어지고 그 위에 소분류 · 날짜 · 제목 · 한 줄 · 장소가 적혀 있다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines, measure } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { DailyRecord } from '../types';
import { PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const M = 36; // 뒷면 글 여백
const INK = '#2b2622';
const SUB = '#6f665b';

/** 소분류 색: 이름으로 정해져서 같은 소분류는 늘 같은 색 */
export const TAG_COLORS = ['#f08fac', '#f5a25d', '#6fbf8e', '#6fa3e0', '#b48ce0', '#e9b93c', '#5fb8b8', '#e07a6f'];

export function tagColorOf(tag: string) {
  if (!tag.trim()) return '#b9b2a6';
  return TAG_COLORS[Math.floor(seededRandom(`tag-${tag.trim()}`)() * TAG_COLORS.length)];
}

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

/** 사진 높이: 폭에 맞추고 비율은 그대로. 너무 납작하거나 긴 것만 살짝 잡는다 (뒷면 글이 들어갈 자리) */
function heightOf(r: DailyRecord) {
  const ratio = r.photo && r.photo.width > 0 ? r.photo.height / r.photo.width : 1.25;
  return Math.round(PW * Math.min(2.2, Math.max(0.56, ratio)));
}

export function layoutDaily(r: DailyRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: heightOf(r) + PAD * 2 + 14, foldAt: 0, displayRatio: 0.92, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (h: number, connected: boolean) =>
  connected ? `M0,0 H${PW} V${h} H0 Z` : `M14,0 H${PW - 14} Q${PW},0 ${PW},14 V${h - 14} Q${PW},${h} ${PW - 14},${h} H14 Q0,${h} 0,${h - 14} V14 Q0,0 14,0 Z`;

interface Props {
  record: DailyRecord;
  width: number;
  connected?: boolean;
}

function Photo({ r, h, id, shape, opacity = 1 }: { r: DailyRecord; h: number; id: string; shape: string; opacity?: number }) {
  return (
    <G>
      <Defs>
        <ClipPath id={`${id}-clip`}>
          <Path d={shape} />
        </ClipPath>
        <LinearGradient id={`${id}-empty`} x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#f3ece1" />
          <Stop offset="1" stopColor="#e3d8c8" />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${id}-clip)`}>
        {r.photo ? (
          <Image href={{ uri: r.photo.uri }} x={0} y={0} width={PW} height={h} preserveAspectRatio="xMidYMid slice" opacity={opacity} />
        ) : (
          <G>
            <Rect x={0} y={0} width={PW} height={h} fill={`url(#${id}-empty)`} />
            {opacity === 1 && (
              <G opacity={0.4}>
                <Rect x={PW / 2 - 46} y={h / 2 - 38} width={92} height={68} rx={12} fill="none" stroke={INK} strokeWidth={4} />
                <Circle cx={PW / 2} cy={h / 2 - 4} r={18} fill="none" stroke={INK} strokeWidth={4} />
              </G>
            )}
          </G>
        )}
      </G>
    </G>
  );
}

/** 앞면: 사진만 */
export function DailyStory({ record: r, width, connected = false }: Props) {
  const L = layoutDaily(r);
  const h = heightOf(r);
  const shape = cardPath(h, connected);
  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} strength={1.3} />}
        <Photo r={r} h={h} id={`daily-${r.id}`} shape={shape} />
      </G>
    </Svg>
  );
}

/** 뒷면: 사진을 옅게 깔고 그 위에 글 */
export function DailyBack({ record: r, width, connected = false }: Props) {
  const L = layoutDaily(r);
  const h = heightOf(r);
  const shape = cardPath(h, connected);
  const id = `daily-back-${r.id}`;
  const tag = r.tag.trim();
  const color = tagColorOf(tag);
  const inner = PW - M * 2;

  const pill = tag ? fitLine(tag, 240, 19, 13, 'sansBold') : null;
  const pillW = pill ? measure(pill.text, pill.size, 'sansBold') + 38 : 0;
  const top = M;
  const titleTop = top + 96;
  // 제목이 없으면 그 줄을 비우고 한 줄을 끌어올린다 (날짜는 오른쪽 위에 이미 있다)
  const title = r.title.trim() ? fitLines(r.title.trim(), inner, 40, 26, 2, 'hand') : null;
  const memoTop = title ? titleTop + (title.lines.length - 1) * 48 + 52 : top + 92;
  const foot = h - M - (r.place.trim() ? 30 : 0) - 26;
  // 남는 높이만큼만 한 줄을 적는다 (납작한 사진이면 줄이 적다)
  const rows = Math.max(0, Math.floor((foot - memoTop) / 34));
  const memo = r.memo.trim() && rows ? fitLines(r.memo.trim(), inner, 21, 15, rows, 'serif') : null;
  const place = r.place.trim() ? fitLine(r.place.trim(), inner - 26, 17, 12, 'sans') : null;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} strength={1.3} />}
        <Path d={shape} fill="#fffdf8" />
        <Photo r={r} h={h} id={id} shape={shape} opacity={0.22} />

        {pill ? (
          <G>
            <Rect x={M} y={top} width={pillW} height={36} rx={18} fill={color} />
            <Circle cx={M + 17} cy={top + 18} r={4.2} fill="#fff" />
            <T f="sansBold" x={M + 28} y={top + 25} fontSize={pill.size} fill="#fff" children={pill.text} />
          </G>
        ) : (
          <T f="monoBold" x={M} y={top + 25} fontSize={14} fill={SUB} letterSpacing={3} children="DAILY" />
        )}
        <T f="mono" x={PW - M} y={top + 25} fontSize={15} fill={SUB} textAnchor="end" letterSpacing={1} children={dotDateWithDay(r.date)} />

        {title?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={titleTop + i * 48} fontSize={title.size} children={line} />
        ))}
        {memo?.lines.map((line, i) => (
          <T key={i} f="serif" x={M} y={memoTop + 8 + i * 34} fontSize={memo.size} fill="#3d362e" children={line} />
        ))}
        {place && (
          <G>
            <G transform={`translate(${M} ${foot + 8}) scale(${12 / 24} ${17 / 32})`}>
              <Path d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 32 12 32 C12 32 24 21 24 12 C24 5.4 18.6 0 12 0 Z" fill={color} />
              <Circle cx={12} cy={12} r={4.6} fill="#fff" />
            </G>
            <T x={M + 20} y={foot + 22} fontSize={place.size} fill={SUB} children={place.text} />
          </G>
        )}
        <T f="monoBold" x={PW - M} y={h - M + 4} fontSize={11} fill={SUB} opacity={0.7} textAnchor="end" letterSpacing={4} children={`${BRAND.en.toUpperCase()} · DAILY`} />
      </G>
    </Svg>
  );
}
