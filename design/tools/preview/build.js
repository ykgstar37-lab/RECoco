// 앱의 템플릿 컴포넌트(.tsx)를 그대로 번들해서 샘플 기록을 배경 없는 PNG로 렌더링한다.
// 사용법 (design/tools 에서): npm install && npm run preview [-- 파일명필터]
//   npm run svg [-- 파일명필터]  → design/templates-svg 에 편집용 SVG 저장
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(__dirname, '../../../app');
const OUT = path.resolve(__dirname, '../../previews');
const args = process.argv.slice(2);
const asSvg = args.includes('--svg');
const only = args.find((a) => !a.startsWith('--'));
const SVG_OUT = path.resolve(__dirname, '../../templates-svg');

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
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
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
    if (asSvg) {
      // 편집 프로그램에서 열리도록 네임스페이스를 붙여 그대로 저장 (글자는 <text>로 남는다)
      fs.mkdirSync(SVG_OUT, { recursive: true });
      const file = path.join(SVG_OUT, `${s.name}.svg`);
      const doc = svg
        .replace('<svg ', `<svg ${svg.includes('xmlns="') ? '' : 'xmlns="http://www.w3.org/2000/svg" '}xmlns:xlink="http://www.w3.org/1999/xlink" `)
        .replace(/<image([^>]*?) href=/g, '<image$1 xlink:href=');
      fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
${doc}
`);
      console.log('saved', file);
      continue;
    }
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
