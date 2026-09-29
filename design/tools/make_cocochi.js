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
 * 달걀 몸통 네모 (사슬 제외).
 *
 * ⚠️ 줄마다 '가장 긴 불투명 칸'으로 재면 **창이 가로지르는 줄에서 왼쪽 토막만** 잡혀,
 *    정작 제일 넓은 줄이 빠진다. 민트에서 15px 좁게 재졌고, 그만큼 옆구리가 안 칠해져
 *    광택 띠가 남아 있었다. 그러니 **창도 몸통으로 치고** 가운데에서 좌우로 퍼뜨린다.
 *    사슬은 투명한 틈 건너에 있어 알아서 빠진다.
 */
async function bodyBox(buf, win) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const solid = (x, y) => {
    if (x < 0 || x >= W) return false;
    if (x >= win.x && x < win.x + win.w && y >= win.y && y < win.y + win.h) return true;
    return data[(y * W + x) * 4 + 3] >= 16;
  };
  const cx = Math.round(win.x + win.w / 2); // 창은 몸통 한가운데에 있다
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    if (!solid(cx, y)) continue;
    let s = cx;
    let e = cx;
    while (solid(s - 1, y)) s -= 1;
    while (solid(e + 1, y)) e += 1;
    if (x0 > s) x0 = s;
    if (x1 < e) x1 = e;
    if (y0 > y) y0 = y;
    if (y1 < y) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * 뒷면 그림을 굽는다. 몸통을 **민색으로 꽉 채우고** 사슬은 그대로 둔다.
 * 판을 SVG 로 덧그리면 내 달걀 곡선이 실루엣과 꼭 맞지 않아 테두리가 새어 나왔다 —
 * 그림 자체를 만들면 한 올도 안 샌다.
 *
 * ⚠️ '가장자리에서 흘려 채워 바깥을 찾는' 방법은 여기서 안 통한다.
 *    사슬 끝 고리가 달걀에 닿아 **달걀과 사슬 사이 주머니를 가둬 버려서**, 그 주머니가
 *    바깥으로 안 새고 몸통으로 잡힌다(사슬이 통째로 먹혔던 이유).
 *    그래서 **몸통 네모 안 + 불투명** 으로 가르고, 창은 네모째 따로 메운다.
 *
 * 민색은 몸통의 중앙값을 뽑아 쓴다 (원본을 다시 그려도 알아서 따라온다).
 */
async function backPlate(buf, body, win) {
  const img = sharp(buf).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  const inBody = (x, y) => x >= body.x && x < body.x + body.w && y >= body.y && y < body.y + body.h;

  // 민색: 몸통의 중앙값. 최빈값을 쓰면 은색·흰색이 하이라이트에 끌려 순백이 된다
  const chans = [[], [], []];
  for (let y = body.y; y < body.y + body.h; y += 2) {
    for (let x = body.x; x < body.x + body.w; x += 2) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 250) continue;
      for (let c = 0; c < 3; c++) chans[c].push(data[i + c]);
    }
  }
  const flat = chans.map((v) => {
    v.sort((a, b) => a - b);
    return v[v.length >> 1] ?? 220;
  });

  // 가장자리로 갈수록 살짝 어둡게 — 도톰한 느낌만 남긴다
  const shade = (x, y) => {
    const dx = Math.abs(x - (body.x + body.w / 2)) / (body.w / 2);
    const dy = Math.abs(y - (body.y + body.h / 2)) / (body.h / 2);
    const d = Math.min(1, Math.hypot(dx, dy));
    return 1 - 0.1 * d * d;
  };
  const paint = (i, x, y, opaque) => {
    const k = shade(x, y);
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(flat[c] * k);
    if (opaque) out[i + 3] = 255;
  };

  const out = Buffer.from(data);
  const cx = Math.round(body.x + body.w / 2);
  // 몸통이거나 창이면 '이어진 것'으로 본다 (창이 가운데를 뚫고 있어서 창도 이어야 한다).
  // ⚠️ 기준을 100 으로 잡으면 **창 둘레 반투명 테두리**에서 퍼짐이 멈춰 젬이 새어 나온다.
  //    달걀과 사슬 사이는 진짜로 비어 있으니(알파 0) 16 이면 거기서 알아서 멈춘다
  const solid = (x, y) => {
    if (!inBody(x, y)) return false;
    if (x >= win.x && x < win.x + win.w && y >= win.y && y < win.y + win.h) return true;
    return data[(y * W + x) * 4 + 3] >= 16;
  };

  // 줄마다 가운데에서 좌우로 퍼져 달걀 가장자리를 찾는다
  const left = [];
  const right = [];
  for (let y = body.y; y < body.y + body.h; y++) {
    if (!solid(cx, y)) continue;
    let s = cx;
    let e = cx;
    while (s - 1 >= body.x && solid(s - 1, y)) s -= 1;
    while (e + 1 < body.x + body.w && solid(e + 1, y)) e += 1;
    left[y] = s;
    right[y] = e;
  }

  /**
   * ⚠️ 가장자리를 다듬으려다 두 번 헛짚었다. 둘 다 **옆구리를 잘라** 꾸밈이 드러났다:
   * - 수식(초타원)으로 알 안쪽만 칠하기 → 달걀이 수식보다 통통해서 모자랐다
   * - 이웃 줄 중앙값(±40)으로 누르기 → 위아래에서는 윤곽이 빠르게 벌어져서
   *   **실측값이 중앙값보다 최대 64px 바깥**이다. 그만큼이 통째로 잘려 나갔다
   *
   * 그래서 실측한 가장자리를 **그대로** 쓴다. 사슬이 달걀에 닿은 줄에서 가장자리가
   * 살짝 톱니지는 건 원본 그림 그대로라 남겨 둔다 (앞면에도 똑같이 있다).
   */
  // 칠할 자리를 먼저 표로 만든다 (바로 칠하지 않고 아래에서 혹을 깎아낸 뒤 칠한다)
  let mask = new Uint8Array(W * H);
  for (let y = body.y; y < body.y + body.h; y++) {
    if (left[y] === undefined) continue;
    for (let x = left[y]; x <= right[y]; x++) mask[y * W + x] = 1;
  }

  /**
   * ⚠️ 고리와 사슬 클립이 달걀에 닿은 자리에서 칠이 **달걀 밖으로 삐져나온다**.
   * 목이 가는 혹이라 **깎았다 다시 부풀리면**(열림 연산) 떨어져 나간다.
   * 달걀 본체는 두툼해서 깎아도 안 끊긴다.
   */
  const R = 30;
  const box = (src, r, pick) => {
    const tmp = new Uint8Array(W * H);
    const dst = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let v = pick === Math.min ? 1 : 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          v = pick(v, xx < 0 || xx >= W ? 0 : src[y * W + xx]);
        }
        tmp[y * W + x] = v;
      }
    for (let x = 0; x < W; x++)
      for (let y = 0; y < H; y++) {
        let v = pick === Math.min ? 1 : 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k;
          v = pick(v, yy < 0 || yy >= H ? 0 : tmp[yy * W + x]);
        }
        dst[y * W + x] = v;
      }
    return dst;
  };

  const core = box(mask, R, Math.min); // 깎기
  // 깎고 남은 것 중 제일 큰 덩어리만 = 달걀 본체 (혹은 떨어져 나간다)
  const seen = new Uint8Array(W * H);
  let biggest = null;
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || !core[s]) continue;
    const cell = [s];
    const q = [s];
    seen[s] = 1;
    while (q.length) {
      const i = q.pop();
      const x = i % W;
      const y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && !seen[j] && core[j]) {
          seen[j] = 1;
          cell.push(j);
          q.push(j);
        }
      }
    }
    if (!biggest || cell.length > biggest.length) biggest = cell;
  }
  const kept = new Uint8Array(W * H);
  for (const i of biggest) kept[i] = 1;
  const grown = box(kept, R, Math.max); // 다시 부풀리기
  for (let i = 0; i < W * H; i++) mask[i] = mask[i] && grown[i] ? 1 : 0;

  for (let y = body.y; y < body.y + body.h; y++) {
    for (let x = body.x; x < body.x + body.w; x++) {
      if (!mask[y * W + x]) continue;
      const i = (y * W + x) * 4;
      const a = data[i + 3];
      /**
       * ⚠️ 껍데기 가장자리에 **반투명 광택 띠**가 있다. 색만 칠하고 알파를 그대로 두면
       * 거기로 뒤가 비쳐서 '안 채워진 띠'처럼 보인다 → 어지간히 진한 칸은 알파도 꽉 채운다.
       * 아주 옅은 칸(16~60)만 남겨야 달걀 테두리가 거칠어지지 않는다.
       */
      paint(i, x, y, a < 16 || a >= 60);
    }
  }

  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  return { png, flat: `#${flat.map((v) => v.toString(16).padStart(2, '0')).join('')}` };
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
    const b = await bodyBox(buf, w);

    // 뒷면 (몸통을 민색으로 꽉 채운 것)
    const back = await backPlate(buf, b, w);
    fs.writeFileSync(path.join(OUT, `${name}-back.png`), back.png);
    after += back.png.length;

    spots.push({ name, win: w, crop: c, body: b, flat: back.flat });
    console.log(`  ${name.padEnd(7)} 앞 ${(buf.length / 1024).toFixed(0)}KB + 뒤 ${(back.png.length / 1024).toFixed(0)}KB  민색 ${back.flat}  몸통 ${b.w}x${b.h}`);
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
