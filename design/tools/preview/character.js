// 마스코트 "코코" 표정별 PNG + 앱 아이콘 생성
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
    alias: { 'react-native-svg': path.join(__dirname, 'svg-shim.js'), '@app': `${APP}/src` },
    nodePaths: [`${APP}/node_modules`],
    logLevel: 'warning',
  });
  const { renderCoco } = require('./.character.js');
  fs.mkdirSync(OUT, { recursive: true });
  for (const mood of ['idle', 'happy', 'print', 'wow']) {
    const file = path.join(OUT, `캐릭터_코코_${mood}.png`);
    await sharp(png(renderCoco(mood), 800)).toFile(file);
    console.log('rendered', file);
  }
  if (process.argv[2] === '--icons') {
    const coco = png(renderCoco('idle'), 760);
    const bg = '#fff4ec';
    // iOS 아이콘: 투명 불가 → 연한 주황 배경
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: bg } })
      .composite([{ input: coco, gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'icon.png'));
    // 안드로이드 적응형 아이콘: 가운데 66% 안전영역에 맞춰 작게
    const small = png(renderCoco('idle'), 600);
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: small, gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'android-icon-foreground.png'));
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: bg } }).png().toFile(path.join(APP, 'assets', 'android-icon-background.png'));
    await sharp(small).toFile(path.join(APP, 'assets', 'splash-icon.png'));
    await sharp({ create: { width: 48, height: 48, channels: 4, background: bg } })
      .composite([{ input: png(renderCoco('idle'), 44), gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'favicon.png'));
    console.log('app icons updated');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
