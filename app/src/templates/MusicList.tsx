// 음악 (플레이리스트 영수증): 들은 곡이 영수증 품목처럼 주르르 찍히는 좁고 긴 종이
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { MusicRecord } from '../types';
import { Barcode, PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 470;
const PAD = 16;
const M = 34;
const PAPER = '#fbfaf6';
const INK = '#24242a';
const SUB = '#94939c';
const LINE = '#e2e0da';

const TRACK_ROW = 54;
const TITLE_LINE = 38;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: MusicRecord) {
  const title = fitLines(r.title.trim() || '오늘의 플레이리스트', PW - M * 2, 32, 22, 2, 'sansHeavy');
  const headBot = 128 + title.lines.length * TITLE_LINE;
  const photoH = r.photo ? Math.round(Math.min(280, Math.max(180, ((PW - M * 2) * r.photo.height) / Math.max(1, r.photo.width)))) : 0;
  const photoTop = headBot + 16;
  const infoTop = photoTop + (photoH ? photoH + 26 : 0);
  const info: [string, string][] = [
    ['DATE', dotDateWithDay(r.date)],
    ...((r.artist.trim() ? [['ARTIST', r.artist.trim()]] : []) as [string, string][]),
    ...((r.place.trim() ? [['WHERE', r.place.trim()]] : []) as [string, string][]),
  ];
  const infoBot = infoTop + info.length * 34;
  const tracks = r.tracks.filter((t) => t.title.trim()).slice(0, 10);
  const listTop = infoBot + 28;
  const listBot = listTop + 44 + Math.max(1, tracks.length) * TRACK_ROW;
  const totalTop = listBot + 12;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2, 24, 19, 3, 'hand') : null;
  const memoTop = totalTop + 76;
  const barTop = memoTop + (memo ? memo.lines.length * 34 + 16 : 0);
  const height = barTop + 130;
  return { title, headBot, photoH, photoTop, infoTop, info, infoBot, tracks, listTop, listBot, totalTop, memo, memoTop, barTop, height };
}

export function layoutMusicList(r: MusicRecord): TemplateLayout {
  const { height, listTop } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: listTop + PAD, displayRatio: 0.78, inset: { top: PAD, bottom: PAD + 14 } };
}

/** 위아래가 뜯긴 영수증 종이 */
function paperPath(h: number, seed: string, connected: boolean) {
  if (connected) return `M0,0 H${PW} V${h} H0 Z`;
  const rnd = seededRandom(seed);
  let d = 'M0,7';
  for (let x = 12; x < PW; x += 12) d += ` L${x},${(3 + rnd() * 6).toFixed(1)}`;
  d += ` L${PW},7 V${h - 7}`;
  for (let x = PW - 12; x > 0; x -= 12) d += ` L${x},${(h - 3 - rnd() * 6).toFixed(1)}`;
  return `${d} L0,${h - 7} Z`;
}

export function MusicList({ record: r, width, connected = false }: { record: MusicRecord; width: number; connected?: boolean }) {
  const L = layoutMusicList(r);
  const { title, headBot, photoH, photoTop, infoTop, info, infoBot, tracks, listTop, listBot, totalTop, memo, memoTop, barTop, height } = computeLayout(r);
  const shape = paperPath(height, r.id, connected);
  const id = `mlist-${r.id}`;
  const rnd = seededRandom(`${r.id}-no`);
  const serial = String(1 + Math.floor(rnd() * 999999)).padStart(6, '0');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-photo`}>
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={4} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />

        {/* 머리 */}
        <T f="monoBold" x={PW / 2} y={62} fontSize={13} letterSpacing={5} textAnchor="middle" fill={SUB} children="PLAYLIST RECEIPT" />
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={PW / 2} y={108 + i * TITLE_LINE} fontSize={title.size} textAnchor="middle" children={line} />
        ))}
        <Line x1={M} y1={headBot - 12} x2={PW - M} y2={headBot - 12} stroke={INK} strokeWidth={2} strokeDasharray="5 5" />

        {/* 사진 */}
        {!!photoH && (
          <G>
            <Image href={{ uri: r.photo!.uri }} x={M} y={photoTop} width={PW - M * 2} height={photoH} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-photo)`} />
            <Rect x={M} y={photoTop} width={PW - M * 2} height={photoH} rx={4} fill="none" stroke={LINE} strokeWidth={1.5} />
          </G>
        )}

        {/* 정보 줄 */}
        {info.map(([k, v], i) => {
          const y = infoTop + i * 34;
          const value = fitLine(v, PW - M * 2 - 110, 16, 12, 'sansBold');
          return (
            <G key={k}>
              <T f="mono" x={M} y={y + 20} fontSize={12} letterSpacing={2} fill={SUB} children={k} />
              <T f="sansBold" x={PW - M} y={y + 20} fontSize={value.size} textAnchor="end" children={value.text} />
            </G>
          );
        })}
        <Line x1={M} y1={infoBot + 8} x2={PW - M} y2={infoBot + 8} stroke={LINE} strokeWidth={1.5} strokeDasharray="3 5" />

        {/* 곡 목록 */}
        <T f="mono" x={M} y={listTop + 22} fontSize={12} letterSpacing={2} fill={SUB} children="TRACK" />
        <T f="mono" x={PW - M} y={listTop + 22} fontSize={12} letterSpacing={2} fill={SUB} textAnchor="end" children="RATING" />
        <Line x1={M} y1={listTop + 34} x2={PW - M} y2={listTop + 34} stroke={INK} strokeWidth={1.5} />
        {tracks.length ? (
          tracks.map((t, i) => {
            const y = listTop + 44 + i * TRACK_ROW;
            const name = fitLine(t.title.trim(), PW - M * 2 - 120, 19, 13, 'sansBold');
            const who = t.artist.trim() || r.artist.trim();
            return (
              <G key={i}>
                <T f="sansBold" x={M} y={y + 24} fontSize={name.size} children={name.text} />
                {!!who && <T x={M} y={y + 44} fontSize={13} fill={SUB} children={fitLine(who, PW - M * 2 - 120, 13, 10, 'sans').text} />}
                <T f="sans" x={PW - M} y={y + 30} fontSize={16} fill={INK} textAnchor="end" children={'★'.repeat(t.stars) + '☆'.repeat(5 - t.stars)} />
              </G>
            );
          })
        ) : (
          <T x={PW / 2} y={listTop + 78} fontSize={15} fill={SUB} textAnchor="middle" children="곡을 적어보세요" />
        )}

        {/* 합계 */}
        <Line x1={M} y1={listBot} x2={PW - M} y2={listBot} stroke={INK} strokeWidth={1.5} strokeDasharray="4 4" />
        <T f="sansBold" x={M} y={totalTop + 34} fontSize={19} children="TOTAL" />
        <T f="sansHeavy" x={PW - M} y={totalTop + 34} fontSize={24} textAnchor="end" children={`${tracks.length}곡`} />

        {/* 한 줄 */}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={memoTop + i * 34} fontSize={memo.size} children={line} />
        ))}

        {/* 바코드 */}
        <Barcode seed={`${r.id}-music`} x={M + 10} y={barTop} width={PW - M * 2 - 20} height={58} color={INK} />
        <T f="mono" x={PW / 2} y={barTop + 84} fontSize={13} letterSpacing={3} textAnchor="middle" fill={SUB} children={serial} />
        <T f="mono" x={PW / 2} y={barTop + 110} fontSize={11} letterSpacing={4} textAnchor="middle" fill={SUB} children={`${BRAND.ko} · ON REPEAT`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
