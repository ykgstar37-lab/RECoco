// 독서 영수증: 서점 키오스크의 "도서 위치 안내" 감열지 출력물
import type { ComponentProps } from 'react';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text } from 'react-native-svg';

import { pad2, parseDate, seededRandom } from '../lib/format';
import { FontMetric, fitLine, fitLines, measure } from '../lib/text';
import { BRAND, FONTS } from '../theme';
import { ReadingRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout, serratedRect } from './shared';

const PW = 600;
const PAD = 16;
const BASE_H = 1712;
const INK = '#1b1b1b';
const LX = 42; // 라벨 열
const VX = 162; // 값 열
const VW = PW - VX - 38;
const PAPER = '#f6f6f3';

const ZONES = [
  { code: 'A', name: '문학', keys: ['문학', '소설', '시', '에세이', '산문', '동화'] },
  { code: 'B', name: '인문', keys: ['인문', '철학', '역사', '고전', '종교', '심리'] },
  { code: 'C', name: '사회과학', keys: ['사회', '경제', '경영', '정치', '과학', '자기계발', 'IT', '기술'] },
  { code: 'D', name: '예술/취미', keys: ['예술', '취미', '여행', '요리', '만화', '디자인', '음악', '사진'] },
];
const SHELVES = 11;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;
const metricOf = (f: keyof typeof FONTS): FontMetric => (f.startsWith('mono') ? 'mono' : 'sans');

function computeLayout(r: ReadingRecord) {
  const title = fitLines(r.title.trim() || '제목 없음', VW, 24, 19, 3, 'sans');
  const titleExtra = (title.lines.length - 1) * 34;
  const memoText = r.memo.trim();
  const memo = memoText ? fitLines(memoText, VW, 22, 19, 6, 'sans') : null;
  const memoExtra = memo ? Math.max(0, memo.lines.length - 2) * 34 : 0;
  return { title, titleExtra, memo, memoExtra };
}

export function layoutReading(r: ReadingRecord): TemplateLayout {
  const { titleExtra, memoExtra } = computeLayout(r);
  return {
    width: PW + PAD * 2,
    height: BASE_H + titleExtra + memoExtra + PAD * 2 + 12,
    foldAt: 660 + titleExtra + PAD,
    displayRatio: 1,
  };
}

function BookMark({ x, y }: { x: number; y: number }) {
  // 펼친 책 + 책갈피 (자체 로고)
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M-2,6 C-12,-1 -25,-2 -34,2 L-34,36 C-25,32 -12,33 -2,40 Z" fill={INK} />
      <Path d="M2,6 C12,-1 25,-2 34,2 L34,36 C25,32 12,33 2,40 Z" fill={INK} />
      <Path d="M17,1 L17,20 L21.5,16 L26,20 L26,0.5" fill={PAPER} />
    </G>
  );
}

export function ReadingReceipt({ record: r, width }: { record: ReadingRecord; width: number }) {
  const L = layoutReading(r);
  const { title, titleExtra, memo, memoExtra } = computeLayout(r);
  const PH = BASE_H + titleExtra + memoExtra;
  const paper = serratedRect(PW, PH);

  const genre = r.genre.trim();
  const rnd = seededRandom(r.id + r.title);
  const matched = ZONES.findIndex((z) => z.keys.some((k) => genre.includes(k)));
  const zone = ZONES[matched >= 0 ? matched : Math.floor(rnd() * 4)];
  const shelf = 1 + Math.floor(rnd() * SHELVES);
  const tier = 1 + Math.floor(rnd() * 4);
  const code = `${zone.code}-${shelf}-${tier}`;

  const printed = new Date(r.createdAt);
  const d = parseDate(r.date);
  const printedAt = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(printed.getHours())}:${pad2(printed.getMinutes())}:${pad2(printed.getSeconds())}`;
  const place = r.place.trim() || '나의 서재';
  const placeFit = fitLine(place, 480, 23, 16, 'sans');

  // 헤더(로고 + 상호 | 슬로건)를 실제 글자 폭으로 계산해 가운데 정렬
  const brand = `${BRAND.ko}문고`;
  const brandW = measure(brand, 44, 'sans');
  const sloganW = Math.max(measure('오늘 읽은 한 권이', 17, 'sans'), measure('내일의 나를 만듭니다', 17, 'sans'));
  const headW = 68 + 12 + brandW + 18 + 16 + sloganW;
  const hx = (PW - headW) / 2;

  const rows: [string, string, keyof typeof FONTS][] = [
    ['저자', r.author.trim() || '-', 'sans'],
    ['출판사', r.publisher.trim() || '-', 'sans'],
    ['분야', genre || '-', 'sans'],
    ['상태', r.status, 'sans'],
  ];

  const y1 = titleExtra;
  const y2 = titleExtra + memoExtra;

  // 안내도 좌표
  const shelfX = (i: number) => 118 + (i - 1) * 30;
  const sx = shelfX(shelf);
  const pillW = measure(code, 20, 'sans') + 30;
  const pillX = Math.min(440 - pillW, Math.max(58, sx + 7 - pillW / 2));

  const findLines = memo
    ? memo.lines
    : [`${zone.code}구역으로 이동하신 후,`, `${shelf}번 서가의 ${tier}단에서 찾아주세요.`];

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <PaperShadow d={paper} />
        <Path d={paper} fill={PAPER} />

        {/* ── 헤더 ── */}
        <BookMark x={hx + 34} y={52} />
        <T f="sansHeavy" x={hx + 80} y={96} fontSize={44} children={brand} />
        <Line x1={hx + 80 + brandW + 18} y1={58} x2={hx + 80 + brandW + 18} y2={104} stroke={INK} strokeWidth={1.3} />
        <T x={hx + 80 + brandW + 34} y={76} fontSize={17} children="오늘 읽은 한 권이" />
        <T x={hx + 80 + brandW + 34} y={99} fontSize={17} children="내일의 나를 만듭니다" />
        <T x={PW / 2} y={144} fontSize={placeFit.size} textAnchor="middle" children={placeFit.text} />
        <Line x1={40} y1={164} x2={PW - 40} y2={164} stroke={INK} strokeWidth={1.4} />
        <T x={PW / 2} y={200} fontSize={19} textAnchor="middle" children="—   한 권 한 권, 기록이 쌓입니다   —" />
        <T f="sansHeavy" x={PW / 2} y={286} fontSize={54} textAnchor="middle" children="도서 위치 안내" />
        <T x={PW / 2} y={326} fontSize={22} textAnchor="middle" children="고객님이 읽으신 도서의 위치를 안내합니다." />
        <Line x1={40} y1={360} x2={PW - 40} y2={360} stroke="#444" strokeDasharray="6 4" />

        {/* ── 도서 정보 ── */}
        <T x={LX} y={405} fontSize={23} children="출력일시" />
        <T x={VX} y={405} fontSize={23} children={printedAt} />
        <T x={LX} y={446} fontSize={23} children="도서명" />
        {title.lines.map((line, i) => (
          <T key={i} f="sansBold" x={VX} y={446 + i * 34} fontSize={title.size} children={line} />
        ))}
        {rows.map(([k, v, f], i) => {
          const fit = fitLine(v, VW, 23, 17, metricOf(f));
          return (
            <G key={k}>
              <T x={LX} y={487 + y1 + i * 41} fontSize={23} children={k} />
              <T f={f} x={VX} y={487 + y1 + i * 41} fontSize={fit.size} children={fit.text} />
            </G>
          );
        })}
        <Line x1={40} y1={645 + y1} x2={PW - 40} y2={645 + y1} stroke={INK} strokeWidth={1.4} />

        {/* ── 위치 ── */}
        <T f="sansBold" x={LX} y={728 + y1} fontSize={26} children="위치코드" />
        <Rect x={VX} y={672 + y1} width={PW - 40 - VX} height={96} rx={7} fill="none" stroke={INK} strokeWidth={1.6} />
        <T f="sansHeavy" x={(VX + PW - 40) / 2} y={747 + y1} fontSize={70} textAnchor="middle" children={code} />
        <T f="sansBold" x={LX} y={818 + y1} fontSize={24} children="서가 위치" />
        <T f="sansBold" x={VX} y={818 + y1} fontSize={24} children={`${zone.code}구역 ${shelf}번 서가 ${tier}단`} />
        <Line x1={40} y1={850 + y1} x2={PW - 40} y2={850 + y1} stroke={INK} strokeWidth={1.4} />

        <T f="sansBold" x={LX} y={896 + y1} fontSize={24} children={memo ? '남긴 문장' : '찾는 방법'} />
        {findLines.map((line, i) => (
          <T key={i} x={VX} y={896 + y1 + i * 34} fontSize={memo ? memo.size : 22} children={line} />
        ))}
        <Line x1={40} y1={968 + y2} x2={PW - 40} y2={968 + y2} stroke={INK} strokeWidth={1.4} />

        {/* ── 안내도 ── */}
        <G transform={`translate(0 ${y2})`}>
          <T f="sansHeavy" x={LX} y={1018} fontSize={25} children="서재 안내도 (3F 문학 · 인문 · 예술)" />
          {/* 외벽: 아래쪽은 출입구만큼 비워둔다 */}
          <Path d="M232,1452 H42 V1040 H558 V1452 H328" fill="none" stroke={INK} strokeWidth={2.6} />
          {ZONES.map((z, i) => {
            const zx = 56 + i * 122;
            const on = z.code === zone.code;
            return (
              <G key={z.code}>
                <Rect x={zx} y={1054} width={122} height={88} fill={on ? '#d6d6d4' : 'none'} stroke={INK} strokeWidth={1.3} />
                <T f="sansHeavy" x={zx + 61 - 20} y={1092} fontSize={22} textAnchor="middle" children={z.code} />
                <T f="sansBold" x={zx + 61 + 10} y={1091} fontSize={17} textAnchor="middle" children="구역" />
                <T x={zx + 61} y={1120} fontSize={15} textAnchor="middle" children={`(${z.name})`} />
              </G>
            );
          })}
          {/* 벽면 서가 + 일반 서가 */}
          <Rect x={62} y={1166} width={30} height={112} fill="none" stroke={INK} strokeWidth={1.3} />
          <Line x1={77} y1={1166} x2={77} y2={1278} stroke={INK} strokeWidth={1} />
          {Array.from({ length: SHELVES }, (_, k) => k + 1).map((i) =>
            i === shelf ? null : (
              <Rect key={i} x={shelfX(i)} y={1172} width={13} height={96} fill="none" stroke={INK} strokeWidth={1.2} />
            ),
          )}
          <Rect x={sx - 1.5} y={1172} width={16} height={96} fill={INK} />
          <Circle cx={sx + 6.5} cy={1208} r={4.5} fill={PAPER} />
          <Polygon points={`${sx + 6.5},${1274} ${sx - 3},${1288} ${sx + 16},${1288}`} fill={INK} />
          <Rect x={sx + 3.5} y={1286} width={6} height={10} fill={INK} />
          <Rect x={pillX} y={1296} width={pillW} height={38} rx={7} fill={INK} />
          <T f="sansHeavy" x={pillX + pillW / 2} y={1322} fontSize={20} textAnchor="middle" fill={PAPER} children={code} />

          {/* 오른쪽 벽 + 휴게공간 */}
          <Path d="M478,1142 V1168 H544" fill="none" stroke={INK} strokeWidth={1.3} />
          <Path d="M462,1452 V1318 H544" fill="none" stroke={INK} strokeWidth={1.3} />
          <T x={503} y={1346} fontSize={15} textAnchor="middle" children="휴게공간" />
          {[480, 526].map((px) => (
            <G key={px}>
              <Circle cx={px} cy={1374} r={7} fill="none" stroke={INK} strokeWidth={1.3} />
              <Rect x={px - 8} y={1384} width={16} height={30} rx={6} fill="none" stroke={INK} strokeWidth={1.3} />
            </G>
          ))}
          <Circle cx={503} cy={1400} r={7} fill="none" stroke={INK} strokeWidth={1.3} />

          {/* 에스컬레이터 (위치 말풍선과 겹치지 않게 아래쪽에) */}
          <T x={96} y={1368} fontSize={14} textAnchor="middle" children="에스컬레이터" />
          <T x={96} y={1385} fontSize={13} textAnchor="middle" children="(2F→3F)" />
          <Rect x={76} y={1394} width={40} height={50} fill="none" stroke={INK} strokeWidth={1.3} />
          <Path d="M82,1438 H89 V1430 H96 V1422 H103 V1414 H110" fill="none" stroke={INK} strokeWidth={1.2} />
          <Path d="M82,1418 H89 V1410 H96 V1402 H103 V1400 H110" fill="none" stroke={INK} strokeWidth={1.2} />

          {/* 안내데스크 · 계산대 */}
          <Rect x={140} y={1370} width={86} height={58} fill="none" stroke={INK} strokeWidth={1.3} />
          <T x={183} y={1391} fontSize={14} textAnchor="middle" children="안내데스크" />
          <Circle cx={183} cy={1410} r={9} fill="none" stroke={INK} strokeWidth={1.3} />
          <T f="sansBold" x={183} y={1415} fontSize={13} textAnchor="middle" children="i" />
          <Rect x={362} y={1370} width={80} height={58} fill="none" stroke={INK} strokeWidth={1.3} />
          <T x={402} y={1391} fontSize={14} textAnchor="middle" children="계산대" />
          <Circle cx={402} cy={1410} r={9} fill="none" stroke={INK} strokeWidth={1.3} />
          <T f="sansBold" x={402} y={1415} fontSize={12} textAnchor="middle" children="₩" />

          {/* 출입구 */}
          <Rect x={226} y={1432} width={11} height={38} fill={PAPER} stroke={INK} strokeWidth={1.6} />
          <Rect x={323} y={1432} width={11} height={38} fill={PAPER} stroke={INK} strokeWidth={1.6} />
          <T f="sansBold" x={280} y={1452} fontSize={18} textAnchor="middle" children="출입구" />

          {/* ── 안내 문구 ── */}
          <T x={LX} y={1512} fontSize={19} children={`※ 이 영수증은 ${BRAND.ko}에서 출력되었습니다.`} />
          <T x={LX} y={1544} fontSize={19} children="※ 읽은 기록은 시간이 지나도 사라지지 않습니다." />
          <T x={LX} y={1576} fontSize={19} children="※ 다음 책과도 좋은 만남이 되길 바랍니다." />
          <Line x1={40} y1={1606} x2={PW - 40} y2={1606} stroke="#444" strokeDasharray="6 4" />
          <T x={PW / 2} y={1648} fontSize={20} textAnchor="middle" children="오늘도 좋은 책과 함께, 좋은 하루 되세요." />
          <T x={PW / 2} y={1682} fontSize={20} textAnchor="middle" children={fitLine(place, 480, 20, 14, 'sans').text} />
        </G>

        <PaperOverlay id={`rd-${r.id}`} d={paper} width={PW} height={PH} />
      </G>
    </Svg>
  );
}
