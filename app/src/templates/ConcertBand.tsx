// 콘서트 영수증 테마 "스탠딩 팔찌": 공연장에서 채워주는 천 팔찌 (잠금 고리 + 아티스트 이름 반복 + 바코드)
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom, won } from '../lib/format';
import { fitLine } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { ConcertRecord } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 600;
const PAD = 16;
const BAND_X = 92; // 팔찌 폭 (세로로 긴 띠)
const BAND_W = PW - BAND_X * 2;
const NEON = '#d6f24a';
const DARK = '#191a22';
const SOFT = '#2b2d3a';

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fontFamily={FONTS[f]} {...p} />;

const TOP = 40; // 고리 위 여백
const LOCK_H = 96;
const INFO_TOP = 196;

function computeLayout(r: ConcertRecord) {
  const rows = [
    ['DATE', `${dotDateWithDay(r.date)}${r.time ? `  ${r.time}` : ''}`],
    ['VENUE', r.place.trim() || '공연장'],
    ['ADMISSION', r.seat.trim() || `${r.people}명`],
    ...(r.price > 0 ? [['PRICE', `₩ ${won(r.price)}`]] : []),
  ] as [string, string][];
  const infoBot = INFO_TOP + 300 + rows.length * 62;
  const height = infoBot + 300;
  return { rows, infoBot, height };
}

export function layoutConcertBand(r: ConcertRecord): TemplateLayout {
  const { height } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: 0, displayRatio: 0.72, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 위는 잠금 고리(넓은 사각), 아래로 길게 내려오는 띠 + 끝은 둥글게 */
function bandPath(h: number) {
  const x = BAND_X;
  const w = BAND_W;
  return [
    `M${x - 26},${TOP + 16} Q${x - 26},${TOP} ${x - 10},${TOP}`,
    `H${x + w + 10} Q${x + w + 26},${TOP} ${x + w + 26},${TOP + 16}`,
    `V${TOP + LOCK_H - 16} Q${x + w + 26},${TOP + LOCK_H} ${x + w + 10},${TOP + LOCK_H}`,
    `H${x + w} V${h - 34} Q${x + w},${h} ${x + w / 2},${h} Q${x},${h} ${x},${h - 34}`,
    `V${TOP + LOCK_H} H${x - 10} Q${x - 26},${TOP + LOCK_H} ${x - 26},${TOP + LOCK_H - 16} Z`,
  ].join(' ');
}

export function ConcertBand({ record: r, width }: { record: ConcertRecord; width: number }) {
  const L = layoutConcertBand(r);
  const { rows, infoBot, height } = computeLayout(r);
  const shape = bandPath(height);
  const id = `band-${r.id}`;
  const rnd = seededRandom(r.id);
  const serial = String(Math.floor(rnd() * 99999999)).padStart(8, '0');
  const artist = fitLine(r.artist.trim() || r.title.trim() || 'LIVE', BAND_W - 30, 34, 20, 'sansHeavy');
  const title = fitLine(r.title.trim() || '공연', BAND_W - 30, 26, 16, 'sansBold');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Defs>
          <ClipPath id={`${id}-band`}>
            <Path d={shape} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={DARK} />

        {/* 천 짜임 무늬 */}
        <G clipPath={`url(#${id}-band)`}>
          {Array.from({ length: Math.ceil(height / 7) }, (_, i) => (
            <Line key={i} x1={BAND_X - 26} y1={i * 7} x2={BAND_X + BAND_W + 26} y2={i * 7} stroke="#fff" strokeWidth={0.8} opacity={0.045} />
          ))}
          {/* 잠금 고리 */}
          <Rect x={BAND_X - 26} y={TOP} width={BAND_W + 52} height={LOCK_H} fill={SOFT} />
          <Rect x={BAND_X - 6} y={TOP + 26} width={BAND_W + 12} height={44} rx={8} fill={DARK} />
          {[0, 1, 2].map((i) => (
            <Rect key={i} x={BAND_X + 30 + i * (BAND_W - 100) * 0.5} y={TOP + 40} width={16} height={16} rx={8} fill={SOFT} />
          ))}
        </G>

        {/* 머리 */}
        <T f="monoBold" x={PW / 2} y={TOP + LOCK_H + 56} fontSize={15} letterSpacing={6} textAnchor="middle" fill={NEON} children="STANDING" />
        <T f="sansHeavy" x={PW / 2} y={INFO_TOP + 60} fontSize={artist.size} textAnchor="middle" fill="#fff" children={artist.text} />
        <T f="sansBold" x={PW / 2} y={INFO_TOP + 100} fontSize={title.size} textAnchor="middle" fill="#fff" opacity={0.66} children={title.text} />

        {/* 네온 선 사이 반복 무늬 */}
        <Line x1={BAND_X + 20} y1={INFO_TOP + 130} x2={BAND_X + BAND_W - 20} y2={INFO_TOP + 130} stroke={NEON} strokeWidth={2} />
        {[0, 1, 2].map((i) => (
          <T key={i} f="monoBold" x={PW / 2} y={INFO_TOP + 174 + i * 40} fontSize={17} letterSpacing={7} textAnchor="middle" fill="#fff" opacity={0.22} children="LIVE · LIVE · LIVE" />
        ))}
        <Line x1={BAND_X + 20} y1={INFO_TOP + 296} x2={BAND_X + BAND_W - 20} y2={INFO_TOP + 296} stroke={NEON} strokeWidth={2} />

        {/* 정보 */}
        {rows.map(([k, v], i) => {
          const y = INFO_TOP + 340 + i * 62;
          const value = fitLine(v, BAND_W - 30, 20, 13, 'sansBold');
          return (
            <G key={k}>
              <T f="mono" x={PW / 2} y={y} fontSize={12} letterSpacing={2} textAnchor="middle" fill={NEON} children={k} />
              <T f="sansBold" x={PW / 2} y={y + 26} fontSize={value.size} textAnchor="middle" fill="#fff" children={value.text} />
            </G>
          );
        })}

        {/* 별점 */}
        <T f="mono" x={PW / 2} y={infoBot + 30} fontSize={12} letterSpacing={2} textAnchor="middle" fill={NEON} children="RATING" />
        <T f="sansBold" x={PW / 2} y={infoBot + 66} fontSize={26} textAnchor="middle" fill="#fff" children={'★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)} />

        {/* 바코드 */}
        <Rect x={BAND_X + 16} y={infoBot + 100} width={BAND_W - 32} height={88} rx={4} fill="#fff" />
        <Barcode seed={`${r.id}-band`} x={BAND_X + 26} y={infoBot + 108} width={BAND_W - 52} height={72} color={DARK} />
        <T f="mono" x={PW / 2} y={infoBot + 214} fontSize={16} letterSpacing={4} textAnchor="middle" fill="#fff" opacity={0.8} children={serial} />
        <T f="sans" x={PW / 2} y={infoBot + 250} fontSize={14} textAnchor="middle" fill="#fff" opacity={0.45} children={`${BRAND.ko} · 그날의 손목`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
