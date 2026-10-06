// 피그마에서 고칠 수 있는 SVG 를 스토어 규격마다 뽑는다.
// 실행: node marketing/store/make-svg.mjs && node marketing/store/export-figma.mjs
//
// - 판 크기가 스토어 픽셀과 딱 같다 (피그마 프레임 그대로 PNG 로 내보내면 된다)
//     figma/6.5/  1284×2778  App Store 6.5" (꼭 필요)
//     figma/6.9/  1320×2868  App Store 6.9" (선택)
//     figma/play/ 1080×2160  Google Play (2:1 넘으면 거부)
// - 폰 캡처(screens/*.png)는 파일 안에 base64 로 넣는다. 피그마는 SVG 옆 폴더의 그림을 못 읽는다
// - 글자는 글자로 남는다 (Pretendard). 피그마에서 글꼴이 바뀌어 보이면 PC 에 Pretendard 를 깔 것
//   (app/assets/fonts/*.otf 를 두 번 눌러 설치 → 피그마 데스크톱 다시 켜기)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'ios');
const OUT = path.join(HERE, 'figma');
const ART = [1290, 2796]; // make-svg 가 그리는 크기
const SIZES = { '6.5': [1284, 2778], '6.9': [1320, 2868], play: [1080, 2160] };

const files = fs.readdirSync(SRC).filter((f) => /^\d\d-.*\.svg$/.test(f)).sort();
if (!files.length) throw new Error('SVG 가 없다 — 먼저 `node marketing/store/make-svg.mjs`');

for (const [name, [w, h]] of Object.entries(SIZES)) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  // 그림 비율과 다른 만큼 가운데 기준으로 좌우를 넓히거나 줄인다 (배경은 양옆으로 넉넉히 깔려 있다)
  const vbW = (ART[1] * w) / h;
  const viewBox = `${((ART[0] - vbW) / 2).toFixed(2)} 0 ${vbW.toFixed(2)} ${ART[1]}`;
  for (const f of files) {
    let svg = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/width="\d+" height="\d+" viewBox="[^"]*"/, `width="${w}" height="${h}" viewBox="${viewBox}"`);
    svg = svg.replace(/(xlink:href|href)="(screens\/[^"]+\.png)"/g, (m, attr, rel) => {
      const p = path.join(SRC, rel);
      return fs.existsSync(p) ? `${attr}="data:image/png;base64,${fs.readFileSync(p).toString('base64')}"` : m;
    });
    fs.writeFileSync(path.join(dir, f), svg, 'utf8');
  }
  console.log(`${name.padEnd(4)} ${w}×${h} · ${files.length}장 → ${path.relative(process.cwd(), dir)}`);
}
