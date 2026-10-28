// 코코몬 카드 틀(app/assets/cards/*.jpg) 아래에 굳어 있는 "RECoco ★ 날짜" 글자를 지운다.
// 양식이 날짜 판을 모든 카드에서 같은 자리(빨간 C 카드 자리)에 그리게 되면서, 원래 자리에 남은 글자가 보이지 않게.
// 글자 픽셀만 골라 둘레 바탕을 번지게 채운다 (바탕이 구름·그라데이션이라 흐리게 채워도 티가 안 난다).
//   사용법 (design/tools 에서): node erase_card_feet.js   — make_cards.js 를 다시 돌렸다면 그 뒤에 한 번
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

sharp.cache(false); // 같은 파일을 읽고 바로 덮어쓰므로

const DIR = path.resolve(__dirname, '../../app/assets/cards');
const SRC_W = 1086;
// 글자 자리 (원본 1086×1448 기준, FourcutCard.tsx 의 SPOT.foot 과 같음)
const FOOT = {
  C: { x0: 688, x1: 1017, y0: 1352, y1: 1395 },
  B: { x0: 594, x1: 965, y0: 1337, y1: 1387 },
  A: { x0: 426, x1: 713, y0: 1380, y1: 1420 },
  S: { x0: 690, x1: 1002, y0: 1331, y1: 1371 },
  SS: { x0: 408, x1: 680, y0: 1365, y1: 1407 },
  R: { x0: 407, x1: 680, y0: 1359, y1: 1400 },
};
const MARGIN = 24; // 채울 때 둘러볼 폭 (원본 px)
const SIGMA = 5;

(async () => {
  for (const [rank, f] of Object.entries(FOOT)) {
    const file = path.join(DIR, `${rank}.jpg`);
    const meta = await sharp(file).metadata();
    const s = meta.width / SRC_W;
    const box = {
      left: Math.max(0, Math.round((f.x0 - MARGIN) * s)),
      top: Math.max(0, Math.round((f.y0 - MARGIN) * s)),
    };
    box.width = Math.min(meta.width - box.left, Math.round((f.x1 - f.x0 + MARGIN * 2) * s));
    box.height = Math.min(meta.height - box.top, Math.round((f.y1 - f.y0 + MARGIN * 2) * s));
    const { data } = await sharp(file).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = box.width;
    const H = box.height;
    // 글자 = 글자 자리 안의 어두운 픽셀, 번짐까지 2px 넓힌다
    const inner = { x0: Math.round(MARGIN * s), x1: W - Math.round(MARGIN * s), y0: Math.round(MARGIN * s), y1: H - Math.round(MARGIN * s) };
    const dark = new Uint8Array(W * H);
    for (let y = inner.y0; y < inner.y1; y++)
      for (let x = inner.x0; x < inner.x1; x++) {
        const i = (y * W + x) * 3;
        const luma = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        if (luma < 185) dark[y * W + x] = 1;
      }
    const mask = new Uint8Array(W * H);
    const R = 3;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!dark[y * W + x]) continue;
        for (let dy = -R; dy <= R; dy++)
          for (let dx = -R; dx <= R; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < W && ny < H) mask[ny * W + nx] = 1;
          }
      }
    // 정규화 블러: 글자를 뺀 바탕만 흐리게 번진 값으로 글자 자리를 채운다 (두 번 반복해 큰 구멍도 메운다)
    const img = Buffer.from(data);
    let hole = mask;
    for (let pass = 0; pass < 3; pass++) {
      const keep = Buffer.alloc(W * H);
      const premul = Buffer.alloc(W * H * 3);
      for (let k = 0; k < W * H; k++) {
        if (hole[k]) continue;
        keep[k] = 255;
        premul[k * 3] = img[k * 3];
        premul[k * 3 + 1] = img[k * 3 + 1];
        premul[k * 3 + 2] = img[k * 3 + 2];
      }
      const sigma = SIGMA * s * (pass + 1);
      const bc = await sharp(premul, { raw: { width: W, height: H, channels: 3 } }).blur(sigma).raw().toBuffer();
      const bk = await sharp(keep, { raw: { width: W, height: H, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
      const next = new Uint8Array(W * H);
      for (let k = 0; k < W * H; k++) {
        if (!hole[k]) continue;
        const w = bk[k] / 255;
        if (w < 0.05) {
          next[k] = 1; // 아직 둘레에 바탕이 없다 — 다음 번에 더 넓게
          continue;
        }
        for (let c = 0; c < 3; c++) img[k * 3 + c] = Math.min(255, Math.round(bc[k * 3 + c] / w));
      }
      hole = next;
    }
    const patch = await sharp(img, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
    const out = await sharp(file).composite([{ input: patch, left: box.left, top: box.top }]).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    fs.writeFileSync(file, out);
    console.log('지움', rank, box);
  }
})();
