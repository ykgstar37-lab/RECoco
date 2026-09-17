// 소비 영수증: 손으로 쓴 간이영수증 (한 번 접었다 편 종이)
import type { ReactNode } from 'react';
import Svg, { G, Line, Path, Rect, Text } from 'react-native-svg';

import { handDate, seededRandom, won } from '../lib/format';
import { fitLine } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { SpendingRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 640;
const PH = 1340;
const PAD = 16;
const L = 46;
const R = 598;
const INK = '#5a7ea6';
const PEN = '#23232b';
const MAX_ROWS = 15;

const sTop = 170;
const sRow = 54;
const sBot = sTop + sRow * 4;
const midA = 382;
const midB = 414;
const dTop = sBot;
const dHead = dTop + 38;
const dBot = dHead + 54;
const gTop = dBot;
const gBot = gTop + 40;
const cols = [L, 108, 340, 394, 458, R];
const hTop = gBot;
const hBot = hTop + 40;
const rowH = 46;
const iBot = hBot + rowH * MAX_ROWS;
const tBot = iBot + 52;

function paperPath() {
  let d = 'M0,6';
  for (let x = 0; x <= PW; x += 8) {
    const y = 3 + Math.sin(x * 0.37) * 1.6 + Math.sin(x * 0.11 + 1) * 1.8;
    d += ` L${x},${y.toFixed(1)}`;
  }
  return `${d} L${PW},${PH - 3} Q${PW - 2},${PH} ${PW - 8},${PH} L6,${PH} Q0,${PH} 1,${PH - 5} Z`;
}
const PAPER = paperPath();

export function layoutSpending(_r: SpendingRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2 + 14, foldAt: gBot + 24 + PAD, displayRatio: 0.94, inset: { top: PAD, bottom: PAD + 14 } };
}

export function SpendingReceipt({ record: r, width }: { record: SpendingRecord; width: number }) {
  const lay = layoutSpending(r);
  const rnd = seededRandom(r.id);
  const jitter = () => (rnd() - 0.5) * 2.4;

  const line = (x1: number, y1: number, x2: number, y2: number, w = 1.2) => (
    <Line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} />
  );
  const label = (x: number, y: number, s: string, size = 17): ReactNode => (
    <Text key={`${s}-${x}-${y}`} x={x} y={y} fontSize={size} textAnchor="middle" fill={INK} fontFamily={FONTS.serif}>
      {s}
    </Text>
  );
  // 손글씨: 필드마다 살짝 기울고, 칸 폭을 넘으면 글씨를 줄인다
  const hand = (key: string, x: number, y: number, s: string, size: number, maxW: number, anchor: 'start' | 'middle' | 'end' = 'start') => {
    if (!s) return null;
    const f = fitLine(s, maxW, Math.round(size * 1.22), 20, 'hand');
    const rot = jitter();
    return (
      <Text
        key={key}
        x={x}
        y={y}
        fontSize={f.size}
        textAnchor={anchor}
        fill={PEN}
        fontFamily={FONTS.hand}
        transform={`rotate(${rot.toFixed(2)} ${x} ${y})`}>
        {f.text}
      </Text>
    );
  };

  const items = r.items.filter((it) => it.name.trim()).slice(0, MAX_ROWS);
  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const [, m, d] = r.date.split('-').map((v) => parseInt(v, 10));
  const md = m && d ? `${m}/${d}` : '';
  const serialNo = String(1 + Math.floor(rnd() * 49));

  return (
    <Svg width={width} height={(width * lay.height) / lay.width} viewBox={`0 0 ${lay.width} ${lay.height}`}>
      <G transform={`translate(${PAD} ${PAD}) rotate(-0.6 ${PW / 2} ${PH / 2})`}>
        <PaperShadow d={PAPER} />
        <Path d={PAPER} fill="#faf8f1" />

        <G stroke={INK} fill="none" strokeLinecap="square">
          {line(L, 104, L + 110, 104, 1.1)}
          {line(L, 150, R - 64, 150, 1.1)}
          <Rect x={L} y={sTop} width={R - L} height={sBot - sTop} strokeWidth={2.2} />
          {line(L + 40, sTop, L + 40, sBot)}
          {line(L + 136, sTop, L + 136, sBot)}
          {[1, 2, 3].map((i) => line(L + 40, sTop + sRow * i, R, sTop + sRow * i))}
          {[1, 3].map((i) => [line(midA, sTop + sRow * i, midA, sTop + sRow * (i + 1)), line(midB, sTop + sRow * i, midB, sTop + sRow * (i + 1))])}
          <Rect x={L} y={dTop} width={R - L} height={dBot - dTop} strokeWidth={2.2} />
          {line(L, dHead, R, dHead)}
          {line(236, dTop, 236, dBot)}
          {line(492, dTop, 492, dBot)}
          <Rect x={L} y={gTop} width={R - L} height={gBot - gTop} strokeWidth={2.2} />
          <Rect x={L} y={hTop} width={R - L} height={tBot - hTop} strokeWidth={2.2} />
          {cols.slice(1, -1).map((x) => line(x, hTop, x, iBot))}
          {line(L, hBot, R, hBot, 1.6)}
          {Array.from({ length: MAX_ROWS - 1 }, (_, k) => k + 1).map((i) =>
            line(L, hBot + rowH * i, R, hBot + rowH * i, i % 5 === 0 ? 1.6 : 0.9),
          )}
          {line(L, iBot, R, iBot, 2)}
          {line(cols[2], iBot, cols[2], tBot)}
        </G>

        <G>
          <Text x={L + 4} y={96} fontSize={22} fill={INK} fontFamily={FONTS.serifBold}>
            NO.
          </Text>
          <Text x={329} y={98} fontSize={44} textAnchor="middle" letterSpacing={22} fill={INK} fontFamily={FONTS.serifBold}>
            영수증
          </Text>
          <Text x={R - 12} y={92} fontSize={17} textAnchor="end" fill={INK} fontFamily={FONTS.serif}>
            (공급받는자용)
          </Text>
          <Text x={R} y={146} fontSize={21} textAnchor="end" fill={INK} fontFamily={FONTS.serif}>
            귀하
          </Text>
          {['공', '급', '자'].map((c, i) => label(L + 20, sTop + 52 + i * 62, c, 21))}
          {label(L + 88, sTop + 24, '사 업 자', 15)}
          {label(L + 88, sTop + 44, '등록번호', 15)}
          {label(L + 88, sTop + sRow + 34, '상    호', 17)}
          {label(L + 88, sTop + sRow * 2 + 24, '사 업 장', 15)}
          {label(L + 88, sTop + sRow * 2 + 44, '소 재 지', 15)}
          {label(L + 88, sTop + sRow * 3 + 34, '업    태', 17)}
          {label((midA + midB) / 2, sTop + sRow + 24, '성', 15)}
          {label((midA + midB) / 2, sTop + sRow + 44, '명', 15)}
          {label((midA + midB) / 2, sTop + sRow * 3 + 24, '종', 15)}
          {label((midA + midB) / 2, sTop + sRow * 3 + 44, '목', 15)}
          {label((L + 236) / 2, dTop + 26, '작성년월일', 17)}
          {label((236 + 492) / 2, dTop + 26, '공급대가총액', 17)}
          {label((492 + R) / 2, dTop + 26, '비    고', 17)}
          <Text x={(L + R) / 2 + 7} y={gTop + 28} fontSize={20} textAnchor="middle" letterSpacing={14} fill={INK} fontFamily={FONTS.serif}>
            공급내역
          </Text>
          {label((cols[0] + cols[1]) / 2, hTop + 26, '월일', 16)}
          {label((cols[1] + cols[2]) / 2, hTop + 26, '품      목', 16)}
          {label((cols[2] + cols[3]) / 2, hTop + 26, '수량', 16)}
          {label((cols[3] + cols[4]) / 2, hTop + 26, '단가', 16)}
          {label((cols[4] + cols[5]) / 2, hTop + 20, '공급대가', 14)}
          {label((cols[4] + cols[5]) / 2, hTop + 35, '(금액)', 13)}
          <Text x={L - 8} y={hBot + rowH * 5 - 6} fontSize={15} textAnchor="end" fill={INK} fontFamily={FONTS.serif}>
            5
          </Text>
          <Text x={L - 8} y={hBot + rowH * 10 - 6} fontSize={15} textAnchor="end" fill={INK} fontFamily={FONTS.serif}>
            10
          </Text>
          {label((L + cols[2]) / 2, iBot + 34, '계', 21)}
          <Text x={cols[2] + 14} y={iBot + 36} fontSize={22} fill={INK} fontFamily={FONTS.serif}>
            ₩
          </Text>
          <Text x={R} y={tBot + 34} fontSize={17} textAnchor="end" fill={INK} fontFamily={FONTS.serif}>
            위 금액을 영수(청구)함
          </Text>
        </G>

        <G>
          {hand('no', L + 62, 100, serialNo, 38, 60)}
          {hand('customer', 250, 142, '나', 36, 260)}
          {hand('store', L + 150, sTop + sRow + 38, r.store, 32, midA - L - 156)}
          {hand('address', L + 150, sTop + sRow * 2 + 38, r.address, 30, R - L - 158)}
          {hand('biz-type', L + 150, sTop + sRow * 3 + 38, r.category, 32, midA - L - 156)}
          {hand('date', (L + 236) / 2, dHead + 38, handDate(r.date), 32, 180, 'middle')}
          {hand('total-top', 254, dHead + 38, `₩ ${won(total)}`, 32, 225)}
          {hand('memo', (492 + R) / 2, dHead + 40, r.memo, 30, 96, 'middle')}
          {items.map((it, i) => {
            const y = hBot + rowH * (i + 1) - 12;
            return (
              <G key={i}>
                {hand(`d${i}`, (cols[0] + cols[1]) / 2, y, md, 28, 58, 'middle')}
                {hand(`n${i}`, cols[1] + 10, y, it.name, 31, cols[2] - cols[1] - 16)}
                {hand(`q${i}`, (cols[2] + cols[3]) / 2, y, String(it.qty), 30, 48, 'middle')}
                {hand(`p${i}`, cols[4] - 6, y, won(it.price), 28, cols[4] - cols[3] - 8, 'end')}
                {hand(`a${i}`, R - 10, y, won(it.qty * it.price), 30, R - cols[4] - 16, 'end')}
              </G>
            );
          })}
          {hand('total', R - 14, iBot + 38, won(total), 34, 200, 'end')}
        </G>

        {/* 한 번 접었다 편 자국 */}
        <Path d={`M0,${PH * 0.37} C${PW * 0.3},${PH * 0.35} ${PW * 0.62},${PH * 0.39} ${PW},${PH * 0.365}`} stroke="#fff" strokeWidth={2.2} opacity={0.5} fill="none" />
        <Path d={`M0,${PH * 0.37 + 2.2} C${PW * 0.3},${PH * 0.35 + 2.2} ${PW * 0.62},${PH * 0.39 + 2.2} ${PW},${PH * 0.365 + 2.2}`} stroke="#6b5f48" strokeWidth={1} opacity={0.12} fill="none" />
        <PaperOverlay id={`sp-${r.id}`} d={PAPER} width={PW} height={PH} wrinkle="hand" surface="grain" />
      </G>
    </Svg>
  );
}
