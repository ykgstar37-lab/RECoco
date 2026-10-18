// 소비 (사진 영수증, 무료 모양 `design: 'photo'`): 사진을 영수증 크기로 꽉 깔고 그 위에 흰 글씨로 주문서를 띄운다.
// 위에서부터 코멘트 → 점선 → 구매일자 → 점선 → 품목·개수·가격. 배달 주문 요청사항을 사진에 얹은 느낌.
// 글자가 밝은 사진에 묻히지 않게 글자 덩어리 뒤에만 옅은 그늘을 깔고, 글자마다 살짝 그림자를 준다.
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';

import { coverRect } from '../lib/photoCrop';
import { won } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { SpendingRecord } from '../types';
import { StickerArt, stickerOf } from '../components/Stickers';
import { PaperShadow, TemplateLayout } from './shared';

// 종이 영수증(SpendingReceipt)과 같은 크기라 롤에서 나란히 놓여도 폭·길이가 맞는다
const PW = 640;
const PH = 1340;
const PAD = 16;
const BL = 132; // 글자 덩어리 왼쪽·오른쪽 끝
const BR = PW - BL;
const MAX_ROWS = 8;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
/** 흰 글씨 + 아래로 1px 옅은 그림자 (밝은 사진에서도 읽히게) */
const T = ({ f = 'sans', ...p }: TProps) => (
  <G>
    <Text fill="#000" opacity={0.28} fontFamily={FONTS[f]} {...p} x={Number(p.x) + 1} y={Number(p.y) + 1.5} />
    <Text fill="#fff" fontFamily={FONTS[f]} {...p} />
  </G>
);

const Dash = ({ y }: { y: number }) => (
  <G>
    <Line x1={BL} y1={y + 1} x2={BR} y2={y + 1} stroke="#000" strokeOpacity={0.22} strokeWidth={1.6} strokeDasharray="7 5" />
    <Line x1={BL} y1={y} x2={BR} y2={y} stroke="#fff" strokeOpacity={0.9} strokeWidth={1.6} strokeDasharray="7 5" />
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

export function layoutSpendingPhoto(_r: SpendingRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: 0, displayRatio: 0.94, inset: { top: PAD, bottom: PAD + 14 } };
}

const SHAPE = `M0,0 H${PW} V${PH} H0 Z`;

export function SpendingPhoto({ record: r, width }: { record: SpendingRecord; width: number }) {
  const L = layoutSpendingPhoto(r);
  const id = `spphoto-${r.id}`;

  const items = r.items.filter((it) => it.name.trim() || it.store?.trim() || it.price > 0).slice(0, MAX_ROWS);
  const rows = items.map((it) => {
    const name = [it.store?.trim(), it.name.trim()].filter(Boolean).join(' ');
    // 총액만 적은 기록은 이름이 없다
    const what = name ? `${name} ${it.qty}` : '합계';
    return { what: fitLine(what, BR - BL - 120, 19, 14, 'sans'), price: won(it.qty * it.price) };
  });

  const sticker = stickerOf(r.memo) ? r.memo : null;
  const comment = !sticker && r.memo.trim() ? commentLines(r.memo) : null;
  const commentH = sticker ? 70 : comment ? comment.lines.length * comment.size * 1.42 : 0;
  const ROW = 32;

  // 덩어리 전체 높이를 재서 세로 가운데보다 조금 아래에 놓는다 (사진 속 얼굴·물건이 위쪽에 오는 경우가 많아서)
  const blockH = commentH + (commentH ? 22 : 0) + 64 + 24 + rows.length * ROW;
  const top = Math.round(PH * 0.56 - blockH / 2);
  const dash1 = top + commentH + (commentH ? 22 : 0);
  const dash2 = dash1 + 64;
  const rowsTop = dash2 + 24;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={SHAPE} strength={1.2} />
        <Defs>
          <ClipPath id={`${id}-card`}>
            <Path d={SHAPE} />
          </ClipPath>
          <LinearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0} />
            <Stop offset="0.35" stopColor="#000" stopOpacity={0.22} />
            <Stop offset="0.65" stopColor="#000" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={`${id}-empty`} x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#6d625a" />
            <Stop offset="1" stopColor="#1f1c1a" />
          </LinearGradient>
        </Defs>

        <G clipPath={`url(#${id}-card)`}>
          {r.photo ? (
            <Image href={{ uri: r.photo.uri }} {...coverRect(r.photo, { x: 0, y: 0, width: PW, height: PH })} preserveAspectRatio="none" />
          ) : (
            <Rect x={0} y={0} width={PW} height={PH} fill={`url(#${id}-empty)`} />
          )}
          {/* 글자 덩어리 뒤 옅은 그늘 */}
          <Rect x={0} y={top - 160} width={PW} height={blockH + 320} fill={`url(#${id}-shade)`} />
        </G>

        {/* 코멘트 */}
        {sticker && <StickerArt emoji={sticker} x={PW / 2} y={top + 32} size={64} />}
        {comment?.lines.map((line, i) => (
          <T key={i} x={PW / 2} y={top + comment.size * (1.05 + i * 1.42)} fontSize={comment.size} textAnchor="middle" children={line} />
        ))}

        <Dash y={dash1} />
        <T x={BL} y={dash1 + 40} fontSize={18} children={`구매일자 : ${r.date}`} />
        <Dash y={dash2} />

        {rows.map((row, i) => {
          const y = rowsTop + 14 + i * ROW;
          return (
            <G key={i}>
              <T x={BL} y={y} fontSize={row.what.size} children={row.what.text} />
              <T x={BR} y={y} fontSize={19} textAnchor="end" children={row.price} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

/** 사진 칸 크기 (영수증 크기 고정) — 자르기 화면이 이 비율로 틀을 띄운다 (lib/photoSlots) */
export const PHOTO_SLOT = { w: PW, min: PH, max: PH };
