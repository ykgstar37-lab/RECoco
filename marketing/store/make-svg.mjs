// 스토어 스크린샷 SVG 를 찍어낸다. SubFlow 의 틀(marketing/store/ios-6.9)을 레코코 주황으로 옮긴 것.
//
// SubFlow 는 앱 화면까지 SVG 로 손수 그렸는데(한 장에 100~170KB), 레코코는 **실제 캡처를 끼우는
// 슬롯**으로 뒀다. 폰에서 찍은 PNG 를 `screens/01-home.png` 처럼 넣으면 그대로 들어간다.
// 아직 없으면 자리표시가 대신 보인다.
//
// 실행: node marketing/store/make-svg.mjs   → marketing/store/ios/*.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'ios');

// 레코코 색 (app/src/theme.ts)
const C = {
  orange: '#ff7a2f',
  orangeSoft: '#fff1e7',
  ink: '#1f1f22',
  sub: '#8b8b91',
  paper: '#fffaf4', // 배경 아래쪽 미색 (영수증 종이 느낌)
};

const W = 1290;
const H = 2796;
const FONT = 'Pretendard, Pretendard Variable, Apple SD Gothic Neo, Malgun Gothic, sans-serif';

/** 기기 바깥 테두리 · 유리 안쪽 · 화면 — SubFlow 틀에서 그대로 가져온 좌표 */
const BODY =
  'M 861.2 760 c 85.69 0 128.53 0 161.26 16.68 a 153 153 0 0 1 66.86 66.86 c 16.68 32.73 16.68 75.57 16.68 161.26 L 1106 2479.2 c 0 85.69 0 128.53 -16.68 161.26 a 153 153 0 0 1 -66.86 66.86 c -32.73 16.68 -75.57 16.68 -161.26 16.68 L 427.8 2724 c -85.69 0 -128.53 0 -161.26 -16.68 a 153 153 0 0 1 -66.86 -66.86 c -16.68 -32.73 -16.68 -75.57 -16.68 -161.26 L 183 1004.8 c 0 -85.69 0 -128.53 16.68 -161.26 a 153 153 0 0 1 66.86 -66.86 c 32.73 -16.68 75.57 -16.68 161.26 -16.68 Z';
const RIM =
  'M 862.1 761.5 c 84.85 0 127.27 0 159.68 16.51 a 151.5 151.5 0 0 1 66.21 66.21 c 16.51 32.41 16.51 74.83 16.51 159.68 L 1104.5 2480.1 c 0 84.85 0 127.27 -16.51 159.68 a 151.5 151.5 0 0 1 -66.21 66.21 c -32.41 16.51 -74.83 16.51 -159.68 16.51 L 426.9 2722.5 c -84.85 0 -127.27 0 -159.68 -16.51 a 151.5 151.5 0 0 1 -66.21 -66.21 c -16.51 -32.41 -16.51 -74.83 -16.51 -159.68 L 184.5 1003.9 c 0 -84.85 0 -127.27 16.51 -159.68 a 151.5 151.5 0 0 1 66.21 -66.21 c 32.41 -16.51 74.83 -16.51 159.68 -16.51 Z';
const SCREEN =
  'M 870.2 775 c 77.29 0 115.93 0 145.45 15.04 a 138 138 0 0 1 60.31 60.31 c 15.04 29.52 15.04 68.16 15.04 145.45 L 1091 2488.2 c 0 77.29 0 115.93 -15.04 145.45 a 138 138 0 0 1 -60.31 60.31 c -29.52 15.04 -68.16 15.04 -145.45 15.04 L 418.8 2709 c -77.29 0 -115.93 0 -145.45 -15.04 a 138 138 0 0 1 -60.31 -60.31 c -15.04 -29.52 -15.04 -68.16 -15.04 -145.45 L 198 995.8 c 0 -77.29 0 -115.93 15.04 -145.45 a 138 138 0 0 1 60.31 -60.31 c 29.52 -15.04 68.16 -15.04 145.45 -15.04 Z';

// 화면 네모 (캡처를 끼울 자리)
const SX = 198;
const SY = 775;
const SW = 1091 - 198;
const SH = 2709 - 775;

/**
 * 스크린샷 10장. 앱 설치 시트에는 **앞 3장만** 보이므로 제일 좋은 걸 앞에 둔다.
 * cap: 위에 작게 박히는 말 · a/b: 큰 제목 두 줄 (b 가 주황) · s1/s2: 설명 두 줄
 */
const SHOTS = [
  {
    file: '01-home',
    cap: 'HOME',
    a: '오늘 하루도',
    b: '영수증으로',
    s1: '읽은 책, 본 영화, 오늘 쓴 돈.',
    s2: '적으면 한 장으로 뽑혀 나와요.',
  },
  {
    file: '02-receipts',
    cap: 'RECEIPTS',
    a: '열한 가지 기록,',
    b: '저마다 다른 종이',
    s1: '독서·영화·소비·여행·네컷부터',
    s2: '공연·콘서트·운동·음악까지.',
  },
  {
    file: '03-roll',
    cap: 'ROLL',
    a: '모으면',
    b: '길게 이어져요',
    s1: '지나온 날들이 한 줄 두루마리로.',
    s2: '넘겨보며 그때를 되짚어요.',
  },
  {
    file: '04-write',
    cap: 'WRITE',
    a: '제목만 치면',
    b: '나머지는 저절로',
    s1: '표지·저자·러닝타임·관람등급까지.',
    s2: '바코드와 예매 문자로도 채워져요.',
  },
  {
    file: '05-themes',
    cap: 'THEMES',
    a: '같은 기록도',
    b: '종이를 바꾸면',
    s1: '모눈종이, 작은 가게 집 모양,',
    s2: '레트로 티켓, 공연장 팔찌, 별빛 티켓.',
  },
  {
    file: '06-card',
    cap: 'COCOMON CARD',
    a: '네컷 사진이',
    b: '수집 카드로',
    s1: '등급은 고르는 게 아니라 뽑히는 것.',
    s2: 'C부터 아주 드문 R까지 있어요.',
  },
  {
    file: '07-calendar',
    cap: 'CALENDAR',
    a: '달력에',
    b: '도장이 쌓여요',
    s1: '며칠이나 남겼는지 한눈에.',
    s2: '빈 날이 채워지는 재미가 있어요.',
  },
  {
    file: '08-coco',
    cap: 'COCO',
    a: '모을수록',
    b: '코코가 꾸며져요',
    s1: '모자 열두 개를 하나씩 받아요.',
    s2: '영수증 100장이면 왕관까지.',
  },
  {
    file: '09-private',
    cap: 'PRIVATE',
    a: '서버도',
    b: '로그인도 없어요',
    s1: '기록과 사진은 폰 안에만 있어요.',
    s2: '만든 사람도 볼 수 없습니다.',
  },
  {
    file: '10-share',
    cap: 'SHARE',
    a: '예쁘게 뽑아서',
    b: '나눠 보세요',
    s1: '이미지로 저장하거나 공유하고,',
    s2: '백업 파일 하나로 통째로 옮겨요.',
  },
];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(shot) {
  const screenPng = `screens/${shot.file}.png`;
  const hasShot = fs.existsSync(path.join(OUT, screenPng));
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${C.paper}"/>
    </linearGradient>
    <!-- 오른쪽 위에서 번지는 주황 빛 -->
    <radialGradient id="glow" cx="0.84" cy="0.10" r="0.66">
      <stop offset="0" stop-color="${C.orange}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>
    <!-- 아래쪽에 깔리는 옅은 살구빛 -->
    <radialGradient id="glow2" cx="0.12" cy="0.94" r="0.55">
      <stop offset="0" stop-color="${C.orange}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${C.orange}" stop-opacity="0"/>
    </radialGradient>
    <!-- 기기 테두리: 가로 방향이라 양쪽 끝(옆면)이 밝게 깎여 보인다 -->
    <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f3eee9"/>
      <stop offset="0.04" stop-color="#b3aaa2"/>
      <stop offset="0.16" stop-color="#635a53"/>
      <stop offset="0.5" stop-color="#3a342f"/>
      <stop offset="0.84" stop-color="#635a53"/>
      <stop offset="0.96" stop-color="#b3aaa2"/>
      <stop offset="1" stop-color="#f3eee9"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.70"/>
      <stop offset="0.24" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.58" stop-color="#ffffff" stop-opacity="0.46"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#26211d"/>
      <stop offset="0.35" stop-color="#978d84"/>
      <stop offset="0.6" stop-color="#544c45"/>
      <stop offset="1" stop-color="#26211d"/>
    </linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="0.75" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.16" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="0.34" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="lens" cx="0.34" cy="0.28" r="0.8">
      <stop offset="0" stop-color="#5a4638"/>
      <stop offset="0.55" stop-color="#14100d"/>
      <stop offset="1" stop-color="#070605"/>
    </radialGradient>
    <filter id="drop" x="-30%" y="-15%" width="160%" height="140%">
      <feDropShadow dx="0" dy="34" stdDeviation="34" flood-color="#6b3410" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#6b3410" flood-opacity="0.16"/>
    </filter>
    <clipPath id="screenClip"><path d="${SCREEN}"/></clipPath>
  </defs>

  <g id="Background">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  </g>

  <g id="Caption" font-family="${FONT}">
    <text x="117" y="198" font-size="36" font-weight="700" letter-spacing="9.1" fill="${C.orange}">${esc(shot.cap)}</text>
    <text x="117" y="333" font-size="96" font-weight="800" letter-spacing="-3.9" fill="${C.ink}">${esc(shot.a)}</text>
    <text x="117" y="450" font-size="96" font-weight="800" letter-spacing="-3.9" fill="${C.orange}">${esc(shot.b)}</text>
    <text x="117" y="551" font-size="40" font-weight="500" fill="${C.sub}">${esc(shot.s1)}</text>
    <text x="117" y="611" font-size="40" font-weight="500" fill="${C.sub}">${esc(shot.s2)}</text>
  </g>

  <g id="Device">
    <g id="Side buttons">
      <rect x="177" y="1099" width="13" height="73" rx="5.06" fill="url(#btn)"/>
      <rect x="177" y="1224" width="13" height="140" rx="5.06" fill="url(#btn)"/>
      <rect x="177" y="1403" width="13" height="140" rx="5.06" fill="url(#btn)"/>
      <rect x="1099" y="1244" width="13" height="242" rx="5.06" fill="url(#btn)"/>
    </g>
    <path id="Body" d="${BODY}" fill="url(#rail)" filter="url(#drop)"/>
    <path id="Rim" d="${RIM}" fill="none" stroke="url(#rim)" stroke-width="2"/>
    <g clip-path="url(#screenClip)">
      ${
        hasShot
          ? `<image href="${screenPng}" xlink:href="${screenPng}" x="${SX}" y="${SY}" width="${SW}" height="${SH}" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" fill="${C.orangeSoft}"/>
      <text x="${SX + SW / 2}" y="${SY + SH / 2}" font-family="${FONT}" font-size="46" font-weight="700" fill="${C.orange}" text-anchor="middle">${screenPng}</text>
      <text x="${SX + SW / 2}" y="${SY + SH / 2 + 70}" font-family="${FONT}" font-size="34" fill="${C.sub}" text-anchor="middle">여기에 폰 캡처를 넣으세요</text>`
      }
      <!-- 유리 안쪽 그림자 (테두리 쪽만 살짝 어둡게) -->
      <path d="${SCREEN}" fill="none" stroke="#000000" stroke-opacity="0.18" stroke-width="8"/>
    </g>
    <g id="Dynamic island">
      <rect x="502" y="802" width="286" height="72" rx="36" fill="#0a0806"/>
      <circle cx="748.4" cy="838" r="18.72" fill="url(#lens)"/>
      <circle cx="742.78" cy="832.38" r="5.24" fill="${C.orange}" fill-opacity="0.45"/>
    </g>
    <path id="Glare" d="${SCREEN}" fill="url(#glare)" pointer-events="none"/>
  </g>
</svg>
`;
}

fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
let missing = 0;
for (const shot of SHOTS) {
  fs.writeFileSync(path.join(OUT, `${shot.file}.svg`), svg(shot), 'utf8');
  if (!fs.existsSync(path.join(OUT, 'screens', `${shot.file}.png`))) missing += 1;
}
console.log(`SVG ${SHOTS.length}장 만듦 → ${path.relative(process.cwd(), OUT)}`);
if (missing) console.log(`아직 캡처가 없는 자리 ${missing}개 — ios/screens/ 에 넣고 다시 돌리면 끼워진다`);
