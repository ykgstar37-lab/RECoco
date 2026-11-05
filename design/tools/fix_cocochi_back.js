// 코코치 뒷면 그림(app/assets/cocochi/*-back.png)의 남은 티를 지운다.
// 원본(Downloads/RECoco다마고치)이 없어도 돌 수 있게, 이미 구운 뒷면 그림을 그대로 고친다.
//   node design/tools/fix_cocochi_back.js          → 덩어리만 찍어 본다
//   node design/tools/fix_cocochi_back.js --write  → 고쳐서 덮어쓴다
//
// 고치는 것
// 1) 화면 창 자리 네모 테두리: 창 둘레의 반투명 테두리가 덜 칠해져 가는 선으로 남았다
//    → 테두리 띠를 비워 두고 둘레 색으로 스며들게 메운다 (몸통은 부드러운 그러데이션이라 티가 안 난다)
// 2) 화이트만: 달걀 위로 삐져나온 앞면의 보라 귀 두 개. 귀 자리(EARS) 안에서 달걀 꼭대기보다 위는 다 지운다
//    ⚠️ 자리를 안 정하고 '몸통 색과 다른 칸'을 다 지웠더니 사슬 고리까지 뜯겼다
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '../../app/assets/cocochi');
const write = process.argv.includes('--write');

// templates/FourcutCocochi.tsx 의 SPOT 과 같은 값 (1024 기준)
const SPOT = {
  mint: { win: { x: 313, y: 295, w: 396, h: 403 }, body: { x: 72, y: 28, w: 842, h: 975 } },
  silver: { win: { x: 281, y: 291, w: 413, h: 403 }, body: { x: 59, y: 32, w: 851, h: 959 } },
  purple: { win: { x: 300, y: 292, w: 392, h: 394 }, body: { x: 57, y: 19, w: 851, h: 991 } },
  pink: { win: { x: 285, y: 277, w: 413, h: 423 }, body: { x: 39, y: 13, w: 864, h: 989 } },
  white: { win: { x: 280, y: 286, w: 407, h: 411 }, body: { x: 37, y: 33, w: 859, h: 979 }, ears: { x0: 290, x1: 690 } },
};

const BAND = 7; // 창 테두리 안팎으로 메울 폭
const NEAR = 40; // 몸통 색과 이만큼 안쪽이면 '몸통'

(async () => {
  for (const [name, { win, body, ears }] of Object.entries(SPOT)) {
    const file = path.join(DIR, `${name}-back.png`);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const at = (x, y) => (y * W + x) * 4;

    // 몸통 색 = 몸통 네모 안 불투명 칸의 중앙값
    const ch = [[], [], []];
    for (let y = body.y; y < body.y + body.h; y += 3)
      for (let x = body.x; x < body.x + body.w; x += 3) {
        const i = at(x, y);
        if (data[i + 3] === 255) for (let c = 0; c < 3; c++) ch[c].push(data[i + c]);
      }
    const flat = ch.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
    const dist = (i) => Math.hypot(data[i] - flat[0], data[i + 1] - flat[1], data[i + 2] - flat[2]);
    const isBody = (x, y) => {
      const i = at(x, y);
      return data[i + 3] === 255 && dist(i) < NEAR;
    };

    // 1) 창 테두리 띠 메우기 (확산: 이웃 중 아는 칸의 평균을 거듭 퍼뜨린다)
    const unknown = new Uint8Array(W * H);
    const inRect = (x, y, r, pad) => x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad;
    // 1-0) 창 안쪽이 바깥보다 한 단계 다른 색으로 칠해져 있어 네모가 비쳤다 → 띠 바로 안·밖 둘레의 색 차이만큼 안쪽을 옮긴다
    {
      const ringAvg = (pad) => {
        const s = [0, 0, 0];
        let n = 0;
        for (let y = win.y - pad; y < win.y + win.h + pad; y++)
          for (let x = win.x - pad; x < win.x + win.w + pad; x++) {
            if (inRect(x, y, win, pad - 2)) continue; // 두 칸 두께 둘레만
            const i = at(x, y);
            for (let c = 0; c < 3; c++) s[c] += data[i + c];
            n++;
          }
        return s.map((v) => v / n);
      };
      const outer = ringAvg(BAND + 3);
      const inner = ringAvg(-BAND - 1);
      const delta = outer.map((v, c) => v - inner[c]);
      for (let y = win.y + BAND; y < win.y + win.h - BAND; y++)
        for (let x = win.x + BAND; x < win.x + win.w - BAND; x++) {
          const i = at(x, y);
          for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] + delta[c])));
        }
      console.log(`  창 안쪽 색 차이 ${delta.map((v) => v.toFixed(1)).join(', ')}`);
    }
    let ring = 0;
    for (let y = win.y - BAND; y < win.y + win.h + BAND; y++)
      for (let x = win.x - BAND; x < win.x + win.w + BAND; x++)
        if (!inRect(x, y, win, -BAND)) {
          unknown[y * W + x] = 1;
          ring++;
        }
    for (let iter = 0; iter < 400; iter++) {
      let left = 0;
      for (let y = win.y - BAND; y < win.y + win.h + BAND; y++)
        for (let x = win.x - BAND; x < win.x + win.w + BAND; x++) {
          const p = y * W + x;
          if (!unknown[p]) continue;
          let n = 0;
          const s = [0, 0, 0];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const q = (y + dy) * W + x + dx;
            if (unknown[q]) continue;
            for (let c = 0; c < 3; c++) s[c] += data[q * 4 + c];
            n++;
          }
          if (!n) {
            left++;
            continue;
          }
          for (let c = 0; c < 3; c++) data[p * 4 + c] = Math.round(s[c] / n);
          data[p * 4 + 3] = 255;
          unknown[p] = 0;
        }
      if (!left) break;
    }

    // 2) 귀 자리에서 달걀 꼭대기(몸통 색이 8칸 넘게 이어지는 곳)보다 위는 지운다
    let cut = 0;
    const box = { x0: W, y0: H, x1: -1, y1: -1 };
    for (let x = ears ? ears.x0 : 0; x < (ears ? ears.x1 : 0); x++) {
      let top = -1;
      for (let y = 0; y < H - 8 && top < 0; y++) {
        let run = 0;
        while (run < 8 && isBody(x, y + run)) run++;
        if (run === 8) top = y;
      }
      if (top < 0) continue;
      for (let y = 0; y < top; y++) {
        const i = at(x, y);
        if (data[i + 3] > 0) {
          data[i + 3] = 0;
          cut++;
          box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x);
          box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y);
        }
      }
    }
    // 2-1) 귀를 떼면 귀 밑동 자리가 각진 어깨로 남는다 → 귀 자리 양옆의 달걀 윤곽으로 포물선을 맞춰 둥글게 다시 그린다
    let arcTop = null;
    if (ears) {
      const topOf = (x) => {
        for (let y = 0; y < H - 8; y++) {
          let run = 0;
          while (run < 8 && isBody(x, y + run)) run++;
          if (run === 8) return y;
        }
        return -1;
      };
      // 귀 자리 양옆 120칸의 윤곽으로 y = a·x² + b·x + c 를 맞춘다 (최소제곱)
      const pts = [];
      for (let x = ears.x0 - 120; x < ears.x0; x += 2) pts.push([x, topOf(x)]);
      for (let x = ears.x1; x < ears.x1 + 120; x += 2) pts.push([x, topOf(x)]);
      const S = Array(5).fill(0);
      const T = Array(3).fill(0);
      for (const [x0, y] of pts) {
        if (y < 0) continue;
        const x = (x0 - 500) / 500;
        for (let k = 0; k < 5; k++) S[k] += x ** k;
        for (let k = 0; k < 3; k++) T[k] += y * x ** k;
      }
      // 3×3 연립방정식 (크래머)
      const M = [
        [S[0], S[1], S[2]],
        [S[1], S[2], S[3]],
        [S[2], S[3], S[4]],
      ];
      const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const D = det(M);
      const coef = [0, 1, 2].map((k) => det(M.map((row, r) => row.map((v, c) => (c === k ? T[r] : v)))) / D);
      const fit = (x0) => {
        const x = (x0 - 500) / 500;
        return coef[0] + coef[1] * x + coef[2] * x * x;
      };
      // 양 끝에서 실제 윤곽과 딱 이어지게 어긋난 만큼을 곧게 나눠 더한다 (안 하면 끝에 작은 턱이 생긴다)
      const d0 = topOf(ears.x0 - 1) - fit(ears.x0 - 1);
      const d1 = topOf(ears.x1) - fit(ears.x1);
      const arc = (x) => fit(x) + d0 + ((d1 - d0) * (x - ears.x0)) / (ears.x1 - ears.x0);
      arcTop = Math.round(Math.min(...Array.from({ length: ears.x1 - ears.x0 }, (_, k) => arc(ears.x0 + k))));
      for (let x = ears.x0; x < ears.x1; x++) {
        const yArc = arc(x);
        const top = topOf(x);
        const ref = at(x, Math.max(top, Math.ceil(yArc)) + 14); // 바로 아래 몸통 색
        for (let y = 0; y < Math.max(top, Math.ceil(yArc)) + 1; y++) {
          const i = at(x, y);
          const cover = Math.min(1, Math.max(0, y + 1 - yArc)); // 윤곽선 칸은 걸친 만큼만
          if (cover <= 0) {
            data[i + 3] = 0;
            continue;
          }
          for (let c = 0; c < 3; c++) data[i + c] = data[ref + c];
          data[i + 3] = Math.round(255 * cover);
        }
      }
    }

    console.log(`${name.padEnd(7)}${arcTop !== null ? ` 귀 자리 꼭대기 y ${arcTop}` : ''} 몸통색 rgb(${flat}) · 창 테두리 ${ring}칸 메움 · 위로 삐진 칸 ${cut}${cut ? ` (x ${box.x0}~${box.x1}, y ${box.y0}~${box.y1})` : ''}`);

    if (write) {
      const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9, effort: 10 }).toBuffer();
      require('fs').writeFileSync(file, png);
    }
  }
})();
