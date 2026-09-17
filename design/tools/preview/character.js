// 마스코트 "코코" 표정별 PNG 생성
// 사용법 (design/tools 에서): npm run character
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(__dirname, '../../../app');
const OUT = path.resolve(__dirname, '../../previews');
const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

(async () => {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'character-entry.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.join(__dirname, '.character.js'),
    jsx: 'automatic',
    alias: {
      'react-native-svg': path.join(__dirname, 'svg-shim.js'),
      'react-native': path.join(__dirname, 'rn-stub.js'),
      'react-native-reanimated': path.join(__dirname, 'rn-stub.js'),
      'expo-haptics': path.join(__dirname, 'rn-stub.js'),
      '@app': `${APP}/src`,
    },
    nodePaths: [`${APP}/node_modules`],
    logLevel: 'warning',
  });
  const { renderCoco } = require('./.character.js');
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT).filter((f) => f.startsWith('캐릭터_코코'))) fs.unlinkSync(path.join(OUT, f));
  for (const tone of ['orange', 'white']) {
    for (const mood of ['idle', 'happy', 'squish', 'wow', 'print']) {
      const file = path.join(OUT, `캐릭터_코코_${tone}_${mood}.png`);
      const img = png(renderCoco(mood, tone), 800);
      // 흰 코코는 주황 배경 위에서 보여준다
      const out = tone === 'white'
        ? sharp({ create: { width: 800, height: 640, channels: 4, background: '#ff7a2f' } }).composite([{ input: img }])
        : sharp(img);
      await out.png().toFile(file);
      console.log('rendered', file);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
