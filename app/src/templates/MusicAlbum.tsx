// 음악 (앨범 카드): 커버를 크게 두고 아티스트·별점·한 줄 감상을 적는 카드
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Rect, Text } from 'react-native-svg';

import { dotDateWithDay, seededRandom } from '../lib/format';
import { fitLine, fitLines } from '../lib/text';
import { BRAND, PAPER_FONTS as FONTS } from '../theme';
import { MusicRecord } from '../types';
import { PaperOverlay, PaperShadow, TemplateLayout } from './shared';

const PW = 560;
const PAD = 16;
const M = 40;
const PAPER = '#f7f5ef';
const INK = '#242129';
const SUB = '#8e8a97';
const LINE = '#e0dcd4';
const ACCENT = '#c0563f';

const COVER = PW - M * 2;
const TITLE_LINE = 46;
const TRACK_ROW = 40;

type TProps = ComponentProps<typeof Text> & { f?: keyof typeof FONTS };
const T = ({ f = 'sans', ...p }: TProps) => <Text fill={INK} fontFamily={FONTS[f]} {...p} />;

function computeLayout(r: MusicRecord) {
  const coverTop = 128;
  const title = fitLines(r.title.trim() || '제목 없음', PW - M * 2, 40, 26, 2, 'sansHeavy');
  const titleTop = coverTop + COVER + 46;
  const artistTop = titleTop + (title.lines.length - 1) * TITLE_LINE + 36;
  const infoTop = artistTop + 30;
  const tracks = r.tracks.filter((t) => t.title.trim()).slice(0, 5);
  const tracksTop = infoTop + 58;
  const tracksBot = tracksTop + (tracks.length ? 34 + tracks.length * TRACK_ROW : 0);
  const starsTop = tracksBot + 24;
  const memo = r.memo.trim() ? fitLines(r.memo.trim(), PW - M * 2, 27, 21, 3, 'hand') : null;
  const memoTop = starsTop + 84;
  const height = memoTop + (memo ? memo.lines.length * 36 + 10 : 0) + 84;
  return { coverTop, title, titleTop, artistTop, infoTop, tracks, tracksTop, tracksBot, starsTop, memo, memoTop, height };
}

export function layoutMusicAlbum(r: MusicRecord): TemplateLayout {
  const { height, coverTop } = computeLayout(r);
  return { width: PW + PAD * 2, height: height + PAD * 2 + 14, foldAt: coverTop + COVER + PAD + 14, displayRatio: 0.88, inset: { top: PAD, bottom: PAD + 14 } };
}

const cardPath = (h: number, connected: boolean) => (connected ? `M0,0 H${PW} V${h} H0 Z` : `M14,0 H${PW - 14} Q${PW},0 ${PW},14 V${h - 14} Q${PW},${h} ${PW - 14},${h} H14 Q0,${h} 0,${h - 14} V14 Q0,0 14,0 Z`);

/** 커버가 없을 때 그리는 레코드판 */
function Vinyl({ cx, cy, r: rad, seed }: { cx: number; cy: number; r: number; seed: string }) {
  const rnd = seededRandom(seed);
  const hue = ['#8d6bb5', '#5b83b5', '#c0563f', '#3f7f6a'][Math.floor(rnd() * 4)];
  return (
    <G>
      <Circle cx={cx} cy={cy} r={rad} fill="#1c1a20" />
      {[0.86, 0.72, 0.58, 0.44].map((k) => (
        <Circle key={k} cx={cx} cy={cy} r={rad * k} fill="none" stroke="#2f2c36" strokeWidth={2} />
      ))}
      <Circle cx={cx} cy={cy} r={rad * 0.3} fill={hue} />
      <Circle cx={cx} cy={cy} r={rad * 0.06} fill={PAPER} />
    </G>
  );
}

export function MusicAlbum({ record: r, width, connected = false }: { record: MusicRecord; width: number; connected?: boolean }) {
  const L = layoutMusicAlbum(r);
  const { coverTop, title, titleTop, artistTop, infoTop, tracks, tracksTop, tracksBot, starsTop, memo, memoTop, height } = computeLayout(r);
  const shape = cardPath(height, connected);
  const id = `album-${r.id}`;
  const artist = fitLine(r.artist.trim() || '아티스트', PW - M * 2, 24, 16, 'sansBold');
  const info = [r.year.trim(), r.label.trim(), r.place.trim() && `${r.place.trim()}에서`].filter(Boolean).join('  ·  ');

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shape} />}
        <Defs>
          <ClipPath id={`${id}-cover`}>
            <Rect x={M} y={coverTop} width={COVER} height={COVER} rx={4} />
          </ClipPath>
        </Defs>
        <Path d={shape} fill={PAPER} />

        {/* 머리 */}
        <T f="monoBold" x={M} y={62} fontSize={13} letterSpacing={5} fill={ACCENT} children="NOW PLAYING" />
        <T f="mono" x={PW - M} y={62} fontSize={13} letterSpacing={1} fill={SUB} textAnchor="end" children={dotDateWithDay(r.date)} />
        <Line x1={M} y1={86} x2={PW - M} y2={86} stroke={INK} strokeWidth={2.5} />

        {/* 커버 */}
        {r.photo ? (
          <G>
            <Image href={{ uri: r.photo.uri }} x={M} y={coverTop} width={COVER} height={COVER} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-cover)`} />
            <Rect x={M} y={coverTop} width={COVER} height={COVER} rx={4} fill="none" stroke={LINE} strokeWidth={2} />
          </G>
        ) : (
          <G>
            <Rect x={M} y={coverTop} width={COVER} height={COVER} rx={4} fill="#efece4" stroke={LINE} strokeWidth={2} />
            <Vinyl cx={M + COVER / 2} cy={coverTop + COVER / 2} r={COVER * 0.33} seed={r.id} />
          </G>
        )}

        {/* 제목 · 아티스트 */}
        {title.lines.map((line, i) => (
          <T key={i} f="sansHeavy" x={M} y={titleTop + i * TITLE_LINE} fontSize={title.size} children={line} />
        ))}
        <T f="sansBold" x={M} y={artistTop} fontSize={artist.size} fill={ACCENT} children={artist.text} />
        {!!info && <T x={M} y={infoTop + 20} fontSize={15} fill={SUB} children={fitLine(info, PW - M * 2, 15, 12, 'sans').text} />}

        {/* 좋았던 곡 */}
        {!!tracks.length && (
          <G>
            <T f="monoBold" x={M} y={tracksTop + 14} fontSize={12} letterSpacing={3} fill={SUB} children="TRACKS" />
            <Line x1={M} y1={tracksTop + 26} x2={PW - M} y2={tracksTop + 26} stroke={LINE} strokeWidth={1.5} />
            {tracks.map((t, i) => {
              const y = tracksTop + 34 + i * TRACK_ROW;
              const name = fitLine(t.title.trim(), PW - M * 2 - 150, 19, 14, 'sansBold');
              return (
                <G key={i}>
                  <T f="mono" x={M} y={y + 26} fontSize={14} fill={SUB} children={String(i + 1).padStart(2, '0')} />
                  <T f="sansBold" x={M + 34} y={y + 26} fontSize={name.size} children={name.text} />
                  <T f="sans" x={PW - M} y={y + 26} fontSize={15} fill={ACCENT} textAnchor="end" children={'★'.repeat(t.stars)} />
                </G>
              );
            })}
          </G>
        )}

        {/* 별점 */}
        <T f="monoBold" x={M} y={starsTop + 30} fontSize={12} letterSpacing={3} fill={SUB} children="RATING" />
        <T f="sansBold" x={PW - M} y={starsTop + 32} fontSize={24} fill={ACCENT} textAnchor="end" children={'★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)} />

        {/* 한 줄 */}
        {memo?.lines.map((line, i) => (
          <T key={i} f="hand" x={M} y={memoTop + i * 36} fontSize={memo.size} children={line} />
        ))}
        <T f="mono" x={PW / 2} y={height - 34} fontSize={12} letterSpacing={4} fill={SUB} textAnchor="middle" children={`${BRAND.ko} · ON REPEAT`} />

        <PaperOverlay id={id} d={shape} width={PW} height={height} wrinkle="none" surface="grain" />
      </G>
    </Svg>
  );
}
