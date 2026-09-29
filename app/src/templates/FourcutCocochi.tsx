// 인생네컷 유료 테마 "코코치": 네컷 사진 한 컷을 작은 열쇠고리 화면에 끼운다.
// 껍데기는 design/tools/make_cocochi.js 가 다듬은 그림(assets/cocochi/*.png)을 그대로 쓰고,
// 사진과 글자만 창 안에 얹는다. 원본이 바뀌면 그 스크립트를 다시 돌려 SPOT 을 갱신할 것.
//
// 뒤집으면 같은 열쇠고리 뒷모습이 나온다. 뒷면은 **몸통을 민색으로 꽉 채워 구운 그림**
// (`*-back.png`)이라 앞면 꾸밈이 한 올도 안 비친다. 사슬은 그대로 남아 같은 물건으로 읽힌다.
// 그 위에 날짜·제목·일기·위치(핀)·누구랑을 쓴다 — 작은 창에 몰아넣으면 서너 줄밖에 못 적는다.
//
// ⚠️ 달걀이라 네모난 종이가 아니다 → PaperShadow(네모 그림자)를 쓰지 않는다.
// 쓰면 투명한 배경에 옅은 회색 네모가 깔린다.
import type { ComponentProps } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Path, Rect, Text } from 'react-native-svg';

import { fitLine, fitLines, measure } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { CocochiColor, FourcutRecord } from '../types';
import { TemplateLayout } from './shared';

/** require 한 그림. 미리보기 도구에서는 { default: 'data:...' } 로 와서 한 겹 벗긴다 */
const asset = (m: unknown) => (m && typeof m === 'object' && 'default' in (m as Record<string, unknown>) ? (m as { default: number }).default : (m as number));

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** shell 은 색 동그라미용. back 은 몸통을 민색으로 꽉 채운 뒷면 그림(make_cocochi.js 가 굽는다) */
export const COCOCHI_COLORS: Record<CocochiColor, { name: string; shell: string; screen: string; ink: string; frame: number; back: number }> = {
  mint: { name: '민트', shell: '#afead9', screen: '#dff7ef', ink: '#1d6a59', frame: asset(require('../../assets/cocochi/mint.png')), back: asset(require('../../assets/cocochi/mint-back.png')) },
  pink: { name: '핑크', shell: '#f8b9d2', screen: '#ffeaf1', ink: '#8c3a58', frame: asset(require('../../assets/cocochi/pink.png')), back: asset(require('../../assets/cocochi/pink-back.png')) },
  purple: { name: '퍼플', shell: '#dbc0e9', screen: '#efe9ff', ink: '#4c3a8c', frame: asset(require('../../assets/cocochi/purple.png')), back: asset(require('../../assets/cocochi/purple-back.png')) },
  silver: { name: '실버', shell: '#a8abb5', screen: '#eef2f6', ink: '#3d4753', frame: asset(require('../../assets/cocochi/silver.png')), back: asset(require('../../assets/cocochi/silver-back.png')) },
  white: { name: '화이트', shell: '#e7dceb', screen: '#faf7f4', ink: '#4a4340', frame: asset(require('../../assets/cocochi/white.png')), back: asset(require('../../assets/cocochi/white-back.png')) },
};

export const COCOCHI_COLOR_IDS = Object.keys(COCOCHI_COLORS) as CocochiColor[];

/**
 * 그림 원본(1024×1024) 안에서 잰 자리 — `node design/tools/make_cocochi.js` 가 찍어준다.
 * crop: 바깥 투명 여백을 뺀 그림 자리 · win: 안에 갇힌 투명한 창(=화면)
 */
const SPOT: Record<CocochiColor, { crop: Box; win: Box; body: Box }> = {
  mint: { crop: { x: 72, y: 22, w: 938, h: 985 }, win: { x: 313, y: 295, w: 396, h: 403 }, body: { x: 72, y: 28, w: 842, h: 975 } },
  silver: { crop: { x: 59, y: 25, w: 961, h: 971 }, win: { x: 281, y: 291, w: 413, h: 403 }, body: { x: 59, y: 32, w: 851, h: 959 } },
  purple: { crop: { x: 57, y: 14, w: 964, h: 1000 }, win: { x: 300, y: 292, w: 392, h: 394 }, body: { x: 57, y: 19, w: 851, h: 991 } },
  pink: { crop: { x: 39, y: 7, w: 974, h: 999 }, win: { x: 285, y: 277, w: 413, h: 423 }, body: { x: 39, y: 13, w: 864, h: 989 } },
  white: { crop: { x: 37, y: 20, w: 981, h: 996 }, win: { x: 280, y: 286, w: 407, h: 411 }, body: { x: 37, y: 33, w: 859, h: 979 } },
};

const SHEET = 1024;
const PW = 600;
const PH = 620; // 달걀 모양이 세로로 살짝 길다
const PAD = 14;

/** 네컷 중 한 컷 (없으면 QR 로 받은 완성본) — 코코몬 카드와 같은 규칙 */
const artOf = (r: FourcutRecord) => r.photos.find(Boolean) ?? r.frameImage;

export const colorOf = (r: FourcutRecord): CocochiColor => (r.cocochiColor && COCOCHI_COLORS[r.cocochiColor] ? r.cocochiColor : 'mint');

export function layoutFourcutCocochi(_r: FourcutRecord): TemplateLayout {
  return { width: PW + PAD * 2, height: PH + PAD * 2, foldAt: 0, displayRatio: 0.78, inset: { top: PAD, bottom: PAD } };
}

const T = (p: ComponentProps<typeof Text> & { f?: keyof typeof FONTS }) => <Text {...p} fontFamily={FONTS[p.f ?? 'sans']} fill={p.fill ?? '#333'} />;

/** 원본 좌표를 카드 좌표로 옮기는 자 (가로·세로 배율이 조금 다르다) */
function ruler(color: CocochiColor) {
  const { crop } = SPOT[color];
  const kx = PW / crop.w;
  const ky = PH / crop.h;
  return {
    kx,
    ky,
    X: (v: number) => (v - crop.x) * kx,
    Y: (v: number) => (v - crop.y) * ky,
  };
}

function Shell({ color, id, back }: { color: CocochiColor; id: string; back?: boolean }) {
  const { kx, ky, X, Y } = ruler(color);
  const info = COCOCHI_COLORS[color];
  const { win } = SPOT[color];
  return (
    <G>
      {/* 뒷모습은 몸통을 민색으로 꽉 채운 그림을 좌우로 뒤집어 보여준다 (사슬이 반대쪽으로 간다) */}
      <G transform={back ? `translate(${PW} 0) scale(-1 1)` : undefined}>
        <Image href={back ? info.back : info.frame} x={X(0)} y={Y(0)} width={SHEET * kx} height={SHEET * ky} preserveAspectRatio="none" />
      </G>
      {/* 앞면의 창은 뚫려 있어서 뒤가 비친다 — 화면 바탕을 깔아준다 (뒷면은 이미 메워져 있다) */}
      {!back && (
        <Rect
          x={X(win.x)}
          y={Y(win.y)}
          width={X(win.x + win.w) - X(win.x)}
          height={Y(win.y + win.h) - Y(win.y)}
          fill={info.screen}
          clipPath={`url(#${id}-win)`}
        />
      )}
    </G>
  );
}

/** 창 자리 (뒷면은 좌우가 뒤집혀 있어 x 가 반대로 온다) */
function screenBox(color: CocochiColor, back: boolean): Box {
  const { X, Y } = ruler(color);
  const { win } = SPOT[color];
  const w = X(win.x + win.w) - X(win.x);
  const h = Y(win.y + win.h) - Y(win.y);
  return { x: back ? PW - X(win.x) - w : X(win.x), y: Y(win.y), w, h };
}

interface Props {
  record: FourcutRecord;
  width: number;
  connected?: boolean;
}

/** 앞면: 창에 사진 한 컷 */
export function FourcutCocochiFront({ record: r, width, connected }: Props) {
  const L = layoutFourcutCocochi(r);
  const color = colorOf(r);
  const id = `cocochi-${r.id}`;
  const art = artOf(r);
  const box = screenBox(color, false);

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Defs>
          <ClipPath id={`${id}-win`}>
            <Rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.w * 0.06} />
          </ClipPath>
        </Defs>

        <Shell color={color} id={id} />

        {art && <Image href={{ uri: art.uri }} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-win)`} />}
      </G>
    </Svg>
  );
}

/** 달걀 모양 (몸통 네모에 맞춘 알 곡선). 글이 테두리 밖으로 안 나가게 자르는 데 쓴다 */
function eggPath(b: Box) {
  const cx = b.x + b.w / 2;
  const r = b.x + b.w;
  const bot = b.y + b.h;
  return [
    `M ${cx} ${b.y}`,
    `C ${cx + b.w * 0.40} ${b.y} ${r} ${b.y + b.h * 0.30} ${r} ${b.y + b.h * 0.54}`,
    `C ${r} ${b.y + b.h * 0.84} ${cx + b.w * 0.33} ${bot} ${cx} ${bot}`,
    `C ${cx - b.w * 0.33} ${bot} ${b.x} ${b.y + b.h * 0.84} ${b.x} ${b.y + b.h * 0.54}`,
    `C ${b.x} ${b.y + b.h * 0.30} ${cx - b.w * 0.40} ${b.y} ${cx} ${b.y}`,
    'Z',
  ].join(' ');
}

/** 위치 앞에 붙는 핀 */
function Pin({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  const w = size * 0.72;
  return (
    <G transform={`translate(${x} ${y - size * 0.78}) scale(${w / 24} ${size / 32})`}>
      <Path d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 32 12 32 C12 32 24 21 24 12 C24 5.4 18.6 0 12 0 Z" fill={fill} />
      <Circle cx={12} cy={12} r={4.6} fill="#fff" opacity={0.92} />
    </G>
  );
}

/**
 * 뒷면: 같은 열쇠고리를 뒤집은 모습. 몸통이 **민색으로 꽉 채워진 그림**이라 앞면 꾸밈이
 * 한 올도 안 비친다 (`*-back.png`, make_cocochi.js 가 굽는다). 그 위에 글만 얹는다.
 * 작은 창 안에 몰아넣으면 서너 줄밖에 못 적어서 뒤집은 면 전체를 쓴다.
 */
export function FourcutCocochiBack({ record: r, width, connected }: Props) {
  const L = layoutFourcutCocochi(r);
  const color = colorOf(r);
  const info = COCOCHI_COLORS[color];
  const id = `cocochi-back-${r.id}`;
  const { body } = SPOT[color];
  const { X, Y } = ruler(color);

  // 뒷면은 좌우가 뒤집혀 있다
  const bw = X(body.x + body.w) - X(body.x);
  const panel: Box = { x: PW - X(body.x) - bw, y: Y(body.y), w: bw, h: Y(body.y + body.h) - Y(body.y) };
  const inset = panel.w * 0.07; // 글이 테두리에 붙지 않게
  const plate: Box = { x: panel.x + inset, y: panel.y + inset, w: panel.w - inset * 2, h: panel.h - inset * 2 };

  // 달걀이라 위아래가 좁다 — 글은 가운데 폭만 쓴다
  const inner = plate.w * 0.66;
  const cx = plate.x + plate.w / 2;
  const date = r.date.replace(/-/g, '.');
  const title = fitLine(r.title.trim() || '이름 없는 하루', inner, 34, 20, 'sansBold');
  const place = r.place.trim();
  const withWhom = r.withWhom.trim();

  const dateY = plate.y + plate.h * 0.24;
  const titleY = dateY + 42;
  const bodyTop = titleY + 26;
  const footY = plate.y + plate.h * 0.82;
  const maxLines = Math.max(2, Math.floor((footY - 34 - bodyTop) / (22 * 1.52)));
  const diary = fitLines(r.diary.trim() || '오늘도 한 장 남겼다.', inner, 22, 15, maxLines, 'sans');
  const line = diary.size * 1.52;
  const diaryTop = bodyTop + diary.size;

  const pin = 19;
  const pinW = pin * 0.72;
  const gap = 7;
  const placeText = place ? fitLine(place, inner - pinW - gap, 19, 14, 'sans') : null;
  const placeW = placeText ? measure(placeText.text, placeText.size, 'sans') : 0;
  // 핀 + 틈 + 글자를 한 덩어리로 보고 가운데 맞춤
  const placeLeft = cx - (pinW + gap + placeW) / 2;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        <Defs>
          <ClipPath id={`${id}-plate`}>
            <Path d={eggPath(plate)} />
          </ClipPath>
        </Defs>

        {/* 몸통이 이미 민색으로 꽉 채워진 그림이라 판을 덧그리지 않는다 */}
        <Shell color={color} id={id} back />

        <G clipPath={`url(#${id}-plate)`}>
          <T f="monoBold" x={cx} y={dateY} fontSize={20} fill={info.ink} opacity={0.6} letterSpacing={1.6} textAnchor="middle" children={date} />
          <T f="sansBold" x={cx} y={titleY} fontSize={title.size} fill={info.ink} textAnchor="middle" children={title.text} />
          {diary.lines.map((t, i) => (
            <T key={i} x={cx} y={diaryTop + i * line} fontSize={diary.size} fill={info.ink} opacity={0.82} textAnchor="middle" children={t} />
          ))}

          {/* 위치는 핀을 앞에 달고, 누구랑은 그 아래 */}
          {placeText && (
            <G>
              <Pin x={placeLeft} y={footY} size={pin} fill={info.ink} />
              <T f="sans" x={placeLeft + pinW + gap} y={footY} fontSize={placeText.size} fill={info.ink} opacity={0.8} children={placeText.text} />
            </G>
          )}
          {!!withWhom && (
            <T
              f="sans"
              x={cx}
              y={footY + (placeText ? 30 : 0)}
              fontSize={18}
              fill={info.ink}
              opacity={0.6}
              textAnchor="middle"
              children={fitLine(`${withWhom}와 함께`, inner, 18, 13, 'sans').text}
            />
          )}
        </G>
      </G>
    </Svg>
  );
}
