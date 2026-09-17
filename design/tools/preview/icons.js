// 앱 아이콘 생성: design/logo/app-icon-3-movie.svg (영화표 모양 티켓) → app/assets
// 사용법 (design/tools 에서): npm run icons
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(__dirname, '../../../app');
const ORANGE = '#ff7a2f';
const src = fs.readFileSync(path.resolve(__dirname, '../../logo/app-icon-3-movie.svg'), 'utf8');
// 티켓 모양과 절취선만 뽑아서 배경·색·크기를 바꿔 쓴다
const ticket = src.match(/<path d="([^"]+)"/)[1];
const perforation = src.match(/<line [^>]+\/>/)[0];

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
/** 1024 캔버스 가운데를 기준으로 scale 만큼 줄인 티켓 */
const art = ({ bg, paper, dash, scale = 1, cutDash = false }) => {
  const t = `translate(512 512) scale(${scale}) translate(-512 -512)`;
  const line = perforation.replace(/stroke="[^"]+"/, `stroke="${cutDash ? '#000' : dash}"`);
  const body = cutDash
    ? `<mask id="m"><rect width="1024" height="1024" fill="#fff"/><g transform="${t}">${line}</g></mask><g transform="${t}"><path d="${ticket}" fill="${paper}" mask="url(#m)"/></g>`
    : `<g transform="${t}"><path d="${ticket}" fill="${paper}"/>${line}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${body}</svg>`;
};

(async () => {
  const out = (f) => path.join(APP, 'assets', f);
  // iOS: 모서리는 OS가 깎으므로 꽉 찬 주황 사각형 + 흰 티켓
  await sharp(png(art({ bg: ORANGE, paper: '#fff', dash: ORANGE }), 1024)).png().toFile(out('icon.png'));
  // 안드로이드 적응형: 가운데 안전영역에 들어오게 줄임
  await sharp(png(art({ paper: '#fff', dash: ORANGE, scale: 0.78 }), 1024)).png().toFile(out('android-icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: ORANGE } }).png().toFile(out('android-icon-background.png'));
  // 단색 아이콘: 흰 실루엣에서 절취선을 뚫는다
  await sharp(png(art({ paper: '#fff', scale: 0.78, cutDash: true }), 432)).png().toFile(out('android-icon-monochrome.png'));
  // 스플래시(흰 배경): 주황 티켓 + 흰 절취선
  await sharp(png(art({ paper: ORANGE, dash: '#fff', scale: 0.8 }), 600)).png().toFile(out('splash-icon.png'));
  await sharp(png(art({ bg: ORANGE, paper: '#fff', dash: ORANGE, scale: 1.1 }), 48)).png().toFile(out('favicon.png'));
  console.log('app icons updated');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
