// 인생네컷 유료 테마 "코코치": 네컷 사진 한 컷을 작은 열쇠고리 화면에 끼운다.
// 껍데기는 design/tools/make_cocochi.js 가 다듬은 그림(assets/cocochi/*.png)을 그대로 쓰고,
// 사진과 글자만 창 안에 얹는다. 원본이 바뀌면 그 스크립트를 다시 돌려 SPOT 을 갱신할 것.
//
// 뒤집으면 같은 열쇠고리 뒷모습이 나오고, 창에는 그날의 제목과 일기가 뜬다
// (뒷면만 크림색 줄노트로 바뀌면 흐름이 끊겨서).
import type { ComponentProps } from 'react';
import Svg, { ClipPath, Defs, G, Image, Path, Rect, Text } from 'react-native-svg';

import { fitLine, fitLines } from '../lib/text';
import { PAPER_FONTS as FONTS } from '../theme';
import { CocochiColor, FourcutRecord } from '../types';
import { PaperShadow, TemplateLayout } from './shared';

/** require 한 그림. 미리보기 도구에서는 { default: 'data:...' } 로 와서 한 겹 벗긴다 */
const asset = (m: unknown) => (m && typeof m === 'object' && 'default' in (m as Record<string, unknown>) ? (m as { default: number }).default : (m as number));

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const COCOCHI_COLORS: Record<CocochiColor, { name: string; shell: string; screen: string; ink: string; frame: number }> = {
  mint: { name: '민트', shell: '#8fe3cd', screen: '#dff7ef', ink: '#1d6a59', frame: asset(require('../../assets/cocochi/mint.png')) },
  pink: { name: '핑크', shell: '#ffb6cf', screen: '#ffeaf1', ink: '#8c3a58', frame: asset(require('../../assets/cocochi/pink.png')) },
  purple: { name: '퍼플', shell: '#c5b3f0', screen: '#efe9ff', ink: '#4c3a8c', frame: asset(require('../../assets/cocochi/purple.png')) },
  silver: { name: '실버', shell: '#cfd6de', screen: '#eef2f6', ink: '#3d4753', frame: asset(require('../../assets/cocochi/silver.png')) },
  white: { name: '화이트', shell: '#f0ece8', screen: '#faf7f4', ink: '#4a4340', frame: asset(require('../../assets/cocochi/white.png')) },
};

export const COCOCHI_COLOR_IDS = Object.keys(COCOCHI_COLORS) as CocochiColor[];

/**
 * 그림 원본(1024×1024) 안에서 잰 자리 — `node design/tools/make_cocochi.js` 가 찍어준다.
 * crop: 바깥 투명 여백을 뺀 그림 자리 · win: 안에 갇힌 투명한 창(=화면)
 */
const SPOT: Record<CocochiColor, { crop: Box; win: Box }> = {
  mint: { crop: { x: 72, y: 22, w: 938, h: 985 }, win: { x: 313, y: 295, w: 396, h: 403 } },
  silver: { crop: { x: 59, y: 25, w: 961, h: 971 }, win: { x: 281, y: 291, w: 413, h: 403 } },
  purple: { crop: { x: 57, y: 14, w: 964, h: 1000 }, win: { x: 300, y: 292, w: 392, h: 394 } },
  pink: { crop: { x: 39, y: 7, w: 974, h: 999 }, win: { x: 285, y: 277, w: 413, h: 423 } },
  white: { crop: { x: 37, y: 20, w: 981, h: 996 }, win: { x: 280, y: 286, w: 407, h: 411 } },
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
      {/* 뒷모습은 같은 껍데기를 좌우로 뒤집어 보여준다 (사슬이 반대쪽으로 간다) */}
      <G transform={back ? `translate(${PW} 0) scale(-1 1)` : undefined}>
        <Image href={info.frame} x={X(0)} y={Y(0)} width={SHEET * kx} height={SHEET * ky} preserveAspectRatio="none" />
      </G>
      {/* 창은 뚫려 있어서 뒤가 비친다 — 화면 바탕을 깔아준다 */}
      <Rect
        x={back ? PW - X(win.x + win.w) : X(win.x)}
        y={Y(win.y)}
        width={X(win.x + win.w) - X(win.x)}
        height={Y(win.y + win.h) - Y(win.y)}
        fill={info.screen}
        clipPath={`url(#${id}-win)`}
      />
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

const shellPath = `M0,0 H${PW} V${PH} H0 Z`;

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
        {!connected && <PaperShadow d={shellPath} strength={0.6} />}
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

/** 뒷면: 같은 열쇠고리를 뒤집은 모습. 창에 그날의 제목과 일기가 뜬다 */
export function FourcutCocochiBack({ record: r, width, connected }: Props) {
  const L = layoutFourcutCocochi(r);
  const color = colorOf(r);
  const info = COCOCHI_COLORS[color];
  const id = `cocochi-back-${r.id}`;
  const box = screenBox(color, true);

  const pad = box.w * 0.09;
  const inner = box.w - pad * 2;
  const date = r.date.replace(/-/g, '.');
  const title = fitLine(r.title.trim() || '이름 없는 하루', inner, 30, 17, 'sansBold');
  const withWhom = [r.place.trim(), r.withWhom.trim()].filter(Boolean).join(' · ');

  // 제목 아래부터 일기, 아래쪽엔 누구랑·어디가 한 줄.
  // 창 크기가 색마다 조금씩 달라서 **줄 수를 고정하지 않고 남는 자리에서 구한다**
  // (고정했더니 일기 끝줄이 아래 한 줄을 덮었다)
  const titleY = box.y + pad + 34 + title.size;
  const bodyTop = titleY + 24;
  const footRoom = withWhom ? 34 : 6;
  const room = box.y + box.h - pad - footRoom - bodyTop;
  const maxLines = Math.max(2, Math.floor(room / (22 * 1.5)));
  const diary = fitLines(r.diary.trim() || '오늘도 한 장 남겼다.', inner, 22, 15, maxLines, 'sans');
  const line = diary.size * 1.5;
  const diaryTop = bodyTop + diary.size;

  return (
    <Svg width={width} height={(width * L.height) / L.width} viewBox={`0 0 ${L.width} ${L.height}`}>
      <G transform={`translate(${PAD} ${PAD})`}>
        {!connected && <PaperShadow d={shellPath} strength={0.6} />}
        <Defs>
          <ClipPath id={`${id}-win`}>
            <Rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.w * 0.06} />
          </ClipPath>
        </Defs>

        <Shell color={color} id={id} back />

        <G clipPath={`url(#${id}-win)`}>
          <T f="monoBold" x={box.x + pad} y={box.y + pad + 22} fontSize={19} fill={info.ink} opacity={0.75} letterSpacing={1.4} children={date} />
          <T f="sansBold" x={box.x + pad} y={titleY} fontSize={title.size} fill={info.ink} children={title.text} />
          {diary.lines.map((t, i) => (
            <T key={i} x={box.x + pad} y={diaryTop + i * line} fontSize={diary.size} fill={info.ink} opacity={0.82} children={t} />
          ))}
          {!!withWhom && (
            <T
              f="sans"
              x={box.x + box.w / 2}
              y={box.y + box.h - pad}
              fontSize={18}
              fill={info.ink}
              opacity={0.6}
              textAnchor="middle"
              children={fitLine(withWhom, inner, 18, 13, 'sans').text}
            />
          )}
        </G>
      </G>
    </Svg>
  );
}
