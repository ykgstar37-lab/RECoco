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
  if (process.argv[2] === '--icons') {
    const ORANGE = '#ff7a2f';
    // iOS 아이콘: 주황 배경 + 흰 코코 (메인 화면과 같은 조합)
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: ORANGE } })
      .composite([{ input: png(renderCoco('idle', 'white'), 740), gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'icon.png'));
    // 안드로이드 적응형 아이콘: 가운데 66% 안전영역에 맞춰 작게
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: png(renderCoco('idle', 'white'), 580), gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'android-icon-foreground.png'));
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: ORANGE } }).png().toFile(path.join(APP, 'assets', 'android-icon-background.png'));
    // 스플래시는 흰 배경 → 주황 코코
    await sharp(png(renderCoco('idle', 'orange'), 600)).toFile(path.join(APP, 'assets', 'splash-icon.png'));
    await sharp({ create: { width: 48, height: 48, channels: 4, background: ORANGE } })
      .composite([{ input: png(renderCoco('idle', 'white'), 40), gravity: 'center' }])
      .png()
      .toFile(path.join(APP, 'assets', 'favicon.png'));
    console.log('app icons updated');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
