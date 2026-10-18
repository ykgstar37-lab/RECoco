// 사진 영수증 (유료 테마 `recoco.theme.photo-receipt`, 소비·카페맛집 `design: 'photo'`):
// 사진을 영수증 크기로 꽉 깔고 그 위에 흰 글씨로 주문서를 띄운다.
// 위에서부터 코멘트 → 점선 → 구매일자 → 점선 → 품목·개수·가격. 배달 주문 요청사항을 사진에 얹은 느낌.
// 카페·맛집은 한 줄 후기 → 방문일자 → 메뉴·별점 (+ 합계).
// 글자가 밝은 사진에 묻히지 않게 글자 덩어리 뒤에만 옅은 그늘을 깔고, 글자마다 살짝 그림자를 준다.
// 사진이 없으면 흰 종이에 검은 글씨로, 길이는 글자 덩어리에 맞춘다.
// printFilter(흑백 프린트): 사진을 배경에 깔지 않고, 흰 종이 글자 덩어리 아래에 같은 폭으로 붙인다.
//   사진은 흑백·강한 대비로 바꾸고 복사기로 뽑은 듯한 자글자글한 점을 얹는다.
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, FeColorMatrix, Filter, G, Image, Line, LinearGradient, Path, Pattern, Rect, Stop, Text } from 'react-native-svg';

import { coverRect, photoRatio } from '../lib/photoCrop';
import { won } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { FoodRecord, SpendingRecord } from '../types';
import { StickerArt, stickerOf } from '../components/Stickers';
import { PaperShadow, TemplateLayout } from './shared';

const PRINT_GRAIN = require('../../assets/paper/print-grain.png');

// 사진이 있으면 종이 영수증(SpendingReceipt)과 같은 크기라 롤에서 나란히 놓여도 폭·길이가 맞는다
const PW = 640;
const PH = 1340;
const PAD = 16;
const BL = 132; // 글자 덩어리 왼쪽·오른쪽 끝
const BR = PW - BL;
const MAX_ROWS = 8;
const ROW = 32;
const PLAIN_PAD = 78; // 사진 없는 흰 종이의 위아래 여백
const PRINT_GAP = 30; // 흑백 프린트: 품목과 사진 사이
// 흑백 프린트 사진 칸: 글자 덩어리와 같은 폭, 높이는 사진 비율을 따르되 너무 납작하거나 길지 않게
const PRINT_W = BR - BL;
const PRINT_MIN = Math.round(PRINT_W * 0.8);
const PRINT_MAX = Math.round(PRINT_W * 1.35);

// 흑백 + 대비 세게 (밝은 데는 하얗게 날리고 어두운 데는 진하게)
const C = 1.55;
const O = -0.2;
const PRINT_MATRIX = [0.299, 0.587, 0.114]
  .map((k) => k * C)
  .join(' ');
const PRINT_VALUES = `${PRINT_MATRIX} 0 ${O} ${PRINT_MATRIX} 0 ${O} ${PRINT_MATRIX} 0 ${O} 0 0 0 1 0`;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS; ink: string; shadow: boolean };
/** 사진 위면 흰 글씨 + 아래로 1px 옅은 그림자 (밝은 사진에서도 읽히게), 흰 종이면 먹색 글씨만 */
const T = ({ f = 'sans', ink, shadow, ...p }: TProps) => (
  <G>
    {shadow && <Text fill="#000" opacity={0.28} fontFamily={FONTS[f]} {...p} x={Number(p.x) + 1} y={Number(p.y) + 1.5} />}
    <Text fill={ink} fontFamily={FONTS[f]} {...p} />
  </G>
);

const Dash = ({ y, ink, shadow }: { y: number; ink: string; shadow: boolean }) => (
  <G>
    {shadow && <Line x1={BL} y1={y + 1} x2={BR} y2={y + 1} stroke="#000" strokeOpacity={0.22} strokeWidth={1.6} strokeDasharray="7 5" />}
    <Line x1={BL} y1={y} x2={BR} y2={y} stroke={ink} strokeOpacity={0.9} strokeWidth={1.6} strokeDasharray="7 5" />
  </G>
);

/** 코멘트: 적은 사람이 줄을 바꾼 자리는 그대로 두고, 넘치는 줄만 감는다. 다 해서 4줄이 넘으면 글씨를 줄인다 */
function commentLines(memo: string) {
  const parts = memo
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  let size = 32;
  for (;;) {
    const lines = parts.flatMap((p) => fitLines(p, PW - 96, size, size, 99, 'sans').lines);
    if (lines.length <= 4 || size <= 22) return { size, lines: lines.slice(0, 5) };
    size -= 2;
  }
}

export type PhotoReceiptRecord = SpendingRecord | FoodRecord;

/** 품목 줄: 소비는 품목·개수 / 가격, 카페·맛집은 메뉴 / 별점 (+ 합계) */
function rowsOf(r: PhotoReceiptRecord): { left: string; right: string }[] {
  if (r.kind === 'food') {
    const menus = r.menus.filter((m) => m.name.trim()).map((m) => ({ left: m.name.trim(), right: m.stars > 0 ? '★'.repeat(m.stars) + '☆'.repeat(5 - m.stars) : '' }));
    return [...menus.slice(0, r.total > 0 ? MAX_ROWS - 1 : MAX_ROWS), ...(r.total > 0 ? [{ left: '합계', right: won(r.total) }] : [])];
  }
  return r.items
    .filter((it) => it.name.trim() || it.store?.trim() || it.price > 0)
    .slice(0, MAX_ROWS)
    .map((it) => {
      const name = [it.store?.trim(), it.name.trim()].filter(Boolean).join(' ');
      // 총액만 적은 기록은 이름이 없다
      return { left: name ? `${name} ${it.qty}` : '합계', right: won(it.qty * it.price) };
    });
}

/** 글자 덩어리 재기 (사진 없는 종이는 이 높이에 맞춰 길이가 정해진다) */
function measure(r: PhotoReceiptRecord) {
  const rows = rowsOf(r).map((row) => ({ what: fitLine(row.left, BR - BL - 120, 19, 14, 'sans'), price: row.right }));
  const sticker = r.kind === 'spending' && stickerOf(r.memo) ? r.memo : null;
  const comment = !sticker && r.memo.trim() ? commentLines(r.memo) : null;
  const commentH = sticker ? 70 : comment ? comment.lines.length * comment.size * 1.42 : 0;
  const gap = commentH ? 22 : 0;
  const blockH = commentH + gap + 64 + 24 + rows.length * ROW;
  // cover: 사진이 배경 / print: 흰 종이 글자 아래 사진 / plain: 사진 없는 흰 종이
  const mode = r.photo ? (r.printFilter ? 'print' : 'cover') : 'plain';
  const printH = r.photo && mode === 'print' ? Math.round(Math.min(PRINT_MAX, Math.max(PRINT_MIN, PRINT_W * photoRatio(r.photo)))) : 0;
  const height =
    mode === 'cover' ? PH : mode === 'print' ? Math.round(PLAIN_PAD + blockH + PRINT_GAP + printH + PLAIN_PAD * 0.8) : Math.round(blockH + PLAIN_PAD * 2);
  return { rows, sticker, comment, commentH, gap, blockH, height, mode, printH };
}

export function layoutPhotoReceipt(r: PhotoReceiptRecord): TemplateLayout {
  const { height } = measure(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.94, inset: { top: PAD, bottom: PAD + 14 } };
}

export function PhotoReceipt({ record: r, width }: { record: PhotoReceiptRecord; width: number }) {
  const L = layoutPhotoReceipt(r);
  const { rows, sticker, comment, commentH, gap, blockH, height, mode, printH } = measure(r);
  const id = `spphoto-${r.id}`;
  const photo = r.photo ?? null;
  const shape = `M0,0 H${PW} V${height} H0 Z`;
  // 사진 위에는 흰 글씨, 흰 종이에는 먹색 글씨
  const ink = mode === 'cover' ? '#fff' : '#26262b';
  const shadow = mode === 'cover';
  const t = { ink, shadow };

  // 사진 위에서는 세로 가운데보다 조금 아래에 놓는다 (사진 속 얼굴·물건이 위쪽에 오는 경우가 많아서)
  const top = mode === 'cover' ? Math.round(height * 0.56 - blockH / 2) : PLAIN_PAD;
  const printBox = { x: BL, y: PLAIN_PAD + blockH + PRINT_GAP, width: PRINT_W, height: printH };
  const dash1 = top + commentH + gap;
  const dash2 = dash1 + 64;
  const rowsTop = dash2 + 24;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} strength={mode === 'cover' ? 1.2 : 1} />
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={shape} />
          </ClipPath>
          <LinearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0} />
            <Stop offset="0.35" stopColor="#000" stopOpacity={0.22} />
            <Stop offset="0.65" stopColor="#000" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </LinearGradient>
          {mode === 'print' && (
            <ClipPath id={`${id}-print-box`}>
              <Rect {...printBox} />
            </ClipPath>
          )}
          {mode === 'print' && (
            <Filter id={`${id}-print`} x="0" y="0" width="1" height="1">
              <FeColorMatrix type="matrix" values={PRINT_VALUES} />
            </Filter>
          )}
          {mode === 'print' && (
            <Pattern id={`${id}-grain`} patternUnits="userSpaceOnUse" width={256} height={256}>
              <Image href={PRINT_GRAIN} x={0} y={0} width={256} height={256} />
            </Pattern>
          )}
        </Defs>

        <G clipPath={`url(#${id}-card)`}>
          {photo && mode === 'cover' ? (
            <G>
              <Image href={{ uri: photo.uri }} {...coverRect(photo, { x: 0, y: 0, width: PW, height })} preserveAspectRatio="none" />
              {/* 글자 덩어리 뒤 옅은 그늘 */}
              <Rect x={0} y={top - 160} width={PW} height={blockH + 320} fill={`url(#${id}-shade)`} />
            </G>
          ) : (
            <Rect x={0} y={0} width={PW} height={height} fill="#ffffff" />
          )}
          {photo && mode === 'print' && (
            <G clipPath={`url(#${id}-print-box)`}>
              <Image href={{ uri: photo.uri }} {...coverRect(photo, printBox)} preserveAspectRatio="none" filter={`url(#${id}-print)`} />
              <Rect {...printBox} fill={`url(#${id}-grain)`} />
            </G>
          )}
        </G>

        {/* 코멘트 */}
        {sticker && <StickerArt emoji={sticker} x={PW / 2} y={top + 32} size={64} />}
        {comment?.lines.map((line, i) => (
          <T key={i} {...t} x={PW / 2} y={top + comment.size * (1.05 + i * 1.42)} fontSize={comment.size} textAnchor="middle" children={line} />
        ))}

        <Dash y={dash1} {...t} />
        <T {...t} x={BL} y={dash1 + 40} fontSize={18} children={`${r.kind === 'food' ? '방문일자' : '구매일자'} : ${r.date}`} />
        <Dash y={dash2} {...t} />

        {rows.map((row, i) => {
          const y = rowsTop + 14 + i * ROW;
          return (
            <G key={i}>
              <T {...t} x={BL} y={y} fontSize={row.what.size} children={row.what.text} />
              <T {...t} x={BR} y={y} fontSize={19} textAnchor="end" children={row.price} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

/** 사진 칸 크기 — 자르기 화면이 이 비율로 틀을 띄운다 (lib/photoSlots). 배경은 영수증 크기 고정 */
export const PHOTO_SLOT = { w: PW, min: PH, max: PH };
/** 흑백 프린트: 글자 아래 사진 칸 */
export const PRINT_SLOT = { w: PRINT_W, min: PRINT_MIN, max: PRINT_MAX };
