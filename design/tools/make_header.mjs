// 앱스토어 헤더(3840×1646): 코코가 덜덜 떨며 영수증을 뱉는 장면. frame() 으로 한 장씩 그린다
// node make_header.mjs [out.png] [feed 0~1]
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APP = path.resolve(import.meta.dirname, '../../app');
const FONT_FILES = [
  `${APP}/node_modules/@expo-google-fonts/nanum-gothic-coding/400Regular/NanumGothicCoding_400Regular.ttf`,
  `${APP}/node_modules/@expo-google-fonts/nanum-gothic-coding/700Bold/NanumGothicCoding_700Bold.ttf`,
];

// 영수증 맨 위 로고 (주황 벡터, 146×37). 바깥 <svg> 껍데기만 벗겨 안쪽 모양을 그대로 쓴다
const LOGO_SVG = readFileSync(path.resolve(import.meta.dirname, '../logo/recoco-wordmark.svg'), 'utf8');
const LOGO_BODY = LOGO_SVG.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const LOGO_RATIO = 37 / 146;

export const W = 3840;
export const H = 1646;

/** 화면 크기와 코코 자리. S 코코 폭 · top 코코 머리 위치 · rise 날아갈 거리 · edge 가운데로 왔을 때 위아래 여백 · grow 그때 키워도 되는 배율 */
export const HEADER = { W, H, S: 1300, top: 40, rise: 1300, edge: 80, grow: 1 };
// 인스타 스토리 (9:16). 위아래 250px 쯤은 계정 이름·답장 칸에 가려서 코코와 영수증을 그 안쪽에 둔다
export const STORY = { W: 1080, H: 1920, S: 900, top: 420, rise: 1400, edge: 290, grow: 1.25 };

// ── 흰 코코 (components/Coco.tsx 의 white 톤 gag·spew·happy 얼굴을 그대로 옮김, viewBox 400×320)
const BODY =
  'M40,256 C40,150 108,84 186,78 C196,58 206,40 222,40 C232,40 238,46 240,52 C250,46 262,50 264,60 C272,62 276,72 270,82 C330,98 360,160 360,256 C360,292 336,300 300,301 C250,303 150,303 100,301 C64,300 40,292 40,256 Z';
const SPEW = { left: 68, right: 332, top: 214, bottom: 292 };
const EXIT_Y = 236;
const MOUTH_W = SPEW.right - SPEW.left - 16;
const EYE = '#3a2a22';

function coco(mood) {
  const { left, right, top, bottom } = SPEW;
  const spew = `M${left + 14},${top} Q200,${top - 8} ${right - 14},${top} Q${right},${top + 2} ${right},${top + 20} L${right - 6},${bottom - 22} Q${right - 10},${bottom} ${right - 34},${bottom} L${left + 34},${bottom} Q${left + 10},${bottom} ${left + 6},${bottom - 22} L${left},${top + 20} Q${left},${top + 2} ${left + 14},${top} Z`;
  const L = 158;
  const R = 242;
  const Y = 190;
  const cheek = (dx, cy, rx, ry, op) => [200 - dx, 200 + dx].map((x) => `<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffb18c" opacity="${op}"/>`).join('');
  // spew 는 입이 커서 볼터치가 눈 옆, 나머지는 입 옆 (gag 는 볼이 빵빵하게 크게)
  const blush = mood === 'spew' ? cheek(100, 196, 22, 12, 0.85) : mood === 'gag' ? cheek(92, 228, 32, 19, 1) : cheek(92, 228, 24, 13, 0.85);
  const eyes =
    mood === 'happy'
      ? [L, R].map((x) => `<path d="M${x - 15},${Y + 5} Q${x},${Y - 13} ${x + 15},${Y + 5}" stroke="${EYE}" stroke-width="8" stroke-linecap="round" fill="none"/>`).join('')
      : `<path d="M${L - 12},${Y - 11} L${L + 9},${Y} L${L - 12},${Y + 11}" stroke="${EYE}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M${R + 12},${Y - 11} L${R - 9},${Y} L${R + 12},${Y + 11}" stroke="${EYE}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  let mouth;
  if (mood === 'spew') {
    mouth = `<path d="${spew}" fill="#3a2a22"/>
    <path d="M${left + 20},${top + 10} Q200,${top + 2} ${right - 20},${top + 10}" stroke="#1f1612" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.6"/>`;
  } else if (mood === 'gag') {
    mouth = `<path d="M174,240 Q182,232 190,240 Q198,248 206,240 Q214,232 222,240" stroke="${EYE}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  } else {
    const w = 48;
    const d = `M${200 - w},224 Q200,217 ${200 + w},224 Q${200 + w + 5},227 ${200 + w - 2},236 C${200 + w - 14},272 ${200 - w + 14},272 ${200 - w + 2},236 Q${200 - w - 5},227 ${200 - w},224 Z`;
    mouth = `<defs><clipPath id="smile"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="#3a2a22"/>
    <ellipse cx="200" cy="266" rx="${w * 0.6}" ry="19" fill="#f06470" clip-path="url(#smile)"/>`;
  }
  return `
    <path d="${BODY}" fill="#ffffff"/>
    <path d="M214,58 Q206,72 196,80" stroke="#ffc9a1" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M246,64 Q238,76 242,90" stroke="#ffc9a1" stroke-width="7" stroke-linecap="round" fill="none"/>
    ${blush}
    ${eyes}
    ${mouth}`;
}

// ── 영수증 내용 (l 왼쪽 · m 수량 칸 · r 오른쪽)
const RECEIPT = [
  { logo: true },
  { center: '─ 오늘의 기록 영수증 ─' },
  { gap: 0.4 },
  { l: 'No.000001', r: '2026.11.04 14:32' },
  { l: '계산원: 코코' },
  { rule: true },
  { l: '품목', m: '수량', r: '금액', bold: true },
  { l: '책 한 권', m: '1', r: '0원' },
  { l: '영화 한 편', m: '1', r: '0원' },
  { l: '여행 하루', m: '1', r: '0원' },
  { l: '인생네컷 한 장', m: '1', r: '0원' },
  { l: '오늘 산 것', m: '1', r: '0원' },
  { rule: true },
  { l: '합계', r: '0원', bold: true, size: 1.15 },
  { l: '적립', r: '추억 +5', bold: true, orange: true },
  { rule: true },
  { l: '* 기록하면 영수증으로 뽑아 드려요', small: true },
  { l: '* 기록은 내 폰 안에만 보관돼요', small: true },
  { gap: 0.4 },
  { barcode: true },
  { center: '기록하고, 뽑고, 모으자', bold: true },
  { gap: 0.8 },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** 영수증을 (0,0) 기준 폭 w 로 그린 svg 조각과 높이 */
function receipt(w) {
  const fs = Math.round(w * 0.06);
  const lh = fs * 1.6;
  const pad = fs * 1.1;
  let y = pad;
  const out = [];
  const text = (x, yy, s, { anchor = 'start', bold = false, size = 1, color = '#2a2420', family = 'NanumGothicCoding' } = {}) =>
    out.push(`<text x="${x}" y="${yy}" font-family="${family}" font-weight="${bold ? 700 : 400}" font-size="${fs * size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`);
  for (const row of RECEIPT) {
    if (row.gap) {
      y += lh * row.gap;
      continue;
    }
    if (row.rule) {
      out.push(`<line x1="${pad}" y1="${y + lh * 0.25}" x2="${w - pad}" y2="${y + lh * 0.25}" stroke="#2a2420" stroke-width="${fs * 0.08}" stroke-dasharray="${fs * 0.35} ${fs * 0.25}"/>`);
      y += lh * 0.6;
      continue;
    }
    if (row.logo) {
      const lw = w * 0.52;
      y += fs * 0.5;
      out.push(`<svg x="${(w - lw) / 2}" y="${y}" width="${lw}" height="${lw * LOGO_RATIO}" viewBox="0 0 146 37">${LOGO_BODY}</svg>`);
      y += lw * LOGO_RATIO + fs * 0.3;
      continue;
    }
    if (row.barcode) {
      const bh = fs * 2.2;
      let x = w * 0.18;
      let k = 7;
      while (x < w * 0.82) {
        k = (k * 37 + 11) % 97;
        const bw = fs * (0.08 + (k % 4) * 0.07);
        out.push(`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#2a2420"/>`);
        x += bw + fs * (0.08 + (k % 3) * 0.06);
      }
      y += bh + lh * 0.3;
      continue;
    }
    const size = (row.small ? 0.82 : 1) * (row.size ?? 1);
    y += lh * size;
    const base = y - lh * size * 0.3;
    const o = { bold: row.bold, size, color: row.orange ? '#ff7a2f' : '#2a2420' };
    if (row.center) text(w / 2, base, row.center, { ...o, anchor: 'middle' });
    if (row.l) text(pad, base, row.l, o);
    if (row.m) text(w * 0.66, base, row.m, { ...o, anchor: 'middle' });
    if (row.r) text(w - pad, base, row.r, { ...o, anchor: 'end' });
  }
  y += pad;
  return { svg: out.join('\n'), h: y };
}

/**
 * feed: 0(아직 안 나옴) ~ 1(다 나옴). shake: 떨림 위상(라디안), amp: 떨림 세기(0~1).
 * drop: 뜯긴 영수증이 떨어진 정도(0~1). puff: 볼 빵빵(0~1). mood: gag · spew · happy
 * zoom: 입을 가운데 두고 당겨 보는 배율 (1 = 전체). lift: 코코가 위로 떠오른 거리(px).
 * center: 코코가 떠난 뒤 영수증이 화면 가운데로 올라온 정도(0~1)
 * 앱(Printer.tsx)처럼 영수증이 통째로 아래로 밀려 나온다 → 끝(바코드)이 먼저, 제목이 마지막에 보인다
 */
export function frame({ feed = 1, shake = 0, amp = 1, drop = 0, puff = 0, mood = 'spew', zoom = 1, lift = 0, center = 0 } = {}, L = HEADER) {
  const { W, H, S, top } = L; // S 코코 폭
  const k = S / 400;
  const u = S / 1300; // 헤더 크기를 1 로 본 배율 (떨림 폭·줄 굵기)
  const cx = W / 2;
  const exitY = top + EXIT_Y * k;
  const rw = MOUTH_W * k * 0.94;
  const r = receipt(rw);
  const dx = Math.sin(shake) * 4 * amp * u;
  const rot = Math.sin(shake * 1.3) * 0.25 * amp;
  const ry = exitY - r.h + feed * r.h + drop * drop * (H + 200);
  const tilt = drop * 6;
  // 코코가 떠난 뒤 영수증이 화면 한가운데로 올라온다 (다 보이게 살짝 줄여서)
  const fit = Math.min(L.grow, (H - 2 * L.edge) / r.h);
  const sc = 1 + (fit - 1) * center;
  const y = ry + ((H - r.h * fit) / 2 - ry) * center;
  const sx = 1 + puff * 0.05;
  const sy = 1 - puff * 0.04;
  // 덜덜 떠는 표시: 코코 양옆 짧은 줄 세 개씩
  const lines = [0, 1, 2]
    .map((i) => {
      const a = (i - 1) * 0.5;
      const len = (90 + Math.abs(Math.sin(shake * 0.5 + i)) * 16) * u;
      return [-1, 1]
        .map((side) => {
          const x = cx + side * (S / 2 + 30 * u);
          const y = top + (560 + (i - 1) * 120) * u;
          return `<line x1="${x}" y1="${y}" x2="${x + side * len * Math.cos(a)}" y2="${y + len * Math.sin(a)}" stroke="#ffffff" stroke-width="${18 * u}" stroke-linecap="round" opacity="${0.8 * amp}"/>`;
        })
        .join('');
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="below"><rect x="0" y="${exitY}" width="${W}" height="${H}"/></clipPath>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#ff9150"/><stop offset="1" stop-color="#ff7a2f"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g transform="translate(${cx} ${exitY}) scale(${zoom}) translate(${-cx} ${-exitY})">
  ${amp > 0.05 ? lines : ''}
  <g transform="translate(${cx - S / 2 + dx} ${top - lift}) rotate(${rot} ${S / 2} ${300 * k}) translate(${(S * (1 - sx)) / 2} ${300 * k * (1 - sy)}) scale(${k * sx} ${k * sy})">${coco(mood)}</g>
  ${feed <= 0 ? '' : `<g ${center > 0 ? '' : 'clip-path="url(#below)"'}>
    <g transform="translate(${cx + dx * (1 - center)} ${y}) rotate(${tilt * (1 - center)}) scale(${sc}) translate(${-rw / 2} 0)">
      <rect x="${14 * u}" y="${14 * u}" width="${rw}" height="${r.h}" fill="#7a2e00" opacity="0.18"/>
      <rect width="${rw}" height="${r.h}" fill="#fffdf8"/>
      ${r.svg}
    </g>
  </g>`}
  </g>
</svg>`;
}

export function render(svg) {
  return new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'NanumGothicCoding' } }).render().asPng();
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const out = process.argv[2] ?? 'header.png';
  writeFileSync(out, render(frame({ feed: Number(process.argv[3] ?? 1), shake: 0.6 })));
  console.log('wrote', out);
}
