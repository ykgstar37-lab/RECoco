// 인스타그램 피드 게시물 (세로 4:5, 1080×1350) — 피그마에서 고칠 SVG 와 바로 올릴 PNG 를 같이 만든다.
// 스토어 스크린샷(marketing/store)과 같은 배경·글꼴·주황 톤. 영수증 그림은 design/previews 의 실제 양식 PNG 를 쓴다.
//
// 실행: node marketing/insta/make-insta.mjs   → marketing/insta/feed-01.svg · feed-01.png
// - SVG 안의 그림은 base64 로 들어 있어 피그마로 끌어다 놓으면 그대로 보인다
// - 글자는 글자로 남는다 (Pretendard). 피그마에서 글꼴이 다르면 PC 에 app/assets/fonts/*.otf 설치
// - 문구를 바꾸려면 아래 COPY 만 고치면 된다
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PREV = path.join(ROOT, 'design/previews');
const FONTS = path.join(ROOT, 'app/assets/fonts');
const sharp = createRequire(path.join(ROOT, 'design/tools/package.json'))('sharp');

const W = 1080;
const H = 1350;
const C = { orange: '#ff7a2f', ink: '#1f1f22', sub: '#8b8b91', paper: '#fffaf4' };
const FONT = 'Pretendard, Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif';

const COPY = {
  cap: 'RECOCO · 레코코',
  a: '오늘 하루도',
  b: '영수증으로 남겨요',
  sub: '책 · 영화 · 카페 · 인생네컷 · 여행 — 적으면 한 장으로 뽑혀 나와요',
  pill: '곧 App Store에서 만나요',
};

/** 흩어 놓을 영수증 (실제 양식 미리보기). x, y 는 왼쪽 위, h 는 보이는 높이, r 은 기울기 */
const PIECES = [
  { file: '네컷하우스_pink', x: 40, y: 470, h: 780, r: -6 },
  { file: '맛집_집_카페', x: 700, y: 455, h: 760, r: 5 },
  { file: '영화_티켓_홍보', x: 345, y: 500, h: 720, r: -1 }, // 실제 극장 이름(상표)이 없는 판
];
const COCO = { file: '캐릭터_코코_orange_happy', x: 690, y: 1065, w: 330 };

async function embed(file, w, h) {
  // 피그마에서 키워 봐도 깨지지 않게 1.5배로 넣는다
  const buf = await sharp(path.join(PREV, `${file}.png`)).resize(Math.round(w * 1.5), Math.round(h * 1.5)).png({ compressionLevel: 9 }).toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function main() {
  const pieces = [];
  for (const p of PIECES) {
    const m = await sharp(path.join(PREV, `${p.file}.png`)).metadata();
    const w = Math.round((p.h * m.width) / m.height);
    const cx = p.x + w / 2;
    const cy = p.y + p.h / 2;
    pieces.push(`    <image id="${p.file}" x="${p.x}" y="${p.y}" width="${w}" height="${p.h}" transform="rotate(${p.r} ${cx} ${cy})" href="${await embed(p.file, w, p.h)}"/>`);
  }
  const cm = await sharp(path.join(PREV, `${COCO.file}.png`)).metadata();
  const cocoH = Math.round((COCO.w * cm.height) / cm.width);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${C.paper}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.86" cy="0.08" r="0.7">
      <stop offset="0" stop-color="${C.orange}" stop-opacity="0.24"/>
      <stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.96" r="0.6">
      <stop offset="0" stop-color="${C.orange}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <g id="Background">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  </g>

  <g id="Copy" font-family="${FONT}">
    <text x="72" y="118" font-size="30" font-weight="700" letter-spacing="7" fill="${C.orange}">${esc(COPY.cap)}</text>
    <text x="72" y="222" font-size="86" font-weight="800" letter-spacing="-3.4" fill="${C.ink}">${esc(COPY.a)}</text>
    <text x="72" y="326" font-size="86" font-weight="800" letter-spacing="-3.4" fill="${C.orange}">${esc(COPY.b)}</text>
    <text x="72" y="398" font-size="30" font-weight="500" fill="${C.sub}">${esc(COPY.sub)}</text>
  </g>

  <g id="Receipts">
${pieces.join('\n')}
  </g>

  <image id="Coco" x="${COCO.x}" y="${COCO.y}" width="${COCO.w}" height="${cocoH}" href="${await embed(COCO.file, COCO.w, cocoH)}"/>

  <g id="Pill" font-family="${FONT}">
    <rect x="72" y="1226" width="440" height="72" rx="36" fill="${C.ink}"/>
    <text x="292" y="1273" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(COPY.pill)}</text>
  </g>
</svg>
`;
  const svgPath = path.join(HERE, 'feed-01.svg');
  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`SVG ${(fs.statSync(svgPath).size / 1024).toFixed(0)} KB → ${path.relative(process.cwd(), svgPath)}`);

  // 바로 올릴 PNG (크롬으로 구워 글꼴·그림자 그대로)
  const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) =>
    fs.existsSync(p),
  );
  if (!chrome) return console.log('Chrome 이 없어 PNG 는 건너뜀');
  const face = (file, weight) =>
    `@font-face{font-family:'Pretendard';font-weight:${weight};src:url('file:///${path.join(FONTS, file).replace(/\\/g, '/')}')}`;
  const page = path.join(os.tmpdir(), 'recoco-insta.html');
  fs.writeFileSync(
    page,
    `<!doctype html><meta charset="utf-8"><style>${face('Pretendard-Regular.otf', 400)}${face('Pretendard-Regular.otf', 500)}${face('Pretendard-SemiBold.otf', 600)}${face('Pretendard-Bold.otf', 700)}${face('Pretendard-Bold.otf', 800)}html,body{margin:0;overflow:hidden}svg{display:block}</style>${svg}`,
    'utf8',
  );
  const pngPath = path.join(HERE, 'feed-01.png');
  await run(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, `--screenshot=${pngPath}`, '--virtual-time-budget=4000', `file:///${page.replace(/\\/g, '/')}`]);
  fs.rmSync(page, { force: true });
  console.log(`PNG ${W}×${H} → ${path.relative(process.cwd(), pngPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
