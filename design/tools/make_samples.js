// 상점 미리보기 예시 사진(app/assets/samples/*.jpg)을 우리 그림으로 그린다.
// 옛 예시는 사용자가 준 마인크래프트 캡처라 스토어에 낼 수 없어서, 같은 구도에 코코를 넣어 다시 그렸다.
// 다시 그리려면:  node design/tools/make_samples.js        (하나만: node design/tools/make_samples.js concert)
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '../../app/assets/samples');
const FONT_DIR = path.resolve(__dirname, '../../app/assets/fonts');

// ── 코코 (app/src/components/Coco.tsx 의 CocoArt 와 같은 모양) ───────────────────
const BODY =
  'M40,256 C40,150 108,84 186,78 C196,58 206,40 222,40 C232,40 238,46 240,52 C250,46 262,50 264,60 C272,62 276,72 270,82 C330,98 360,160 360,256 C360,292 336,300 300,301 C250,303 150,303 100,301 C64,300 40,292 40,256 Z';
const TONES = {
  orange: { body: '#fb9449', pleat: '#e8692a', blush: '#f5675b', mouth: '#ffffff', tongue: '#f06470' },
  white: { body: '#ffffff', pleat: '#ffc9a1', blush: '#ffb18c', mouth: '#3a2a22', tongue: '#f06470' },
};
const EYE = '#3a2a22';
let uid = 0;

function eyes(mood) {
  const L = 158, R = 242, Y = 190;
  if (mood === 'happy')
    return [L, R].map((x) => `<path d="M${x - 15},${Y + 5} Q${x},${Y - 13} ${x + 15},${Y + 5}" stroke="${EYE}" stroke-width="8" stroke-linecap="round" fill="none"/>`).join('');
  if (mood === 'sleep')
    return [L, R].map((x) => `<path d="M${x - 14},${Y + 2} Q${x},${Y + 10} ${x + 14},${Y + 2}" stroke="${EYE}" stroke-width="7" stroke-linecap="round" fill="none"/>`).join('');
  const r = mood === 'wow' ? 17 : 14.5;
  return `<circle cx="${L}" cy="${Y}" r="${r}" fill="${EYE}"/><circle cx="${R}" cy="${Y}" r="${r}" fill="${EYE}"/>
    <circle cx="${L + 5}" cy="${Y - 5}" r="4" fill="#fff"/><circle cx="${R + 5}" cy="${Y - 5}" r="4" fill="#fff"/>`;
}

function mouth(mood, c) {
  if (mood === 'sleep' || mood === 'calm') return `<path d="M186,236 Q200,244 214,236" stroke="${EYE}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  if (mood === 'wow')
    return `<ellipse cx="200" cy="240" rx="17" ry="20" fill="${c.mouth}"/><ellipse cx="200" cy="249" rx="11" ry="9" fill="${c.tongue}"/>`;
  const w = mood === 'happy' ? 48 : 42;
  const d = `M${200 - w},224 Q200,217 ${200 + w},224 Q${200 + w + 5},227 ${200 + w - 2},236 C${200 + w - 14},272 ${200 - w + 14},272 ${200 - w + 2},236 Q${200 - w - 5},227 ${200 - w},224 Z`;
  const id = `m${uid++}`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${c.mouth}"/>
    <ellipse cx="200" cy="266" rx="${w * 0.6}" ry="19" fill="${c.tongue}" clip-path="url(#${id})"/>`;
}

/** 바닥 가운데(x, y)에 너비 w 로 세운 코코. over: 코코 위에 얹을 것(코코 좌표 400x320 기준) */
function coco(x, y, w, { tone = 'white', mood = 'idle', flip = false, rot = 0, over = '', under = '', shadow = true } = {}) {
  const s = w / 320;
  const c = TONES[tone];
  const outline = tone === 'white' ? ` stroke="#e9d6c6" stroke-width="5"` : '';
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s}) translate(-200,-301)">
    ${shadow ? `<ellipse cx="200" cy="304" rx="160" ry="14" fill="rgba(0,0,0,0.16)"/>` : ''}
    ${under}
    <path d="${BODY}" fill="${c.body}"${outline}/>
    <path d="M214,58 Q206,72 196,80" stroke="${c.pleat}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M246,64 Q238,76 242,90" stroke="${c.pleat}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M90,150 Q120,112 160,100" stroke="rgba(255,255,255,0.35)" stroke-width="14" stroke-linecap="round" fill="none"/>
    <ellipse cx="108" cy="228" rx="24" ry="13" fill="${c.blush}" opacity="0.85"/>
    <ellipse cx="292" cy="228" rx="24" ry="13" fill="${c.blush}" opacity="0.85"/>
    ${eyes(mood)}${mouth(mood, c)}${over}
  </g>`;
}

/** 방울 니트 (over 에 넣는다). 머리를 덮어 꼭지를 가린다 */
function beanie(color, band, pom) {
  const ribs = [86, 114, 142, 171, 200, 229, 258, 286, 314].map((x) => `<path d="M${x},${(160 - 100 * Math.sqrt(1 - ((x - 200) / 150) ** 2)).toFixed(1)} L${x},138" stroke="#000" stroke-width="5" stroke-linecap="round" opacity="0.1"/>`).join('');
  const bandRibs = [64, 92, 120, 148, 176, 204, 232, 260, 288, 316, 340].map((x) => `<path d="M${x},${(136 - Math.sin(((x - 44) / 312) * Math.PI) * 10).toFixed(1)} l0,26" stroke="#000" stroke-width="4" stroke-linecap="round" opacity="0.12"/>`).join('');
  return `<path d="M54,150 C54,22 346,22 346,150 Z" fill="${color}"/>${ribs}
    <path d="M44,140 C120,118 280,118 356,140 L358,178 C280,156 120,156 42,178 Z" fill="${band}"/>${bandRibs}
    <circle cx="200" cy="46" r="30" fill="${pom}"/><circle cx="182" cy="36" r="13" fill="${pom}"/><circle cx="220" cy="34" r="13" fill="${pom}"/>`;
}

/** 빨간 목도리 (over 에 넣는다). 처음 그림(e8fecf4)의 목도리 — 몸 앞을 가로지르는 띠 + 세로 초록 줄 + 오른쪽 앞에
 *  곧게 늘어진 꼬리 — 를 다듬은 것: 띠는 몸 양끝까지 두껍게(양옆은 높이, 가운데는 입 아래로 처지게),
 *  줄은 띠 곡선에 맞추고, 꼬리는 띠 밑에서 나온다. 앱 옷장의 목도리(Outfits.tsx 의 scarf)와 같은 모양 */
const SCARF = `<path d="M248,290 L288,288 L294.2,364 L255.6,366 Z" fill="#d64545" stroke="#b33636" stroke-width="4" stroke-linejoin="round"/>
  <path d="M251.6,326 L291,324 M253.4,344 L292.5,342" stroke="#2f8f5b" stroke-width="10"/>
  <path d="M260.6,366.0 l0,8 M270.1,365.4 l0,8 M279.7,364.8 l0,8 M289.2,364.2 l0,8" stroke="#b33636" stroke-width="4" stroke-linecap="round"/>
  <path d="M36,240 Q200,308 364,240 Q376,265 362,290 Q200,336 38,290 Q24,265 36,240 Z" fill="#d64545"/>
  <path d="M60.6,249.4 L77,254.9 L78.5,300.1 L62.3,296.4 ZM100.6,261.5 L117,265.3 L118,307.1 L101.8,304.6 ZM140.6,269.5 L157,271.7 L157.6,311.4 L141.4,310 ZM180.6,273.5 L197,274 L197.1,313 L180.9,312.7 ZM220.7,273.5 L237.1,272.3 L236.6,311.8 L220.4,312.6 ZM260.7,269.3 L277.1,266.5 L276.1,307.9 L259.9,309.9 ZM300.7,261.2 L317.1,256.7 L315.7,301.3 L299.5,304.3 ZM340.7,249 L357.1,242.8 L355.2,291.9 L339,296.1 Z" fill="#2f8f5b"/>
  <path d="M36,240 Q200,308 364,240 Q376,265 362,290 Q200,336 38,290 Q24,265 36,240 Z" fill="none" stroke="#b33636" stroke-width="4"/>`;

/** 짧고 동그란 흰 손·발 (코코와 같은 흰색 + 테두리) */
const nub = (cx, cy, rx, ry, rot = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="#e9d6c6" stroke-width="5" transform="rotate(${rot} ${cx} ${cy})"/>`;

/** 코코 몸 안쪽만 칠하기 (옷 같은 것) */
function inside(content) {
  const id = `c${uid++}`;
  return `<clipPath id="${id}"><path d="${BODY}"/></clipPath><g clip-path="url(#${id})">${content}</g>`;
}

// ── 자잘한 소품 ───────────────────────────────────────────────────────────────
const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
const lin = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;

function flowers(n, { x0, x1, y0, y1, seed, colors, r = [5, 9] }) {
  const R = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0);
    const k = r[0] + R() * (r[1] - r[0]) * (0.6 + (y - y0) / (y1 - y0 || 1) * 0.6);
    const col = colors[(R() * colors.length) | 0];
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      s += `<circle cx="${(x + Math.cos(a) * k * 0.8).toFixed(1)}" cy="${(y + Math.sin(a) * k * 0.8).toFixed(1)}" r="${(k * 0.62).toFixed(1)}" fill="${col}"/>`;
    }
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(k * 0.45).toFixed(1)}" fill="#ffd45c"/>`;
  }
  return s;
}

function grassBlades(n, { x0, x1, y, h, seed, color }) {
  const R = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * (x1 - x0), hh = h * (0.5 + R() * 0.7), lean = (R() - 0.5) * 14;
    s += `<path d="M${x - 3},${y} Q${x + lean * 0.4},${y - hh * 0.6} ${x + lean},${y - hh} Q${x + lean * 0.3 + 2},${y - hh * 0.5} ${x + 3},${y} Z" fill="${color}"/>`;
  }
  return s;
}

function snow(n, w, h, seed, max = 4) {
  const R = rnd(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${(R() * w).toFixed(1)}" cy="${(R() * h).toFixed(1)}" r="${(1 + R() * max).toFixed(1)}" fill="#fff" opacity="${(0.5 + R() * 0.5).toFixed(2)}"/>`;
  return s;
}

const cloud = (x, y, s, o = 1) =>
  `<g transform="translate(${x},${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="0" rx="46" ry="20" fill="#fff"/><circle cx="-18" cy="-12" r="20" fill="#fff"/><circle cx="12" cy="-18" r="24" fill="#fff"/></g>`;

const pine = (x, y, h, col = '#3f7d5a', snowy = false) => {
  const w = h * 0.55;
  let s = `<rect x="${x - h * 0.04}" y="${y - h * 0.12}" width="${h * 0.08}" height="${h * 0.14}" fill="#7a5236"/>`;
  for (let i = 0; i < 3; i++) {
    const top = y - h + i * h * 0.26, bot = y - h * 0.1 - (2 - i) * h * 0.18, ww = w * (0.55 + i * 0.22);
    s += `<path d="M${x},${top} L${x + ww / 2},${bot} L${x - ww / 2},${bot} Z" fill="${col}"/>`;
    if (snowy) s += `<path d="M${x},${top} L${x + ww * 0.18},${top + (bot - top) * 0.35} Q${x},${top + (bot - top) * 0.45} ${x - ww * 0.18},${top + (bot - top) * 0.35} Z" fill="#fff"/>`;
  }
  return s;
};

/** 빨간 일렉 기타 (코코 좌표계에서 몸통 앞을 가로지름) */
const guitar = (col = '#e5383b', neck = '#8a5a3c') => `
  <g transform="translate(200,232) rotate(-24)">
    <rect x="20" y="-9" width="230" height="18" rx="4" fill="${neck}"/>
    ${[50, 80, 110, 140, 170, 200, 225].map((x) => `<rect x="${x}" y="-9" width="3" height="18" fill="#d9c7a6"/>`).join('')}
    <path d="M240,-16 L292,-28 L296,-12 L292,12 L240,16 Z" fill="#2b2b2b"/>
    ${[-18, -6, 6].map((y) => `<circle cx="${262 + y * 0.4}" cy="${y - 4}" r="4" fill="#ddd"/>`).join('')}
    <path d="M-120,-10 C-150,-70 -60,-80 -40,-40 C-20,-60 40,-50 30,-10 C40,20 20,60 -20,50 C-40,90 -150,70 -120,10 Z" fill="${col}"/>
    <path d="M-104,-6 C-122,-44 -70,-52 -54,-28" stroke="rgba(255,255,255,0.35)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <rect x="-70" y="-14" width="36" height="28" rx="4" fill="#f5f0e6"/>
    <rect x="-20" y="-12" width="10" height="24" rx="2" fill="#222"/>
    ${[-6, -2, 2, 6].map((y) => `<line x1="-70" y1="${y}" x2="292" y2="${y * 0.6}" stroke="#eee" stroke-width="1.2"/>`).join('')}
  </g>`;

// ── 장면 ─────────────────────────────────────────────────────────────────────
const SCENES = {
  // 눈밭의 눈사람 코코 + 목도리 (코코치 창)
  cocochi: [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="url(#sky)"/>
    ${pine(70, 300, 170, '#5d8f7a', true)}${pine(420, 290, 140, '#6a9c86', true)}${pine(360, 270, 90, '#7aa894', true)}
    <path d="M0,300 Q120,270 240,292 T480,286 L480,480 L0,480 Z" fill="#f4f8fb"/>
    <path d="M0,360 Q160,330 300,352 T480,350 L480,480 L0,480 Z" fill="#e6eef4"/>
    ${coco(240, 396, 300, { mood: 'happy', over: SCARF,
      under: `<path d="M64,200 L8,156 M26,170 L18,146 M336,200 L392,156 M374,170 L382,146" stroke="#6b4428" stroke-width="12" stroke-linecap="round"/>` })}
    ${snow(70, 480, 480, 7)}
  `, lin('sky', [[0, '#c9dcec'], [1, '#eef4fa']]))],

  // 풀밭 연못가의 코코와 병아리 친구 (코코몬 카드 창)
  cocomon: [480, 364, () => svg(480, 364, `
    <rect width="480" height="364" fill="url(#sky)"/>
    ${cloud(90, 60, 1)}${cloud(380, 44, 0.8)}
    <path d="M0,170 Q100,150 200,166 T480,160 L480,364 L0,364 Z" fill="#8fcf6a"/>
    <rect y="150" width="480" height="30" fill="#6faa4f"/>
    ${[30, 110, 400, 460].map((x, i) => `<rect x="${x}" y="${108 - i * 4}" width="10" height="50" fill="#7a5236"/><circle cx="${x + 5}" cy="${100 - i * 4}" r="${34 - i * 2}" fill="#4f9a48"/>`).join('')}
    <path d="M0,170 L480,170 L480,364 L0,364 Z" fill="#9bd673"/>
    ${grassBlades(140, { x0: 0, x1: 480, y: 330, h: 40, seed: 3, color: '#7cc155' })}
    <ellipse cx="240" cy="352" rx="300" ry="34" fill="#5fb3e0"/>
    <ellipse cx="200" cy="346" rx="120" ry="8" fill="#a6dcf5" opacity="0.7"/>
    ${flowers(30, { x0: 10, x1: 470, y0: 190, y1: 300, seed: 11, colors: ['#fff', '#ffd1dc', '#ff9ec4'], r: [3, 7] })}
    ${coco(200, 312, 230, { mood: 'happy' })}
    <g transform="translate(350,300)">
      <ellipse cx="0" cy="8" rx="44" ry="8" fill="rgba(0,0,0,0.15)"/>
      <ellipse cx="0" cy="-26" rx="42" ry="38" fill="#ffe066"/>
      <circle cx="-14" cy="-36" r="5" fill="${EYE}"/><circle cx="14" cy="-36" r="5" fill="${EYE}"/>
      <path d="M-8,-24 L8,-24 L0,-14 Z" fill="#f59f3a"/>
      <path d="M-6,-64 Q0,-78 8,-64" stroke="#ffe066" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M-14,10 L-14,2 M14,10 L14,2" stroke="#f59f3a" stroke-width="5" stroke-linecap="round"/>
    </g>
    ${(() => { const R = rnd(29); let s = ''; for (let i = 0; i < 60 && s.split('<ellipse').length <= 34; i++) { const x = R() * 480, y = 20 + R() * 300, k = 0.7 + R() * 0.7; if ((x > 70 && x < 330 && y > 140) || (x > 300 && x < 400 && y > 230)) continue; s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(7 * k).toFixed(1)}" ry="${(4 * k).toFixed(1)}" fill="${R() > 0.4 ? '#ffb3cf' : '#ff8fb8'}" opacity="${(0.75 + R() * 0.25).toFixed(2)}" transform="rotate(${(R() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; } return s; })()}
  `, lin('sky', [[0, '#7cc4f2'], [1, '#d8f0ff']]))],

  // 무대에서 빨간 기타 치는 코코 (콘서트)
  concert: [480, 464, () => svg(480, 464, `
    <rect width="480" height="464" fill="url(#bg)"/>
    ${[60, 180, 300, 420].map((x, i) => `<path d="M${x},0 L${x - 90 + i * 20},380 L${x + 90 + i * 20},380 Z" fill="url(#beam)" opacity="${i % 2 ? 0.55 : 0.4}"/>`).join('')}
    ${[60, 180, 300, 420].map((x) => `<rect x="${x - 16}" y="0" width="32" height="18" rx="4" fill="#2a2140"/><circle cx="${x}" cy="18" r="9" fill="#fff4c2"/>`).join('')}
    <rect y="330" width="480" height="134" fill="#2a2140"/>
    <rect y="330" width="480" height="8" fill="#ff8a3d"/>
    ${[40, 440].map((x) => `<rect x="${x - 34}" y="250" width="68" height="84" rx="6" fill="#1a1428"/><circle cx="${x}" cy="280" r="20" fill="#2f2747"/><circle cx="${x}" cy="280" r="9" fill="#14101f"/><circle cx="${x}" cy="318" r="9" fill="#2f2747"/>`).join('')}
    ${coco(240, 336, 270, { mood: 'happy', over: guitar() })}
    ${(() => { const R = rnd(5); let s = ''; for (let i = 0; i < 26; i++) { const x = i * 19 + R() * 8, h = 40 + R() * 30; s += `<ellipse cx="${x}" cy="${464 - h * 0.4}" rx="18" ry="${h * 0.6}" fill="#120e1c"/><circle cx="${x}" cy="${464 - h * 0.95}" r="13" fill="#120e1c"/>`; if (R() > 0.6) s += `<path d="M${x + 6},${464 - h} L${x + 14},${464 - h - 34}" stroke="#120e1c" stroke-width="7" stroke-linecap="round"/><circle cx="${x + 15}" cy="${464 - h - 38}" r="5" fill="#ffd45c"/>`; } return s; })()}
    ${snow(30, 480, 300, 9, 2.5)}
  `, lin('bg', [[0, '#3b2a66'], [1, '#7b3f8f']]) + lin('beam', [[0, '#fff4c2'], [1, '#fff4c2']]).replace('stop-color="#fff4c2"/></linearGradient>', 'stop-color="#fff4c2" stop-opacity="0"/></linearGradient>'))],

  // 방에서 카메라 들고 셀카 (일상 1)
  'daily-1': [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="#f2e6d8"/>
    <rect y="330" width="480" height="150" fill="#c99a6b"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="0" y="${340 + i * 24}" width="480" height="2" fill="#b5875a"/>`).join('')}
    <rect x="40" y="60" width="150" height="120" rx="6" fill="#fff"/><rect x="50" y="70" width="130" height="100" fill="#8fc7e8"/>
    <path d="M50,140 Q90,110 120,140 T180,130 L180,170 L50,170 Z" fill="#7cc155"/><rect x="113" y="60" width="4" height="120" fill="#fff"/>
    <rect x="310" y="90" width="110" height="80" rx="4" fill="#fff8ee" stroke="#d8c4ac" stroke-width="4"/>
    <path d="M326,150 L350,120 L370,140 L386,126 L404,150 Z" fill="#f4a261"/><circle cx="392" cy="112" r="9" fill="#ffd45c"/>
    <rect x="330" y="250" width="120" height="90" rx="8" fill="#8b5e3c"/><rect x="340" y="262" width="100" height="30" rx="4" fill="#a7714a"/>
    <path d="M370,250 Q362,200 384,190 Q402,200 398,250 Z" fill="#5f9e6e"/>
    ${coco(210, 420, 300, { mood: 'happy', rot: -4, over: `
      <g transform="translate(300,170) rotate(10)">
        <rect x="-46" y="-34" width="92" height="66" rx="12" fill="#2b2b2b"/>
        <rect x="-30" y="-46" width="30" height="14" rx="4" fill="#2b2b2b"/>
        <circle cx="4" cy="0" r="22" fill="#555"/><circle cx="4" cy="0" r="14" fill="#1a1a1a"/><circle cx="-1" cy="-5" r="5" fill="#9ad"/>
        <rect x="22" y="-28" width="16" height="10" rx="2" fill="#fff"/>
      </g>
      ${nub(338, 214, 18, 24, 15)}` })}
    <circle cx="352" cy="146" r="60" fill="url(#flash)"/>
    <path d="M352,96 L360,136 L400,146 L360,156 L352,196 L344,156 L304,146 L344,136 Z" fill="#fff" opacity="0.9"/>
  `, rad('flash', [[0, '#fff', 1], [1, '#fff', 0]]))],

  // 이불 덮고 자는 코코 (일상 2)
  'daily-2': [480, 613, () => svg(480, 613, `
    <rect width="480" height="613" fill="#3d3a63"/>
    <rect x="300" y="50" width="140" height="150" rx="10" fill="#26244a"/><rect x="312" y="62" width="116" height="126" fill="#1a2f5c"/>
    <circle cx="390" cy="104" r="26" fill="#fff3c4"/><circle cx="378" cy="96" r="24" fill="#1a2f5c"/>
    ${snow(14, 110, 120, 4, 2).replace(/<circle cx="([\d.]+)" cy="([\d.]+)"/g, (m, x, y) => `<circle cx="${+x + 314}" cy="${+y + 64}"`)}
    <rect x="368" y="62" width="4" height="126" fill="#26244a"/>
    <rect x="30" y="210" width="420" height="380" rx="20" fill="#7a5236"/>
    <rect x="50" y="230" width="380" height="340" rx="14" fill="#f7efe3"/>
    <rect x="90" y="250" width="300" height="110" rx="40" fill="#dfe8f6"/>
    ${coco(240, 400, 230, { mood: 'sleep', shadow: false })}
    <path d="M50,370 Q240,340 430,370 L430,560 Q240,580 50,560 Z" fill="#8fb8e8"/>
    ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<circle cx="${92 + c * 74 + (r % 2) * 37}" cy="${410 + r * 40}" r="8" fill="#fff" opacity="0.7"/>`).join('')).join('')}
    <path d="M50,370 Q240,340 430,370 L430,392 Q240,362 50,392 Z" fill="#fff" opacity="0.85"/>
    <g fill="#fff3c4" font-family="Pretendard" font-weight="700"><text x="330" y="270" font-size="34">Z</text><text x="362" y="236" font-size="26">z</text><text x="388" y="210" font-size="20">z</text></g>
  `)],

  // 꽃밭의 흰 코코 (일상 3)
  'daily-3': [480, 360, () => svg(480, 360, `
    <rect width="480" height="360" fill="url(#sky)"/>
    ${cloud(380, 50, 0.9)}${cloud(80, 70, 0.7, 0.9)}
    <path d="M0,120 Q120,96 240,116 T480,104 L480,160 L0,160 Z" fill="#6aaa52"/>
    <path d="M0,140 L480,140 L480,360 L0,360 Z" fill="#a4d97a"/>
    ${grassBlades(120, { x0: 0, x1: 480, y: 170, h: 30, seed: 21, color: '#8cc964' })}
    ${flowers(46, { x0: 0, x1: 480, y0: 160, y1: 350, seed: 13, colors: ['#ff9ec4', '#f7b5d3', '#ffffff', '#d9a7f2'], r: [5, 11] })}
    ${coco(240, 318, 220, { mood: 'happy' })}
    ${flowers(12, { x0: 0, x1: 480, y0: 310, y1: 360, seed: 31, colors: ['#ff9ec4', '#ffffff'], r: [9, 13] })}
  `, lin('sky', [[0, '#8fd0f5'], [1, '#e2f5ff']]))],

  // 공원에서 달리는 코코 (운동)
  exercise: [480, 640, () => svg(480, 640, `
    <rect width="480" height="640" fill="url(#sky)"/>
    <circle cx="380" cy="110" r="46" fill="#ffd166"/>
    ${cloud(110, 90, 1)}${cloud(300, 170, 0.7, 0.9)}
    <path d="M0,300 Q140,250 260,290 T480,270 L480,640 L0,640 Z" fill="#7fc36b"/>
    ${[40, 130, 420].map((x, i) => `<rect x="${x - 7}" y="${230 + i * 6}" width="14" height="80" fill="#7a5236"/><circle cx="${x}" cy="${222 + i * 6}" r="${46 - i * 4}" fill="#4f9a48"/><circle cx="${x - 22}" cy="${240 + i * 6}" r="30" fill="#5aa852"/>`).join('')}
    <path d="M150,640 C200,520 300,420 330,300 L370,300 C360,420 330,540 360,640 Z" fill="#e9d8b8"/>
    <path d="M240,640 C270,540 330,430 350,300" stroke="#fff" stroke-width="4" stroke-dasharray="18 16" fill="none"/>
    ${grassBlades(90, { x0: 0, x1: 480, y: 640, h: 40, seed: 41, color: '#69b058' })}
    ${coco(250, 560, 300, { mood: 'happy', rot: 6, over: `
      <path d="M70,140 Q200,96 330,140 L334,166 Q200,124 66,166 Z" fill="#3a86ff"/>
      <path d="M330,150 Q372,150 386,176 M330,156 Q366,176 372,204" stroke="#3a86ff" stroke-width="12" stroke-linecap="round" fill="none"/>`,
      under: `${nub(40, 290, 36, 22, 35)}${nub(322, 316, 38, 22, -8)}` })}
    ${[0, 1, 2].map((i) => `<path d="M${90 - i * 18},${420 + i * 34} L${150 - i * 10},${420 + i * 34}" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`).join('')}
    <g transform="translate(400,500)"><rect x="-22" y="-50" width="44" height="76" rx="10" fill="#7fd1f5"/><rect x="-14" y="-62" width="28" height="16" rx="4" fill="#3a86ff"/><rect x="-22" y="-20" width="44" height="18" fill="#fff" opacity="0.6"/></g>
  `, lin('sky', [[0, '#8fd0f5'], [1, '#fef6e4']]))],

  // 미술관에 걸린 코코 초상화 (전시 1)
  'exhibit-1': [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="#c8a24a"/>
    <rect x="12" y="12" width="456" height="456" fill="#8a6a22"/>
    <rect x="22" y="22" width="436" height="436" fill="#e2c26a"/>
    <rect x="40" y="40" width="400" height="400" fill="url(#bg)"/>
    <ellipse cx="240" cy="470" rx="250" ry="120" fill="#2c3b2a" opacity="0.6"/>
    ${coco(240, 400, 310, { mood: 'calm', over: inside(`
      <path d="M0,276 Q200,256 400,276 L400,320 L0,320 Z" fill="#6b2d3f"/>
      <path d="M170,268 Q200,292 230,268 L222,320 L178,320 Z" fill="#f4ecd8"/>`) + `
      <circle cx="356" cy="226" r="27" fill="url(#pearl)"/><circle cx="348" cy="215" r="7.5" fill="#fff"/>` })}
    <g opacity="0.75">${(() => { const R = rnd(17); let s = ''; for (let i = 0; i < 260; i++) s += `<rect x="${(40 + R() * 392).toFixed(0)}" y="${(40 + R() * 392).toFixed(0)}" width="8" height="3" fill="${R() > 0.5 ? '#000' : '#fff'}" opacity="0.06" transform="rotate(${(R() * 180).toFixed(0)} 240 240)"/>`; return s; })()}</g>
    <path d="M60,420 Q120,380 160,420 L130,440 Z" fill="#e85d3a" opacity="0.85"/><path d="M360,400 Q400,360 430,420 L420,440 L360,440 Z" fill="#f2a33a" opacity="0.8"/>
  `, rad('bg', [[0, '#5b6b46'], [1, '#1d2617']], 0.45, 0.35, 0.8) + rad('pearl', [[0, '#ffffff'], [0.6, '#eef0f2'], [1, '#b9bec6']], 0.4, 0.35, 0.6))],

  // 정물화: 케이크·화병·해바라기 (전시 2)
  'exhibit-2': [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="#6b4a2a"/>
    <rect x="14" y="14" width="452" height="452" fill="#4a3018"/>
    <rect x="30" y="30" width="420" height="420" fill="url(#bg)"/>
    <path d="M30,320 L450,300 L450,450 L30,450 Z" fill="#c9b48a"/>
    <path d="M30,320 L450,300 L450,316 L30,336 Z" fill="#e2d2ae"/>
    <path d="M250,300 C200,280 210,170 262,150 L262,120 L318,120 L318,150 C370,170 380,280 330,300 Z" fill="#a8543a"/>
    <path d="M262,170 C240,190 236,250 250,280" stroke="#d27a58" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="256" y="112" width="68" height="16" rx="6" fill="#8a3f28"/>
    <path d="M300,120 Q290,70 330,40 M300,120 Q330,90 380,90" stroke="#4f7a3a" stroke-width="7" fill="none"/>
    ${[[330, 40, 26], [384, 88, 22]].map(([x, y, r]) => Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<ellipse cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r}" rx="${r * 0.55}" ry="${r * 0.25}" fill="#f6c431" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * r} ${y + Math.sin(a) * r})"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="#6b3d14"/>`).join('')}
    <ellipse cx="150" cy="350" rx="100" ry="22" fill="#e9e1d2"/>
    <path d="M70,300 L70,346 Q150,380 230,346 L230,300 Z" fill="#c07a42"/>
    <ellipse cx="150" cy="300" rx="80" ry="22" fill="#fff6ea"/>
    <path d="M70,300 Q80,330 96,316 Q110,336 126,318 Q142,338 160,318 Q178,336 192,316 Q210,332 230,300" fill="#fff6ea"/>
    ${[[120, 292], [150, 302], [178, 290], [140, 286], [166, 296]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#d93a3a"/>`).join('')}
    <path d="M100,420 Q140,390 160,430 M60,430 Q90,400 120,440" stroke="#4f7a3a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="380" cy="380" rx="34" ry="28" fill="#d94a3a"/><path d="M380,352 Q384,340 392,338" stroke="#4f7a3a" stroke-width="5" fill="none"/>
    <g>${(() => { const R = rnd(23); let s = ''; for (let i = 0; i < 300; i++) s += `<rect x="${(30 + R() * 414).toFixed(0)}" y="${(30 + R() * 414).toFixed(0)}" width="9" height="3" fill="${R() > 0.5 ? '#000' : '#fff'}" opacity="0.07" transform="rotate(${(R() * 180).toFixed(0)} 240 240)"/>`; return s; })()}</g>
  `, rad('bg', [[0, '#5a4a3a'], [1, '#22180f']], 0.4, 0.3, 0.8))],

  // 컵 홀더에 꽂힌 아이스 라떼 두 잔 (카페)
  'food-cafe': [480, 434, () => {
    const cup = (x, y, s, foam) => `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M-70,-150 L70,-150 L56,120 L-56,120 Z" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.8)" stroke-width="4"/>
      <path d="M-66,-60 L66,-60 L56,118 L-56,118 Z" fill="#b07a4f"/>
      <path d="M-68,-100 L68,-100 L66,-60 L-66,-60 Z" fill="${foam}"/>
      <path d="M-66,-60 Q-30,-40 0,-62 Q34,-82 66,-60" fill="#c99668"/>
      ${[[-30, -120], [10, -110], [36, -130], [-6, -136], [-40, -90]].map(([a, b]) => `<rect x="${a}" y="${b}" width="26" height="24" rx="6" fill="rgba(235,248,255,0.8)" stroke="#fff" stroke-width="2"/>`).join('')}
      <ellipse cx="0" cy="-150" rx="76" ry="16" fill="rgba(255,255,255,0.75)"/>
      <path d="M-80,-156 Q0,-200 80,-156 L80,-150 L-80,-150 Z" fill="rgba(255,255,255,0.7)"/>
      <rect x="10" y="-230" width="12" height="90" rx="5" fill="#2b2b2b" transform="rotate(10)"/>
      <path d="M-50,-40 L-40,100" stroke="rgba(255,255,255,0.6)" stroke-width="8" stroke-linecap="round"/>
    </g>`;
    return svg(480, 434, `
      <rect width="480" height="434" fill="url(#bg)"/>
      <circle cx="420" cy="60" r="90" fill="#6a4a36" opacity="0.5"/>
      <path d="M0,330 Q60,300 120,340 L170,434 L0,434 Z" fill="#f2c4a2"/>
      ${cup(170, 260, 1, '#f3e3cf')}${cup(320, 300, 1.05, '#f7ecdc')}
      <path d="M60,330 L420,360 L400,434 L80,434 Z" fill="#a98262"/>
      <path d="M60,330 L420,360 L416,376 L58,346 Z" fill="#c09a76"/>
      ${[110, 170, 230, 290, 350].map((x) => `<path d="M${x},${345 + (x - 60) * 0.08} L${x + 8},434" stroke="#8f6a4c" stroke-width="3"/>`).join('')}
      <path d="M90,434 Q120,370 150,380 Q172,390 150,434 Z" fill="#f2c4a2"/>
    `, rad('bg', [[0, '#5a3c2c'], [1, '#1c120c']], 0.5, 0.4, 0.8));
  }],

  // 고깃집 불판과 반찬 (맛집) — 사진 영수증 식당과 같은 소재
  'food-meal': [480, 434, () => svg(480, 434, grillTable(480, 434, 11), grillDefs())],
  'photo-receipt-meal': [720, 960, () => svg(720, 960, grillTable(720, 960, 29), grillDefs())],

  // 딸기 생크림 케이크 (선물)
  'gift-cake': [400, 400, () => svg(400, 400, `
    <rect width="400" height="400" fill="#fff"/>
    <ellipse cx="200" cy="310" rx="150" ry="30" fill="#eee"/>
    <ellipse cx="200" cy="300" rx="140" ry="26" fill="#f6efe6" stroke="#e3d8c8" stroke-width="3"/>
    <path d="M80,180 L80,286 Q200,326 320,286 L320,180 Z" fill="#fff8f0"/>
    <path d="M80,230 Q200,262 320,230 L320,244 Q200,276 80,244 Z" fill="#f7c6c9"/>
    <path d="M80,250 Q200,282 320,250 L320,256 Q200,288 80,256 Z" fill="#e8b48a"/>
    <ellipse cx="200" cy="180" rx="120" ry="40" fill="#fffdf9"/>
    ${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; const x = 200 + Math.cos(a) * 96, y = 180 + Math.sin(a) * 30; return `<path d="M${x - 13},${y + 4} Q${x},${y - 22} ${x + 13},${y + 4} Z" fill="#fff" stroke="#f1e6da" stroke-width="2"/>`; }).join('')}
    ${[[200, 160], [160, 176], [240, 176], [200, 196], [120, 186], [280, 186]].map(([x, y]) => `<path d="M${x},${y + 16} C${x - 16},${y + 2} ${x - 12},${y - 14} ${x},${y - 10} C${x + 12},${y - 14} ${x + 16},${y + 2} ${x},${y + 16} Z" fill="#e63946"/><path d="M${x - 7},${y - 11} L${x},${y - 18} L${x + 7},${y - 11}" fill="#4f9a48"/>${[0, 1, 2].map((k) => `<circle cx="${x - 4 + k * 4}" cy="${y + k * 3}" r="1.2" fill="#ffd166"/>`).join('')}`).join('')}
    <path d="M110,200 L110,260 M140,206 L140,272 M290,200 L290,260" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  `)],

  // 수박 한 조각 (선물)
  'gift-melon': [400, 400, () => svg(400, 400, `
    <rect width="400" height="400" fill="#fff"/>
    <ellipse cx="200" cy="320" rx="140" ry="20" fill="#eee"/>
    <g transform="rotate(-18 200 200)">
      <path d="M60,170 A140,140 0 0 0 340,170 Z" fill="#3f8f3a"/>
      <path d="M72,170 A128,128 0 0 0 328,170 Z" fill="#c8eab0"/>
      <path d="M86,170 A114,114 0 0 0 314,170 Z" fill="#ef4a5a"/>
      <path d="M86,170 L314,170 L314,178 A114,114 0 0 1 86,178 Z" fill="#f77b86" opacity="0.6"/>
      ${[[140, 196], [200, 206], [260, 196], [170, 236], [230, 236], [200, 262], [120, 180], [280, 180]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="8" fill="#2b1d1d"/>`).join('')}
      ${[100, 140, 180, 220, 260, 300].map((x) => `<path d="M${x},${170 + Math.sqrt(Math.max(0, 140 * 140 - (x - 200) ** 2)) - 6} l6,4" stroke="#2f6e2b" stroke-width="5"/>`).join('')}
    </g>
  `)],

  // 하우스네컷 네 컷: 물속 · 노을 숲 · 눈 호수 · 꽃과 여우
  'house-1': [464, 354, () => svg(464, 354, `
    <rect width="464" height="354" fill="url(#sea)"/>
    ${[60, 180, 300, 420].map((x, i) => `<path d="M${x},0 L${x + 40},0 L${x - 30 + i * 6},354 L${x - 70 + i * 6},354 Z" fill="#fff" opacity="0.07"/>`).join('')}
    <path d="M0,290 Q120,270 230,296 T464,284 L464,354 L0,354 Z" fill="#e8d7a8"/>
    ${[20, 105, 360, 446].map((x, i) => `<path d="M${x},300 Q${x - 18},${240 - i * 8} ${x + 4},${180 - i * 10} Q${x + 16},${240} ${x + 8},300 Z" fill="#3fa36b"/>`).join('')}
    ${[[62, '#ff8fb1'], [404, '#ff9e7a']].map(([x, col]) => `<path d="M${x},304 L${x},262 M${x},284 L${x - 18},252 L${x - 22},232 M${x - 18},252 L${x - 30},246 M${x},272 L${x + 16},242 L${x + 14},222 M${x + 16},242 L${x + 28},236" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`).join('')}
    ${coco(232, 300, 230, { mood: 'wow' })}
    ${[[90, 120, 10], [110, 80, 7], [124, 50, 5], [370, 70, 9], [390, 40, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.8"/>`).join('')}
    <g transform="translate(400,160)"><ellipse rx="22" ry="12" fill="#ffb347"/><path d="M20,0 L36,-12 L36,12 Z" fill="#ffb347"/><circle cx="-10" cy="-2" r="3" fill="${EYE}"/></g>
  `, lin('sea', [[0, '#6fd0e8'], [1, '#2a8fb8']]))],

  'house-2': [464, 354, () => svg(464, 354, `
    <rect width="464" height="354" fill="url(#sky)"/>
    <circle cx="120" cy="150" r="60" fill="#ffd27a"/>
    <circle cx="120" cy="150" r="110" fill="url(#glow)"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => pine(20 + i * 74, 260 + (i % 2) * 14, 170 + (i % 3) * 30, i % 2 ? '#3d5a3a' : '#2f4a30')).join('')}
    <path d="M0,260 L464,250 L464,354 L0,354 Z" fill="#4e7a3e"/>
    ${grassBlades(120, { x0: 0, x1: 464, y: 354, h: 36, seed: 51, color: '#6a9a4a' })}
    ${coco(300, 330, 200, { mood: 'happy' })}
    <path d="M0,0 L464,0 L464,354 L0,354 Z" fill="url(#warm)"/>
  `, lin('sky', [[0, '#f7a26b'], [0.6, '#ffd8a0'], [1, '#ffe9c4']]) + rad('glow', [[0, '#fff2c8', 0.9], [1, '#fff2c8', 0]]) + lin('warm', [[0, '#ff9a4a'], [1, '#ff9a4a']]).replace(/stop-color="#ff9a4a"\/>/g, 'stop-color="#ff9a4a" stop-opacity="0.12"/>'))],

  'house-3': [464, 354, () => svg(464, 354, `
    <rect width="464" height="354" fill="url(#sky)"/>
    <circle cx="340" cy="190" r="34" fill="#fff1c1"/><circle cx="340" cy="190" r="90" fill="url(#glow)"/>
    <path d="M0,200 L60,120 L120,180 L190,90 L270,190 L330,140 L400,196 L464,150 L464,220 L0,220 Z" fill="#c9d6ea"/>
    <path d="M190,90 L215,120 L200,118 L184,132 L170,116 Z M60,120 L80,146 L60,140 L44,150 Z" fill="#fff"/>
    ${pine(30, 230, 90, '#4a6a6a', true)}${pine(440, 226, 80, '#4a6a6a', true)}
    <rect y="214" width="464" height="140" fill="url(#lake)"/>
    <path d="M300,214 L380,214 L360,354 L320,354 Z" fill="#fff1c1" opacity="0.35"/>
    <path d="M0,290 Q120,268 260,300 L260,354 L0,354 Z" fill="#f4f8fb"/>
    ${coco(140, 318, 190, { mood: 'idle', over: beanie('#ff8a3d', '#e8692a', '#fff') })}
    ${snow(40, 464, 354, 61, 2.5)}
  `, lin('sky', [[0, '#5f7fb8'], [0.7, '#f3b98a'], [1, '#ffd9a8']]) + rad('glow', [[0, '#fff1c1', 0.8], [1, '#fff1c1', 0]]) + lin('lake', [[0, '#7aa4cf'], [1, '#3e6a9a']]))],

  'house-4': [464, 354, () => svg(464, 354, `
    <rect width="464" height="354" fill="#4a3426"/>
    <rect x="0" y="0" width="464" height="190" fill="#5a4030"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${i * 60}" y="0" width="4" height="190" fill="#4a3426"/>`).join('')}
    <rect y="186" width="464" height="10" fill="#3a281c"/>
    ${coco(170, 320, 220, { mood: 'happy', rot: -6 })}
    <path d="M340,330 Q330,240 360,170 M360,250 Q390,220 420,210 M350,210 Q320,180 300,190" stroke="#5a8a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${[[360, 170], [420, 210], [300, 190], [392, 150], [330, 140]].map(([x, y]) => Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2; return `<ellipse cx="${x + Math.cos(a) * 12}" cy="${y + Math.sin(a) * 12}" rx="10" ry="7" fill="#ffc2d4" transform="rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * 12} ${y + Math.sin(a) * 12})"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="6" fill="#f7a8c0"/>`).join('')}
    <path d="M300,354 Q310,320 340,326 Q370,320 380,354 Z" fill="#8a5a3c"/>
    ${[[60, 80], [110, 120], [420, 60], [250, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ffe3a0" opacity="0.8"/>`).join('')}
    <rect width="464" height="354" fill="url(#vig)"/>
  `, rad('vig', [[0.6, '#000', 0], [1, '#000', 0.35]]))],

  // 방에서 베이스 치는 보라 조명 코코 (음악)
  music: [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="#e8dcc4"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${c * 130 + (r % 2) * 65 - 30}" y="${r * 60}" width="124" height="54" rx="3" fill="#efe5d0"/>`).join('')).join('')}
    <rect x="0" y="0" width="80" height="480" fill="#8a5a3c"/><rect x="0" y="0" width="80" height="480" fill="url(#wood)"/>
    <rect x="330" y="80" width="10" height="70" fill="#5a3c28"/><path d="M322,80 L348,80 L340,60 L330,60 Z" fill="#ffb347"/><circle cx="335" cy="56" r="14" fill="#ffd27a" opacity="0.7"/>
    <rect x="300" y="200" width="150" height="190" rx="8" fill="#6b8fd6"/><rect x="314" y="214" width="122" height="162" fill="#f4d97a"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${330 + (i % 3) * 30}" y="${232 + i * 28}" width="22" height="10" fill="#e8b84a"/>`).join('')}
    <rect y="410" width="480" height="70" fill="#5a4a7a"/>
    ${coco(220, 470, 300, { mood: 'calm', over: guitar('#d92b5b', '#5a3c28') + `<path d="M150,180 l20,0 M230,180 l20,0" stroke="#fff" stroke-width="3" opacity="0.5"/>` })}
    <rect width="480" height="480" fill="#7a3fb8" opacity="0.18"/>
    <g fill="#7a3fb8" stroke="#7a3fb8" opacity="0.8">
      <ellipse cx="384" cy="150" rx="11" ry="8" transform="rotate(-20 384 150)"/><path d="M393,148 L393,108 Q404,116 410,128" stroke-width="4" fill="none"/>
      <ellipse cx="420" cy="104" rx="9" ry="7" transform="rotate(-20 420 104)"/><ellipse cx="450" cy="96" rx="9" ry="7" transform="rotate(-20 450 96)"/>
      <path d="M428,102 L428,66 L458,58 L458,94" stroke-width="4" fill="none"/><path d="M428,66 L458,58 L458,66 L428,74 Z"/>
    </g>
  `, lin('wood', [[0, '#7a4e30'], [1, '#a06a44']], 1, 0))],

  // 붉은 커튼 앞 무대에 선 나비넥타이 코코 (공연)
  'show-poster': [480, 480, () => svg(480, 480, `
    <rect width="480" height="480" fill="#2a1a14"/>
    <rect x="10" y="10" width="460" height="460" fill="url(#bg)"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${10 + i * 26},10 Q${30 + i * 26},240 ${10 + i * 20},470" stroke="#7a1420" stroke-width="10" fill="none" opacity="0.5"/>`).join('')}
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${470 - i * 26},10 Q${450 - i * 26},240 ${470 - i * 20},470" stroke="#7a1420" stroke-width="10" fill="none" opacity="0.5"/>`).join('')}
    <ellipse cx="240" cy="300" rx="190" ry="210" fill="url(#spot)"/>
    <path d="M10,430 Q240,404 470,430 L470,470 L10,470 Z" fill="#4a2414"/>
    <path d="M10,430 Q240,404 470,430" stroke="#d9a441" stroke-width="4" fill="none" opacity="0.7"/>
    ${coco(240, 436, 270, { mood: 'happy', over: `<path d="M200,286 L168,272 L168,300 Z M200,286 L232,272 L232,300 Z" fill="#c8102e"/><circle cx="200" cy="286" r="8" fill="#9a0c22"/>` })}
    <g fill="#ffe7b0" opacity="0.85"><ellipse cx="96" cy="190" rx="11" ry="8" transform="rotate(-20 96 190)"/><path d="M105,188 L105,146" stroke="#ffe7b0" stroke-width="4"/><ellipse cx="380" cy="150" rx="11" ry="8" transform="rotate(-20 380 150)"/><path d="M389,148 L389,106 Q400,114 406,126" stroke="#ffe7b0" stroke-width="4" fill="none"/></g>
    <g>${(() => { const R = rnd(71); let s = ''; for (let i = 0; i < 260; i++) s += `<rect x="${(10 + R() * 456).toFixed(0)}" y="${(10 + R() * 456).toFixed(0)}" width="9" height="3" fill="${R() > 0.5 ? '#000' : '#fff'}" opacity="0.07" transform="rotate(${(R() * 180).toFixed(0)} 240 240)"/>`; return s; })()}</g>
  `, rad('bg', [[0, '#8a2a2a'], [1, '#3a0f12']], 0.5, 0.4, 0.8) + rad('spot', [[0, '#ffe7b0', 0.55], [1, '#ffe7b0', 0]]))],
};

function grillDefs() {
  return rad('fire', [[0, '#ffdf6b'], [0.5, '#ff7b2a'], [1, '#b8261a']]) + rad('vig', [[0.65, '#000', 0], [1, '#000', 0.45]]);
}

/** 위에서 내려다본 고깃집 상: 가운데 불판, 둘레에 반찬 그릇 */
function grillTable(W, H, seed) {
  const R = rnd(seed);
  const S = Math.min(W, H);
  const gx = W * 0.38, gy = H * 0.34, gr = S * 0.3;
  let s = `<rect width="${W}" height="${H}" fill="#2a2a30"/>`;
  for (let i = 0; i < 12; i++) s += `<rect x="0" y="${(i * H) / 12}" width="${W}" height="2" fill="#34343c"/>`;
  // 불판
  s += `<circle cx="${gx}" cy="${gy}" r="${gr + 14}" fill="#555"/><circle cx="${gx}" cy="${gy}" r="${gr}" fill="#1f1f1f"/><circle cx="${gx}" cy="${gy}" r="${gr * 0.92}" fill="url(#fire)" opacity="0.85"/>`;
  for (let i = -6; i <= 6; i++) {
    const y = gy + (i * gr) / 7, half = Math.sqrt(Math.max(0, gr * gr - (y - gy) ** 2));
    s += `<line x1="${gx - half}" y1="${y}" x2="${gx + half}" y2="${y}" stroke="#3a3a3a" stroke-width="4"/>`;
  }
  // 고기
  for (let i = 0; i < 9; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * gr * 0.62;
    const x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d, w = S * 0.11, h = S * 0.055;
    s += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(R() * 60 - 30).toFixed(0)})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 3}" fill="#b5523e"/><rect x="${-w / 2}" y="${-h / 6}" width="${w}" height="${h / 5}" fill="#f2d6c8"/>${[0, 1, 2].map((k) => `<line x1="${-w / 2 + (k + 1) * w / 4}" y1="${-h / 2}" x2="${-w / 2 + (k + 1) * w / 4 - 4}" y2="${h / 2}" stroke="#5a2418" stroke-width="2.5"/>`).join('')}</g>`;
  }
  // 버섯·마늘
  for (let i = 0; i < 5; i++) {
    const a = R() * Math.PI * 2, d = gr * (0.72 + R() * 0.12);
    s += `<circle cx="${gx + Math.cos(a) * d}" cy="${gy + Math.sin(a) * d}" r="${S * 0.022}" fill="#f4ead2" stroke="#c9b48a" stroke-width="2"/>`;
  }
  // 반찬 그릇
  const dishes = [
    ['#e94f37', '#ff8b6b'], ['#7fc36b', '#a6dd8a'], ['#f2c14e', '#ffe08a'], ['#f4ead2', '#fffaf0'],
    ['#8a5a3c', '#b07a52'], ['#e94f37', '#f9a07e'], ['#4f9a48', '#7fc36b'], ['#fff', '#f0e6d8'],
  ];
  const spots = [];
  const tryAdd = (x, y, r) => {
    if (Math.hypot(x - gx, y - gy) < gr + 20 + r) return;
    if (x - r < 6 || y - r < 6 || x + r > W - 6 || y + r > H - 6) return;
    if (spots.some((p) => Math.hypot(p[0] - x, p[1] - y) < p[2] + r + 10)) return;
    spots.push([x, y, r]);
  };
  for (let k = 0; k < 4000 && spots.length < (H > W ? 12 : 7); k++) tryAdd(R() * W, R() * H, S * (0.08 + R() * 0.06));
  spots.forEach(([x, y, r], i) => {
    const [a, b] = dishes[i % dishes.length];
    s += `<circle cx="${x}" cy="${y + 4}" r="${r + 2}" fill="rgba(0,0,0,0.35)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#e9e9ee"/><circle cx="${x}" cy="${y}" r="${r * 0.82}" fill="#d0d0d8"/>`;
    for (let j = 0; j < 9; j++) {
      const aa = R() * Math.PI * 2, dd = Math.sqrt(R()) * r * 0.55;
      s += `<ellipse cx="${x + Math.cos(aa) * dd}" cy="${y + Math.sin(aa) * dd}" rx="${r * 0.28}" ry="${r * 0.16}" fill="${R() > 0.4 ? a : b}" transform="rotate(${(R() * 180).toFixed(0)} ${x + Math.cos(aa) * dd} ${y + Math.sin(aa) * dd})"/>`;
    }
  });
  // 상추 바구니
  const lx = W * 0.82, ly = H * 0.82, lr = S * 0.12;
  s += `<rect x="${lx - lr}" y="${ly - lr * 0.8}" width="${lr * 2}" height="${lr * 1.6}" rx="12" fill="#c9a26b"/>`;
  for (let j = 0; j < 6; j++) s += `<ellipse cx="${lx - lr * 0.6 + j * lr * 0.25}" cy="${ly - lr * 0.1 + (j % 2) * 10}" rx="${lr * 0.4}" ry="${lr * 0.6}" fill="${j % 2 ? '#5fae4a' : '#7fc96a'}" transform="rotate(${j * 20 - 50} ${lx} ${ly})"/>`;
  return s + `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
}

async function render(name) {
  const [w, h, draw] = SCENES[name];
  const resvg = new Resvg(draw(), {
    fitTo: { mode: 'width', value: w * 2 },
    font: { fontDirs: [FONT_DIR], loadSystemFonts: false, defaultFontFamily: 'Pretendard' },
  });
  const png = resvg.render().asPng();
  const out = path.join(OUT, `${name}.jpg`);
  await sharp(png).resize(w, h).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
  console.log(`${name}.jpg  ${w}x${h}  ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
}

(async () => {
  const only = process.argv.slice(2);
  for (const name of only.length ? only : Object.keys(SCENES)) await render(name);
})();
