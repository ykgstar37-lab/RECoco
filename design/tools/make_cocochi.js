// 코코치(인생네컷 유료 테마) 틀 그림을 앱에 넣을 크기로 다듬는다.
// 원본은 C:\Users\ykgst\Downloads\RECoco다마고치 (사용자가 만든 그림, 1254x1254 RGBA).
// 원본이 바뀌면 다시 돌릴 것:  node design/tools/make_cocochi.js
//
// 하는 일
// 1) 1024 로 줄이고 (카드는 화면에서 ~340pt 라 3배로 충분)
// 2) 알파를 살린 채 세게 압축 — 원본 그대로면 다섯 장에 8.8MB 라 앱이 너무 무거워진다
// 3) 창(안에 갇힌 투명한 칸) 자리를 재서 SPOT 표로 찍어준다 → 템플릿에 그대로 적는다
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = 'C:/Users/ykgst/Downloads/RECoco다마고치';
const OUT = path.resolve(__dirname, '../../app/assets/cocochi');
const SIZE = 1024;

// 파일 이름을 색 이름으로 (앱에서는 한글 파일명을 쓰지 않는다)
const NAMES = { 민트: 'mint', 실버: 'silver', 퍼플: 'purple', 핑크: 'pink', 화이트: 'white' };

/** 가장자리에서 흘려 채운 뒤 남은 가장 큰 투명 덩어리 = 화면 창 */
async function window_(buf) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const clear = (i) => data[i * 4 + 3] < 16;

  const outside = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (outside[i] || !clear(i)) continue;
    outside[i] = 1;
    const x = i % W;
    const y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }

  const seen = new Uint8Array(W * H);
  let best = null;
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || outside[s] || !clear(s)) continue;
    let x0 = W;
    let y0 = H;
    let x1 = -1;
    let y1 = -1;
    let n = 0;
    const q = [s];
    seen[s] = 1;
    while (q.length) {
      const i = q.pop();
      n += 1;
      const x = i % W;
      const y = (i / W) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && !seen[j] && !outside[j] && clear(j)) {
          seen[j] = 1;
          q.push(j);
        }
      }
    }
    if (!best || n > best.n) best = { x0, y0, x1, y1, n };
  }
  return { x: best.x0, y: best.y0, w: best.x1 - best.x0 + 1, h: best.y1 - best.y0 + 1 };
}

/** 그림이 실제로 그려진 네모 (바깥 투명 여백을 뺀 자리) */
async function opaqueBox(buf) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * 달걀 몸통만 (사슬 제외). 줄마다 '가장 긴 이어진 칸'이 몸통이고,
 * 사슬은 따로 떨어진 짧은 토막으로 잡히므로 그걸로 가른다.
 */
async function bodyBox(buf) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    let bestS = -1;
    let bestE = -1;
    let s = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && data[(y * W + x) * 4 + 3] > 24;
      if (on && s < 0) s = x;
      if (!on && s >= 0) {
        if (x - s > bestE - bestS) {
          bestS = s;
          bestE = x;
        }
        s = -1;
      }
    }
    if (bestE - bestS < W * 0.12) continue; // 사슬처럼 가는 토막은 몸통이 아니다
    if (bestS < x0) x0 = bestS;
    if (bestE - 1 > x1) x1 = bestE - 1;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const spots = [];
  let before = 0;
  let after = 0;

  for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith('.png'))) {
    const ko = f.replace(/^다마고치_/, '').replace(/\.png$/, '');
    const name = NAMES[ko];
    if (!name) {
      console.log(`  ? ${f} — 색 이름을 모르겠다, 건너뜀`);
      continue;
    }
    const src = path.join(SRC, f);
    before += fs.statSync(src).size;

    const buf = await sharp(src)
      .resize(SIZE, SIZE, { fit: 'inside' })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    const dst = path.join(OUT, `${name}.png`);
    fs.writeFileSync(dst, buf);
    after += buf.length;

    const w = await window_(buf);
    const c = await opaqueBox(buf);
    const b = await bodyBox(buf);
    spots.push({ name, win: w, crop: c, body: b });
    console.log(`  ${name.padEnd(7)} ${(buf.length / 1024 / 1024).toFixed(2)}MB  창 ${w.w}x${w.h}  그림 ${c.w}x${c.h}  몸통 ${b.w}x${b.h} @${b.x},${b.y}`);
  }

  console.log(`\n원본 ${(before / 1024 / 1024).toFixed(1)}MB → ${(after / 1024 / 1024).toFixed(1)}MB`);
  console.log(`\n템플릿에 적을 SPOT (${SIZE} 기준):`);
  console.log('const SPOT: Record<CocochiColor, Spot> = {');
  for (const s of spots)
    console.log(
      `  ${s.name}: { crop: { x: ${s.crop.x}, y: ${s.crop.y}, w: ${s.crop.w}, h: ${s.crop.h} }, win: { x: ${s.win.x}, y: ${s.win.y}, w: ${s.win.w}, h: ${s.win.h} }, body: { x: ${s.body.x}, y: ${s.body.y}, w: ${s.body.w}, h: ${s.body.h} } },`,
    );
  console.log('};');
}

main();
