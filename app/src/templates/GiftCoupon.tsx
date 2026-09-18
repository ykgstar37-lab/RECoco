// 선물: 모바일 선물 교환권 느낌 (색 카드 머리 + 메시지 말풍선 + 상품 + 교환권 바코드)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { StickerArt } from '../components/Stickers';
import { pad2, parseDate, seededRandom, won } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { GiftCard, GiftRecord } from '../types';
import { Barcode, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const INK = '#2b2622';
const SUB = '#8b8680';
const LINE = '#ece8e2';
const R = 34; // 카드 모서리
const NOTCH = 18;

const CARDS: Record<GiftCard, { head: string; deep: string }> = {
  yellow: { head: '#ffe36b', deep: '#e9c23a' },
  pink: { head: '#ffc9d9', deep: '#f294b2' },
  mint: { head: '#c3ecd9', deep: '#7fc9a6' },
  sky: { head: '#cfe2fb', deep: '#8db6ea' },
  plain: { head: '#ece9e3', deep: '#b9b3a8' },
};

const HEAD_H = 300;
const MSG_LINE = 36;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: GiftRecord) {
  const message = fitLines(r.message.trim() || '마음을 담아 보내요.', PW - 150, 25, 19, 4, 'sans');
  const bubbleH = 52 + message.lines.length * MSG_LINE;
  const item = fitLines(r.item.trim() || '선물', PW - 280, 31, 22, 2, 'sans');
  const bubbleTop = HEAD_H - 34;
  const productTop = bubbleTop + bubbleH + 44;
  const cut = productTop + 190 + 40;
  const height = cut + 360;
  return { message, bubbleH, bubbleTop, item, productTop, cut, height };
}

export function layoutGift(r: GiftRecord): TemplateLayout {
  const { height, cut } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: cut + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 절취선 자리 양옆이 반원으로 파인 카드 */
function cardPath(h: number, cut: number) {
  return [
    `M${R},0 H${PW - R} Q${PW},0 ${PW},${R}`,
    `V${cut - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${PW},${cut + NOTCH}`,
    `V${h - R} Q${PW},${h} ${PW - R},${h} H${R} Q0,${h} 0,${h - R}`,
    `V${cut + NOTCH} A${NOTCH},${NOTCH} 0 0 0 0,${cut - NOTCH}`,
    `V${R} Q0,0 ${R},0 Z`,
  ].join(' ');
}

export function GiftCoupon({ record: r, width }: { record: GiftRecord; width: number }) {
  const L = layoutGift(r);
  const { message, bubbleH, bubbleTop, item, productTop, cut, height } = computeLayout(r);
  const color = CARDS[r.card] ?? CARDS.yellow;
  const shape = cardPath(height, cut);
  const clipId = `gift-${r.id}`;

  const rnd = seededRandom(r.id);
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(rnd() * 10)).join('');
  const code = r.couponCode ? r.couponCode.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ') : `${digits(4)} ${digits(4)} ${digits(4)}`;
  const order = digits(10);
  const d = parseDate(r.date);
  const until = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 93);
  const dot = (x: Date) => `${x.getFullYear()}.${pad2(x.getMonth() + 1)}.${pad2(x.getDate())}`;

  const person = r.person.trim() || (r.direction === 'received' ? '누군가' : '소중한 사람');
  const headline = fitLine(r.direction === 'received' ? `${person}님이 보낸 선물이 도착했어요` : `${person}님에게 선물을 보냈어요`, PW - 80, 30, 22, 'sans');
  const brand = fitLine(r.brand.trim(), PW - 280, 22, 16, 'sans');
  // 브랜드가 없으면 상품 이름을 조금 위로
  const itemTop = productTop + (brand.text ? 72 : 50);
  const itemBottom = itemTop - 12 + (item.lines.length - 1) * 40;

  const info = [
    ['교환처', r.brand.trim() || '어디서나'],
    [r.direction === 'received' ? '받은 날' : '보낸 날', dot(d)],
    ['유효기간', `${dot(until)} 까지`],
    ['주문번호', order],
  ];

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${clipId}-card`}>
            <Path d={shape} />
          </ClipPath>
          <ClipPath id={`${clipId}-photo`}>
            <Rect x={40} y={productTop} width={180} height={180} rx={24} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill="#fff" />

        {/* 색 머리 + 큰 선물 상자 */}
        <G clipPath={`url(#${clipId}-card)`}>
          <Rect x={0} y={0} width={PW} height={HEAD_H} fill={color.head} />
          {[
            [70, 60, 7],
            [520, 90, 9],
            [110, 200, 5],
            [480, 210, 6],
            [420, 40, 4],
          ].map(([x, y, s], i) => (
            <Path key={i} d={`M${x},${y - s} L${x + s * 0.35},${y - s * 0.35} L${x + s},${y} L${x + s * 0.35},${y + s * 0.35} L${x},${y + s} L${x - s * 0.35},${y + s * 0.35} L${x - s},${y} L${x - s * 0.35},${y - s * 0.35} Z`} fill="#fff" opacity={0.8} />
          ))}
        </G>
        <T f="sansBold" x={36} y={52} fontSize={20} fill={INK} opacity={0.75} children={`${BRAND.ko} 선물함`} />
        <Rect x={PW - 36 - 104} y={28} width={104} height={34} rx={17} fill="#fff" opacity={0.85} />
        <T f="monoBold" x={PW - 36 - 52} y={51} fontSize={15} textAnchor="middle" letterSpacing={1} children={r.direction === 'received' ? 'RECEIVED' : 'SENT'} />
        <StickerArt emoji="🎁" x={PW / 2} y={128} size={120} rotate={-6} />
        <T f="sansHeavy" x={PW / 2} y={228} fontSize={headline.size} textAnchor="middle" children={headline.text} />

        {/* 메시지 카드 */}
        <Rect x={44} y={bubbleTop} width={PW - 88} height={bubbleH} rx={22} fill="#fff" stroke={color.deep} strokeWidth={2} />
        {message.lines.map((line, i) => (
          <T key={i} x={PW / 2} y={bubbleTop + 44 + i * MSG_LINE} fontSize={message.size} textAnchor="middle" children={line} />
        ))}

        {/* 상품 */}
        {r.photo ? (
          <G>
            <Rect x={40} y={productTop} width={180} height={180} rx={24} fill={LINE} />
            <Image href={{ uri: r.photo.uri }} x={40} y={productTop} width={180} height={180} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId}-photo)`} />
          </G>
        ) : (
          <G>
            <Rect x={40} y={productTop} width={180} height={180} rx={24} fill={color.head} opacity={0.45} />
            <StickerArt emoji="🎁" x={130} y={productTop + 90} size={96} />
          </G>
        )}
        {!!brand.text && <T x={248} y={productTop + 30} fontSize={brand.size} fill={SUB} children={brand.text} />}
        {item.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={248} y={itemTop + i * 40} fontSize={item.size} children={line} />
        ))}
        {r.price > 0 && <T f="sansBold" x={248} y={itemBottom + 50} fontSize={26} children={`${won(r.price)}원`} />}

        {/* 절취선 */}
        <Line x1={NOTCH + 14} y1={cut} x2={PW - NOTCH - 14} y2={cut} stroke={LINE} strokeWidth={3} strokeDasharray="10 8" />

        {/* 교환권 */}
        <Barcode seed={r.couponCode || r.id} x={(PW - 440) / 2} y={cut + 44} width={440} height={96} color={INK} />
        <T f="mono" x={PW / 2} y={cut + 176} fontSize={26} textAnchor="middle" letterSpacing={3} children={code} />
        <Line x1={40} y1={cut + 206} x2={PW - 40} y2={cut + 206} stroke={LINE} strokeWidth={2} />
        {info.map(([k, v], i) => (
          <G key={k}>
            <T x={44} y={cut + 246 + i * 30} fontSize={19} fill={SUB} children={k} />
            <T f="sansBold" x={PW - 44} y={cut + 246 + i * 30} fontSize={19} textAnchor="end" children={v} />
          </G>
        ))}
      </G>
    </Svg>
  );
}
