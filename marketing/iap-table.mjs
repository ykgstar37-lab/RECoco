import fs from 'node:fs';

// shop.ts 는 AsyncStorage·expo-iap 을 물고 있어 node 로 못 불러온다 → 소스에서 상품만 뽑는다
const src = fs.readFileSync('C:/dev/RECoco/app/src/lib/shop.ts', 'utf8');

const rows = [];
const push = (id, name, price, group, desc) => rows.push({ id, name, price: Number(price), group, desc });

// 공용 티켓 상수 (PHOTO_TICKET 등)
const consts = {};
for (const m of src.matchAll(/^const (\w+) = \{ name: '([^']+)', desc: '([^']*)', productId: '([^']+)', price: (\d+)/gm)) {
  consts[m[1]] = { name: m[2], desc: m[3], productId: m[4], price: m[5] };
}

// PAID_CATEGORIES
for (const m of src.matchAll(/^  (\w+): \{ name: '([^']+)', desc: '([^']*)', icon: '[^']*', productId: '([^']+)', price: (\d+)/gm)) {
  push(m[4], m[2], m[5], '카테고리', m[3]);
}

// 그냥 적힌 테마들
const seen = new Set();
for (const m of src.matchAll(/\{ id: '[\w-]+', name: '([^']+)', desc: '([^']*)', productId: '([^']+)', price: (\d+)/g)) {
  if (seen.has(m[3])) continue;
  seen.add(m[3]);
  push(m[3], m[1], m[4], '테마', m[2]);
}

// 공용 티켓 (…RETRO_TICKET 처럼 펼쳐 쓴 것)
for (const m of src.matchAll(/\{ id: '[\w-]+', \.\.\.(\w+) \}/g)) {
  const c = consts[m[1]];
  if (!c || seen.has(c.productId)) continue;
  seen.add(c.productId);
  push(c.productId, c.name, c.price, '테마', c.desc);
}

// 코코 옷
for (const m of src.matchAll(/\{ id: '\w+', name: '([^']+)', unlock: \{ type: 'paid', productId: '([^']+)', price: (\d+)/g)) {
  push(m[2], m[1], m[3], '코코 옷', `코코가 쓰는 ${m[1]}`);
}

const ids = rows.map((r) => r.id);
console.log(`| # | 상품 ID | 이름 | 가격 | 갈래 |`);
console.log(`|---|---|---|---|---|`);
rows.forEach((r, i) => console.log(`| ${i + 1} | \`${r.id}\` | ${r.name} | ${r.price.toLocaleString()}원 | ${r.group} |`));
console.log(`\n총 ${rows.length}개 · 중복 ID ${new Set(ids).size === ids.length ? '없음' : '있음!'}`);
console.log('\n=== 설명 칸 ===');
rows.forEach((r) => console.log(`${r.id}\n  ${r.desc}`));
