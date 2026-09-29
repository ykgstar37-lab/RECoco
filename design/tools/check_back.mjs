// 뒷면 그림에 '안 채워진 칸'이 남았는지 센다.
// 민색에서 많이 벗어난 불투명 칸을 찾아 어디에 몰려 있는지 알려준다.
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve(import.meta.dirname, '../../app/assets/cocochi');
const COLORS = ['mint', 'silver', 'purple', 'pink', 'white'];

for (const name of COLORS) {
  const img = sharp(path.join(DIR, `${name}-back.png`)).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  // 민색 = 가운데 칸의 색
  const mid = ((H >> 1) * W + (W >> 1)) * 4;
  const flat = [data[mid], data[mid + 1], data[mid + 2]];

  let odd = 0;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 200) continue;
      // 사슬은 오른쪽 바깥이라 뺀다 (고리 부분은 안 채워도 된다고 했다)
      if (x > W * 0.72 && y < H * 0.85) continue;
      // 민색에 밝기만 곱한 것(그늘)은 채워진 것으로 본다 → 색이 다른 칸만 센다
      const p = [data[i], data[i + 1], data[i + 2]];
      const k = (p[0] * flat[0] + p[1] * flat[1] + p[2] * flat[2]) / (flat[0] ** 2 + flat[1] ** 2 + flat[2] ** 2);
      const d = Math.abs(p[0] - k * flat[0]) + Math.abs(p[1] - k * flat[1]) + Math.abs(p[2] - k * flat[2]);
      if (d < 26) continue;
      odd += 1;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const where = odd ? `x ${x0}~${x1}, y ${y0}~${y1}` : '-';
  console.log(`${name.padEnd(7)} 민색 rgb(${flat})  안 채워진 칸 ${String(odd).padStart(7)}  ${where}`);
}
