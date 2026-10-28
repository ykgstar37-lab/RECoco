// 코코몬 카드 사진 창 덮개 만들기: 카드 틀(app/assets/cards/*.jpg)에서 사진 창 둘레만 오려
// 회색 PHOTO 자리를 투명하게 뚫은 PNG(win-*.png)로 저장한다.
// 양식이 사진을 이 덮개 아래에 깔아서, 창 모서리에 걸친 별은 사진 위로 올라오고 테두리와 사진 사이 틈도 없어진다.
//   사용법 (design/tools 에서): node make_card_windows.js
// 창 좌표는 app/src/templates/FourcutCard.tsx 의 SPOT.win 과 같아야 한다 (원본 1086×1448 기준)
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '../../app/assets/cards');
const SRC_W = 1086;
const WIN = {
  C: { x0: 118, x1: 972, topL: 210, notchFrom: 600, notchTo: 700, topR: 275, bottom: 905 },
  B: { x0: 140, x1: 945, topL: 290, notchFrom: 610, notchTo: 690, topR: 335, bottom: 915 },
  A: { x0: 100, x1: 1034, topL: 172, notchFrom: 610, notchTo: 700, topR: 258, bottom: 888 },
  S: { x0: 120, x1: 970, topL: 275, notchFrom: 600, notchTo: 700, topR: 288, bottom: 865 },
  SS: { x0: 115, x1: 975, topL: 225, notchFrom: 610, notchTo: 700, topR: 305, bottom: 920 },
  R: { x0: 92, x1: 1000, topL: 215, notchFrom: 600, notchTo: 700, topR: 300, bottom: 905 },
};
// 덮개는 창보다 이만큼 넓게 (원본 px). 양식의 WIN_PAD 와 같아야 한다
const PAD = 24;
// 회색 바탕으로 칠 색 차이
const TOL = 12;

/** 점 (x, y) 가 꺾인 창 모양 안에 있는지 */
function inWindow(w, x, y) {
  if (x < w.x0 || x > w.x1 || y > w.bottom) return false;
  // 윗변: notchFrom 까지 topL, notchTo 부터 topR, 그 사이는 비스듬히
  const t = x <= w.notchFrom ? w.topL : x >= w.notchTo ? w.topR : w.topL + ((x - w.notchFrom) / (w.notchTo - w.notchFrom)) * (w.topR - w.topL);
  return y >= t;
}

(async () => {
  for (const [rank, w] of Object.entries(WIN)) {
    const file = path.join(DIR, `${rank}.jpg`);
    const meta = await sharp(file).metadata();
    const s = meta.width / SRC_W;
    const box = {
      left: Math.round((w.x0 - PAD) * s),
      top: Math.round((w.topL - PAD) * s),
      width: Math.round((w.x1 - w.x0 + PAD * 2) * s),
      height: Math.round((w.bottom - w.topL + PAD * 2) * s),
    };
    const { data } = await sharp(file).extract(box).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = box.width;
    const H = box.height;
    const at = (x, y) => (y * W + x) * 4;
    // 창 안쪽(살짝 넓혀서)만 뚫을 수 있다 — 은색 테두리를 넘어 바깥까지 번지지 않게
    const reach = 5;
    const allowed = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const sx = x / s + w.x0 - PAD;
        const sy = y / s + w.topL - PAD;
        const grow = { ...w, x0: w.x0 - reach, x1: w.x1 + reach, topL: w.topL - reach, topR: w.topR - reach, bottom: w.bottom + reach };
        allowed[y * W + x] = inWindow(grow, sx, sy) ? 1 : 0;
      }
    // 1) 가운데서 시작해 회색 PHOTO 바탕을 채운다
    // 바탕색은 카드마다 조금 달라서 창 가운데 색을 기준으로 잡는다 (은색 테두리의 밝은 곳과 헷갈리지 않게 좁게)
    const c = at(Math.round(W / 2), Math.round(H * 0.4));
    const ref = [data[c], data[c + 1], data[c + 2]];
    const grey = (i) => Math.abs(data[i] - ref[0]) <= TOL && Math.abs(data[i + 1] - ref[1]) <= TOL && Math.abs(data[i + 2] - ref[2]) <= TOL;
    const hole = new Uint8Array(W * H);
    const stack = [[Math.round(W / 2), Math.round(H * 0.4)]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const k = y * W + x;
      if (hole[k] || !allowed[k] || !grey(k * 4)) continue;
      hole[k] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    // 2) 회색 바탕에 둘러싸인 것(PHOTO 글자, 창 안의 작은 별)도 뚫는다.
    //    창 바깥과 이어진 것(테두리에 걸친 큰 별, 로고)은 남는다
    const outside = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        if (!allowed[k]) outside[k] = 1;
      }
    const seeds = [];
    for (let k = 0; k < W * H; k++) if (outside[k]) seeds.push(k);
    while (seeds.length) {
      const k = seeds.pop();
      const x = k % W;
      const y = (k - x) / W;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (outside[n] || hole[n]) continue;
        outside[n] = 1;
        seeds.push(n);
      }
    }
    // 3) 뚫린 곳 둘레 1px 도 뚫어 회색 테두리 번짐을 없애고, 가장자리는 부드럽게
    const alpha = Buffer.alloc(W * H);
    for (let k = 0; k < W * H; k++) alpha[k] = outside[k] ? 255 : 0;
    const eroded = Buffer.from(alpha);
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const k = y * W + x;
        if (alpha[k] && (!alpha[k - 1] || !alpha[k + 1] || !alpha[k - W] || !alpha[k + W])) eroded[k] = 0;
      }
    const soft = await sharp(eroded, { raw: { width: W, height: H, channels: 1 } }).blur(0.6).extractChannel(0).raw().toBuffer();
    for (let k = 0; k < W * H; k++) data[k * 4 + 3] = soft[k];
    const out = path.join(DIR, `win-${rank}.png`);
    await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
    console.log('만듦', out, box);
  }
})();
