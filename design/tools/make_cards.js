// 코코몬 카드 틀 만들기: 내려받은 PNG 에서 굳어 있는 글자(ATK/DEF, 날짜)를 지우고
// 앱에 넣을 크기로 줄여 app/assets/cards 에 저장한다.
//   사용법 (design/tools 에서): node make_cards.js [원본폴더]
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = process.argv[2] || 'C:/Users/ykgst/Downloads/RECocoCARD';
const OUT = path.resolve(__dirname, '../../app/assets/cards');
const RANKS = ['C', 'B', 'A', 'S', 'SS', 'R'];

// 원본 1086×1448 기준 자리
const BAR = { y: 962, h: 76, from: 124, fromW: 64, x: 196, w: 706 }; // 은색 바 속 글자
// 아래 "RECoco ★ 날짜" 는 카드마다 자리가 달라서 지우지 않는다 — 양식이 그 위에 작은 판을 덮고 날짜를 새로 쓴다
const WIDTH = 900; // 앱에 넣을 폭
// 사진 창 안에 겹쳐 있는 RECoco 로고 (사진을 덮어쓴 뒤 다시 얹으려고 따로 오려낸다)
const LOGO = { x: 360, y: 798, w: 368, h: 134 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const r of RANKS) {
    const file = path.join(SRC, `${r}.png`);
    if (!fs.existsSync(file)) {
      console.log('없음', file);
      continue;
    }
    const base = sharp(file);
    // 바: 글자 없는 깨끗한 은색 조각을 가로로 늘려 덮는다
    const barPatch = await sharp(file).extract({ left: BAR.from, top: BAR.y, width: BAR.fromW, height: BAR.h }).resize(BAR.w, BAR.h, { fit: 'fill' }).toBuffer();
    const cleaned = await base.composite([{ input: barPatch, left: BAR.x, top: BAR.y }]).toBuffer();

    // 여백을 자르면 카드마다 크기가 달라져 글자 자리가 틀어진다 → 원본 판을 그대로 두고 줄이기만 한다
    await sharp(cleaned).resize(WIDTH).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, `${r}.jpg`));

    // 로고만 오려서 회색 바탕을 투명하게 (사진 위에 다시 얹을 조각)
    const { data, info } = await sharp(cleaned).extract({ left: LOGO.x, top: LOGO.y, width: LOGO.w, height: LOGO.h }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const [cr, cg, cb] = [data[i], data[i + 1], data[i + 2]];
      const grey = Math.max(cr, cg, cb) - Math.min(cr, cg, cb) < 14 && cr > 205;
      if (grey) data[i + 3] = 0;
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize(Math.round((LOGO.w * WIDTH) / 1086))
      .png()
      .toFile(path.join(OUT, `logo-${r}.png`));
    console.log('만듦', path.join(OUT, `${r}.jpg`));
  }
})();
