// 인쇄 내용 "위에" 덮는 투명 종이 질감 PNG를 만든다 (잉크까지 주름·얼룩이 묻어나게)
// 사용법 (design/tools 에서): npm run textures  → app/assets/paper/*.png 덮어씀
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const outDir = process.argv[2] || path.resolve(__dirname, '../../app/assets/paper');
fs.mkdirSync(outDir, { recursive: true });

// deterministic rng
let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/** lighting height map -> RGBA where shadows are translucent black and highlights translucent white */
async function wrinkle({ name, w, h, svgNoise, shadow, highlight, stitch }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    ${svgNoise(stitch ? 'stitchTiles="stitch"' : '')}
    <feDiffuseLighting in="height" surfaceScale="${'SURF'}" diffuseConstant="1" lighting-color="#fff">
      <feDistantLight azimuth="225" elevation="60"/>
    </feDiffuseLighting>
  </filter>
  <rect width="100%" height="100%" filter="url(#f)"/></svg>`;
  const surf = svg.includes('SURF') ? svg.replace("'SURF'", '').replace('SURF', String(wrinkle.surface)) : svg;
  const png = new Resvg(surf).render().asPng();
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  // neutral = median brightness (flat paper)
  const hist = new Array(256).fill(0);
  for (let i = 0; i < px; i++) hist[data[i * info.channels]]++;
  let acc = 0, neutral = 128;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= px / 2) { neutral = v; break; } }
  const outBuf = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const d = data[i * info.channels] - neutral + (rnd() - 0.5) * 2.2; // dither: 8bit 계단 무늬 제거
    const o = i * 4;
    if (d < 0) { outBuf[o] = 40; outBuf[o + 1] = 34; outBuf[o + 2] = 26; outBuf[o + 3] = Math.min(255, -d * shadow); }
    else { outBuf[o] = 255; outBuf[o + 1] = 255; outBuf[o + 2] = 255; outBuf[o + 3] = Math.min(255, d * highlight); }
  }
  const file = path.join(outDir, name);
  await sharp(outBuf, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(file);
  console.log(name, fs.statSync(file).size, 'bytes, neutral', neutral);
}

/** thermal print imperfections: white pinholes, faint dark grain, weak vertical head streaks. Tileable. */
async function speckle({ name, size, holes, grain, streaks }) {
  const buf = Buffer.alloc(size * size * 4);
  const put = (x, y, v, a) => {
    x = ((x % size) + size) % size; y = ((y % size) + size) % size;
    const o = (y * size + x) * 4;
    const na = a / 255, oa = buf[o + 3] / 255, ra = na + oa * (1 - na);
    if (ra <= 0) return;
    for (let c = 0; c < 3; c++) buf[o + c] = Math.round((v * na + buf[o + c] * oa * (1 - na)) / ra);
    buf[o + 3] = Math.round(ra * 255);
  };
  for (let x = 0; x < size; x++) {
    // 감열 헤드 줄무늬: 몇몇 세로줄이 살짝 흐리게 인쇄됨
    if (rnd() < streaks) { const a = 20 + rnd() * 40; for (let y = 0; y < size; y++) put(x, y, 255, a * (0.6 + 0.4 * Math.sin(y * 0.01 + x))); }
  }
  for (let i = 0; i < holes; i++) {
    const x = Math.floor(rnd() * size), y = Math.floor(rnd() * size), a = 120 + rnd() * 135;
    put(x, y, 255, a);
    if (rnd() < 0.45) put(x + 1, y, 255, a * 0.7);
    if (rnd() < 0.3) put(x, y + 1, 255, a * 0.6);
  }
  for (let i = 0; i < grain; i++) {
    const x = Math.floor(rnd() * size), y = Math.floor(rnd() * size);
    put(x, y, 60, 10 + rnd() * 26);
  }
  const file = path.join(outDir, name);
  await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
  console.log(name, fs.statSync(file).size, 'bytes');
}

(async () => {
  // 감열지: 부드럽고 큰 주름 + 옅은 꺾임 (레퍼런스 사진처럼 과하지 않게)
  wrinkle.surface = 4;
  await wrinkle({
    name: 'thermal-wrinkle.png', w: 300, h: 400, stitch: true, shadow: 2.6, highlight: 2.1,
    svgNoise: (st) => `
      <feTurbulence type="fractalNoise" baseFrequency="0.0067 0.005" numOctaves="2" seed="8" ${st} result="soft"/>
      <feTurbulence type="turbulence" baseFrequency="0.0067 0.004" numOctaves="1" seed="31" ${st} result="crease"/>
      <feComposite in="soft" in2="crease" operator="arithmetic" k2="0.65" k3="0.35" result="height"/>`,
  });
  // 손글씨 간이영수증: 접혔다 펴진 정도의 구김 ('꼬깃'하지 않게)
  wrinkle.surface = 4;
  await wrinkle({
    name: 'handwritten-wrinkle.png', w: 320, h: 670, stitch: false, shadow: 3.4, highlight: 2.8,
    svgNoise: (st) => `
      <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.0035" numOctaves="2" seed="23" ${st} result="soft"/>
      <feTurbulence type="turbulence" baseFrequency="0.0055 0.004" numOctaves="1" seed="41" ${st} result="crease"/>
      <feComposite in="soft" in2="crease" operator="arithmetic" k2="0.5" k3="0.5" result="height"/>`,
  });
  await speckle({ name: 'thermal-speckle.png', size: 512, holes: 5200, grain: 9000, streaks: 0.05 });
  await speckle({ name: 'paper-grain.png', size: 512, holes: 900, grain: 14000, streaks: 0 });
})();
