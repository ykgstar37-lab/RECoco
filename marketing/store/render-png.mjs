// SVG 스토어 스크린샷을 규격 픽셀 PNG 로 굽는다. 스토어는 SVG 를 안 받는다.
//
// SubFlow 는 `<img src="x.svg">` 로 렌더했는데, 그 방식은 SVG 가 '보안 정적 모드'로 들어가
// **바깥 파일을 못 읽는다** — 끼워 넣은 캡처(`<image href>`)와 @font-face 가 통째로 무시된다.
// 그래서 여기서는 SVG 를 HTML 에 **그대로 붙여** 넣는다. 그러면 캡처도 폰트도 살아난다.
// Chrome 을 쓰는 이유는 SubFlow 때와 같다: feDropShadow 를 살리려고 (cairosvg 계열은 필터를 버린다).
//
// 실행: node marketing/store/render-png.mjs [6.9|6.7|6.5]
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'ios');
const FONTS = path.resolve(HERE, '../../app/assets/fonts');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));

/**
 * ⚠️ 6.5·6.7 은 App Store Connect 가 딱 이 픽셀만 받는다.
 * SubFlow 때 1290×2796(아이폰 실해상도)으로 올렸다가 거부당했다 — 6.9 슬롯에만 쓸 것.
 */
const SIZES = { '6.9': [1290, 2796], '6.7': [1284, 2778], '6.5': [1242, 2688] };

const fontFace = (file, weight) =>
  `@font-face{font-family:Pretendard;src:url("file:///${path.join(FONTS, file).replace(/\\/g, '/')}") format("opentype");font-weight:${weight};font-style:normal}`;

async function main() {
  if (!CHROME) throw new Error('Chrome 을 못 찾았다 — render-png.mjs 의 CHROME 경로를 고칠 것');
  const preset = process.argv[2] ?? '6.9';
  const size = SIZES[preset];
  if (!size) throw new Error(`규격은 ${Object.keys(SIZES).join(' / ')} 중 하나여야 한다`);
  const [w, h] = size;

  const out = path.join(SRC, `png-${preset}`);
  fs.mkdirSync(out, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg')).sort();
  if (!files.length) throw new Error('SVG 가 없다 — 먼저 `node marketing/store/make-svg.mjs`');

  const style = [fontFace('Pretendard-Regular.otf', 400), fontFace('Pretendard-SemiBold.otf', 600), fontFace('Pretendard-Bold.otf', 800)].join('');

  for (const f of files) {
    // 페이지를 SVG 와 같은 폴더에 두어야 screens/*.png 상대경로가 풀린다
    const page = path.join(SRC, `.render-${f}.html`);
    const body = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);
    fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>${style}html,body{margin:0;padding:0;overflow:hidden}svg{display:block}</style>${body}`, 'utf8');
    const shot = path.join(os.tmpdir(), `recoco-${f}.png`);
    try {
      await run(CHROME, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=ffffffff',
        `--window-size=${w},${h}`,
        `--screenshot=${shot}`,
        '--virtual-time-budget=4000',
        `file:///${page.replace(/\\/g, '/')}`,
      ]);
      const dst = path.join(out, f.replace(/\.svg$/, '.png'));
      fs.copyFileSync(shot, dst);
      fs.rmSync(shot, { force: true });
      console.log(`  ${path.basename(dst).padEnd(20)} ${(fs.statSync(dst).size / 1024).toFixed(1)} KB`);
    } finally {
      fs.rmSync(page, { force: true });
    }
  }
  console.log(`\n${files.length}장 · ${w}×${h} → ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
