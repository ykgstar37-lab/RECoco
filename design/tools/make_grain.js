// 소비 사진 영수증의 '프린트 필터' 점 무늬: 복사기·감열지로 뽑은 사진처럼 자글자글한 검은 점·흰 점.
// 점마다 따로 뽑으니 이어 붙여도 이음매가 없다. → app/assets/paper/print-grain.png (256×256, 투명 배경)
// 실행: node make_grain.js
const path = require('path');
const sharp = require('sharp');

let seed = 20261018;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const SIZE = 256;
const buf = Buffer.alloc(SIZE * SIZE * 4);
const put = (x, y, v, a) => {
  x = (x + SIZE) % SIZE;
  y = (y + SIZE) % SIZE;
  const o = (y * SIZE + x) * 4;
  if (buf[o + 3] >= a) return;
  buf[o] = buf[o + 1] = buf[o + 2] = v;
  buf[o + 3] = a;
};

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const r = rnd();
    if (r < 0.11) {
      // 검은 점 (가끔 옆으로 번진다)
      const a = 50 + rnd() * 90;
      put(x, y, 20, a);
      if (rnd() < 0.3) put(x + 1, y, 20, a * 0.6);
    } else if (r < 0.2) {
      // 흰 점 (잉크가 빠진 자리)
      const a = 60 + rnd() * 100;
      put(x, y, 255, a);
      if (rnd() < 0.25) put(x, y + 1, 255, a * 0.6);
    }
  }
}

const out = path.join(__dirname, '..', '..', 'app', 'assets', 'paper', 'print-grain.png');
sharp(buf, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(out)
  .then(() => console.log('wrote', out));
