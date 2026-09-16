// 앱의 템플릿 컴포넌트(.tsx)를 그대로 번들해서 샘플 기록을 배경 없는 PNG로 렌더링한다.
// 사용법 (design/tools 에서): npm install && npm run preview [-- 파일명필터]
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(__dirname, '../../../app');
const OUT = path.resolve(__dirname, '../../previews');
const only = process.argv[2];

(async () => {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'entry.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.join(__dirname, '.out.js'),
    jsx: 'automatic',
    alias: { 'react-native-svg': path.join(__dirname, 'svg-shim.js'), '@app': `${APP}/src` },
    nodePaths: [`${APP}/node_modules`],
    loader: { '.png': 'dataurl', '.jpg': 'dataurl' },
    logLevel: 'warning',
  });
  const { render } = require('./.out.js');
  const samples = require('./samples.js');
  fs.mkdirSync(OUT, { recursive: true });
  // 앱이 쓰는 expo-google-fonts 의 ttf 를 그대로 사용
  const fontRoot = path.join(APP, 'node_modules', '@expo-google-fonts');
  const fontFiles = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.ttf')) fontFiles.push(p);
    }
  };
  walk(fontRoot);
  for (const s of samples()) {
    if (only && !s.name.includes(only)) continue;
    const svg = render(s.record, s.side);
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: s.px || 900 },
      font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'NanumGothic' },
      imageRendering: 0,
    }).render().asPng();
    const file = path.join(OUT, `${s.name}.png`);
    await sharp(png).png({ compressionLevel: 9 }).toFile(file);
    console.log('rendered', file);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
