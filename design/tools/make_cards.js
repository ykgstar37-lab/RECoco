// 코코몬 카드 틀 만들기: 내려받은 PNG 에서 굳어 있는 글자(ATK/DEF, 날짜)를 지우고
// 앱에 넣을 크기로 줄여 app/assets/cards 에 저장한다.
//   사용법 (design/tools 에서): node make_cards.js [원본폴더] → 이어서 node make_card_windows.js (사진 창 덮개)
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = process.argv[2] || 'C:/Users/ykgst/Downloads/RECocoCARD';
const OUT = path.resolve(__dirname, '../../app/assets/cards');
const RANKS = ['C', 'B', 'A', 'S', 'SS', 'R'];

// 은색 바의 한가운데 높이 (카드마다 조금씩 다르다)
const BAR_MID = { C: 1010, B: 1014, A: 995, S: 980, SS: 1017, R: 1014 };

// 원본 1086×1448 기준 자리
const BAR = { h: 54, from: 152, fromW: 52, x: 205, w: 700 }; // 은색 바 속 글자를 덮을 자리
// 아래 "RECoco ★ 날짜" 는 카드마다 자리가 달라서 지우지 않는다 — 양식이 그 위에 작은 판을 덮고 날짜를 새로 쓴다
const WIDTH = 900; // 앱에 넣을 폭
// 설명 칸 안에 인쇄된 점선 (있는 카드만). 칸 안쪽 깨끗한 줄을 늘려 덮는다
const DOTS = { C: { x: 160, w: 778, y: 1146, h: 92, src: 1128 } };

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
    const barY = Math.round(BAR_MID[r] - BAR.h / 2);
    const barPatch = await sharp(file).extract({ left: BAR.from, top: barY, width: BAR.fromW, height: BAR.h }).resize(BAR.w, BAR.h, { fit: 'fill' }).toBuffer();
    const layers = [{ input: barPatch, left: BAR.x, top: barY }];
    const dots = DOTS[r];
    if (dots) {
      const patch = await sharp(file).extract({ left: dots.x, top: dots.src, width: dots.w, height: 1 }).resize(dots.w, dots.h, { fit: 'fill' }).toBuffer();
      layers.push({ input: patch, left: dots.x, top: dots.y });
    }
    const cleaned = await base.composite(layers).toBuffer();

    // 여백을 자르면 카드마다 크기가 달라져 글자 자리가 틀어진다 → 원본 판을 그대로 두고 줄이기만 한다
    await sharp(cleaned).resize(WIDTH).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, `${r}.jpg`));

    console.log('만듦', path.join(OUT, `${r}.jpg`));
  }
})();
