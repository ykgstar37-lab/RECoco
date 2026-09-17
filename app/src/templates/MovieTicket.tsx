// 영화 입장권: 분홍 감열지, 위/아래 가운데 큰 홈 + 잔 홈
import type { ComponentProps } from 'react';
import Svg, { G, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, pad2, seededRandom } from '../lib/format';
import { fitLine, fitLines, measure } from '../lib/text';
import { BRAND, FONTS } from '../theme';
import { MovieRecord } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 640;
const PAD = 16;
const BASE_H = 1268;
const INK = '#1d1a1c';
const PAPER = '#f2e6ee';
const M = 40; // 좌우 여백
const TITLE_LINE = 70;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'mono', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

const SMALL = [44, 118, 196, 444, 522, 596]; // 잔 홈 중심 x
const SMALL_R = 8;
const BIG_R = 40;

/** 위쪽 가장자리를 왼→오로 그리는 path 조각 (y=0 기준, 아래로 파인 홈) */
function edge(forward: boolean) {
  const notches = [...SMALL.map((x) => ({ x, r: SMALL_R })), { x: PW / 2, r: BIG_R }].sort((a, b) => a.x - b.x);
  const list = forward ? notches : [...notches].reverse();
  return list
    .map(({ x, r }) => (forward ? `L${x - r},0 A${r},${r} 0 0 0 ${x + r},0` : `L${x + r},0 A${r},${r} 0 0 0 ${x - r},0`))
    .join(' ');
}

function ticketPath(h: number) {
  // 아래쪽은 위쪽 조각을 뒤집어서(y → h - y) 사용
  const bottom = edge(false).replace(/(-?\d+(?:\.\d+)?),0/g, (_, x) => `${x},${h}`).replace(/0 0 0/g, '0 0 0');
  return `M0,0 ${edge(true)} L${PW},0 L${PW},${h} ${bottom} L0,${h} Z`;
}

function DoubleRule({ y }: { y: number }) {
  return (
    <G>
      <Line x1={M} y1={y} x2={PW - M} y2={y} stroke={INK} strokeWidth={1.4} strokeDasharray="7 3" />
      <Line x1={M} y1={y + 5} x2={PW - M} y2={y + 5} stroke={INK} strokeWidth={1.4} strokeDasharray="7 3" />
    </G>
  );
}

function computeLayout(r: MovieRecord) {
  const title = fitLines(r.title.trim() || '제목 없음', PW - M * 2, 64, 44, 2, 'sans');
  const extra = (title.lines.length - 1) * TITLE_LINE;
  return { title, extra };
}

export function layoutMovie(r: MovieRecord): TemplateLayout {
  const { extra } = computeLayout(r);
  return { width: PW + PAD * 2, height: BASE_H + extra + PAD * 2 + 14, foldAt: 560 + extra + PAD, displayRatio: 0.9, inset: { top: PAD, bottom: PAD + 14 } };
}

export function MovieTicket({ record: r, width }: { record: MovieRecord; width: number }) {
  const L = layoutMovie(r);
  const { title, extra } = computeLayout(r);
  const PH = BASE_H + extra;
  const shape = ticketPath(PH);

  const rnd = seededRandom(r.id);
  const num = () => String(1000 + Math.floor(rnd() * 9000));
  const booking = `${num()}-${num()}`;
  const serial = `${booking}-${num()}`;
  const printed = new Date(r.createdAt);
  const issuedAt = `${r.date.replace(/-/g, '.')} ${pad2(printed.getHours())}:${pad2(printed.getMinutes())}`;
  const stars = '★★★★★'.slice(0, r.stars) + '☆☆☆☆☆'.slice(0, 5 - r.stars);
  const people = Math.max(1, r.people || 1);

  const header = fitLine(`${BRAND.ko} 영화입장권`, PW - M * 2, 54, 36, 'sans');
  const head = fitLine(`${r.date} / ${r.theater.trim() || '극장'}`, PW - M * 2 - 150, 25, 18, 'mono');
  const original = fitLine(r.originalTitle.trim(), PW - M * 2, 26, 18, 'sans');
  const theater = fitLine(r.theater.trim() || '-', PW - 180 - M, 23, 16, 'mono');
  const dateBar = `${dotDateWithDay(r.date)} ${r.time}`;
  const dateBarW = measure(dateBar, 34, 'sans') + 22;
  const notes = [
    '* 티켓 미지참 시 관람이 불가합니다.',
    '* 상영시간 10분 전까지 입장해 주시기 바랍니다.',
    '* 영화 상영 후에는 교환 및 환불이 불가합니다.',
    '* 쾌적한 관람을 위해 휴대폰은 진동으로 설정해 주세요.',
  ];
  if (r.runtime.trim()) notes.push(`* 본 영화는 약 ${r.runtime.trim()}분 상영됩니다.`);

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={shape} />
        <Path d={shape} fill={PAPER} />

        <T f="sansHeavy" x={PW / 2} y={138} fontSize={header.size} textAnchor="middle" children={header.text} />
        <T x={M} y={206} fontSize={head.size} children={head.text} />
        <T x={PW - M} y={206} fontSize={25} textAnchor="end" children="[전체발권]" />
        <DoubleRule y={230} />
        <T x={M} y={282} fontSize={24} children={`${r.format.trim() || '2D'}, ${r.ageRating.trim() || '전체관람가'}`} />

        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={M - 2} y={352 + i * TITLE_LINE} fontSize={title.size} children={line} />
        ))}
        <G transform={`translate(0 ${extra})`}>
          {!!original.text && <T f="sans" x={M} y={390} fontSize={original.size} children={original.text} />}
          <Rect x={M - 2} y={408} width={dateBarW} height={52} fill={INK} />
          <T f="sansBold" x={M + 9} y={446} fontSize={34} fill={PAPER} children={dateBar} />
          <T f="sansHeavy" x={M} y={516} fontSize={40} children={`${r.screen.trim() || '1관'} ${r.seat.trim()}`.trim()} />
          <DoubleRule y={546} />

          <T f="sansBold" x={M} y={602} fontSize={30} children={`총 인원 ${people}명`} />
          <T x={M} y={642} fontSize={27} children={`일반 ${people}매`} />
          <T x={M} y={682} fontSize={27} children={`예매번호 ${booking}`} />
          <DoubleRule y={712} />

          <T x={M} y={760} fontSize={23} children="관람평" />
          <T f="sans" x={172} y={762} fontSize={25} fill="#b8322a" letterSpacing={2} children={stars} />
          <T x={M} y={796} fontSize={23} children="발권일시" />
          <T x={172} y={796} fontSize={23} children={issuedAt} />
          <T x={M} y={832} fontSize={23} children="판매처" />
          <T x={172} y={832} fontSize={theater.size} children={theater.text} />
          <DoubleRule y={858} />

          {notes.map((n, i) => (
            <T key={i} x={M} y={906 + i * 34} fontSize={21} children={n} />
          ))}
          <Barcode seed={r.id} x={(PW - 420) / 2} y={1090} width={420} height={92} color={INK} />
          <T x={PW / 2} y={1218} fontSize={24} textAnchor="middle" letterSpacing={1} children={serial} />
        </G>

        <PaperOverlay id={`mv-${r.id}`} d={shape} width={PW} height={PH} />
      </G>
    </Svg>
  );
}
