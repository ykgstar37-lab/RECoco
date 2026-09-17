const fs = require('fs');
const path = require('path');
const url = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, 'photos', f)).toString('base64')}`;
const photo = (i) => ({ uri: url(`p${i}.jpg`), width: 800, height: 600 });

module.exports = () => {
  const reading = {
    id: 'sample-reading', createdAt: '2026-09-09T14:32:18', kind: 'reading', date: '2026-09-09',
    title: '오디세이아(고대 그리스어 완역본)', author: '호메로스', publisher: '현대지성', genre: '인문 / 고전 / 그리스 문학',
    status: '완독', place: '교보문고 광화문점', memo: '',
  };
  const readingLong = {
    ...reading, id: 'sample-reading-long', title: '아주 긴 제목을 가진 책이 들어오면 줄이 바뀌고 영수증이 길어집니다',
    memo: '돌아갈 곳이 있다는 건 긴 여정을 버티게 한다. 이타카는 결국 장소가 아니라 나를 기다리는 사람들이었다.', genre: '소설', place: '',
  };
  const movie = {
    id: 'sample-movie', createdAt: '2026-09-12T18:45:00', kind: 'movie', date: '2026-09-12', time: '19:30',
    title: '오디세이', originalTitle: 'Odyssey', theater: 'CGV 강남점', screen: '4관', seat: 'H11', people: 1,
    format: '2D', ageRating: '12세이상관람가', stars: 5, runtime: '156',
  };
  const spending = {
    id: 'sample-spending', createdAt: '2026-09-16T15:20:00', kind: 'spending', date: '2026-09-16', store: '달밤커피',
    category: '카페', address: '서울 마포구 연남동',
    items: [{ name: '아이스 아메리카노', qty: 2, price: 4500 }, { name: '바스크 치즈케이크', qty: 1, price: 6500 }, { name: '드립백 원두', qty: 3, price: 1000 }],
    memo: '☕',
  };
  const travel = {
    id: 'sample-travel', createdAt: '2026-09-01T09:00:00', kind: 'travel', date: '2026-09-01', from: 'ICN', to: 'HND',
    name: 'KIM COCO', flight: 'NP 2203', seat: '01', gate: '05', photos: [photo(1), photo(2), photo(3), photo(4)],
  };
  const tr = (n) => ({ ...travel, id: `sample-travel-${n}`, photos: [photo(1), photo(2), photo(3), photo(4)].slice(0, n) });
  const fourBase = {
    createdAt: '2026-09-17T20:10:00', kind: 'fourcut', date: '2026-09-17', title: '여름의 마지막 네컷', place: '연남동',
    withWhom: '지민', diary: '퇴근하고 만나서 떡볶이 먹고 사진 찍었다. 포즈 고민하다가 결국 다 웃긴 표정. 여름이 끝나가는 게 아쉬운 밤이었다.',
    frame: 'white', sourceUrl: '', source: 'photos', frameImage: null, photos: [photo(1), photo(2), photo(3), photo(4)],
  };
  const fc = (layout, frame, extra = {}) => ({ ...fourBase, id: `sample-fourcut-${layout}-${frame}`, layout, frame, ...extra });
  const fourQr = { ...fourBase, id: 'sample-fourcut-qr', source: 'qr', layout: 'strip', frameImage: { uri: url('booth-strip.jpg'), width: 600, height: 1800 }, photos: [] };
  const gift = {
    id: 'sample-gift', createdAt: '2026-09-14T12:00:00', kind: 'gift', date: '2026-09-14', direction: 'received', person: '지민',
    item: '달밤커피 아이스 아메리카노 2잔', brand: '달밤커피', price: 9000, message: '시험 끝난 거 축하해! 커피 마시면서 푹 쉬어 ☺', photo: null, card: 'yellow',
  };
  return [
    { name: '선물_받은_노랑', record: gift },
    { name: '선물_보낸_사진_민트', record: { ...gift, id: 'sample-gift-2', direction: 'given', person: '엄마', item: '꽃다발', brand: '', price: 0, message: '생일 축하해요 엄마, 늘 고마워요.', photo: photo(2), card: 'mint' } },
    { name: '독서_영수증', record: reading },
    { name: '독서_영수증_표지', record: { ...reading, id: 'sample-reading-cover', cover: { uri: url('p2.jpg'), width: 800, height: 600 } } },
    { name: '독서_영수증_긴글', record: readingLong },
    { name: '영화_티켓', record: movie },
    { name: '영화_티켓_흰색', record: { ...movie, id: 'sample-movie-white', paper: 'white' } },
    { name: '소비_영수증', record: spending },
    { name: '소비_영수증_테마_흰무지', record: { ...spending, id: 'sample-spending-plain', theme: 'plain' } },
    { name: '소비_영수증_테마_모눈', record: { ...spending, id: 'sample-spending-grid', theme: 'grid' } },
    { name: '여행_사진0장', record: tr(0), px: 1100 },
    { name: '여행_사진1장', record: tr(1), px: 1100 },
    { name: '여행_사진2장', record: tr(2), px: 1100 },
    { name: '여행_사진3장', record: tr(3), px: 1100 },
    { name: '여행_사진4장', record: tr(4), px: 1100 },
    { name: '인생네컷_1x4스트립_화이트', record: fc('strip', 'white'), px: 500 },
    { name: '인생네컷_2x2_물결', record: fc('grid', 'sky'), px: 700 },
    { name: '인생네컷_2x2_핑크', record: fc('grid', 'pink', { photos: [photo(4), photo(3), null, photo(1)] }), px: 700 },
    { name: '인생네컷_가로2x2_블랙', record: fc('wide', 'black', { photos: [photo(1), null, photo(3), photo(4)] }), px: 1000 },
    { name: '인생네컷_QR완성본', record: fourQr, px: 500 },
    { name: '인생네컷_뒤_스트립', record: fc('strip', 'white'), side: 'back', px: 500 },
    { name: '인생네컷_뒤_스트립_테마_흰무지', record: fc('strip', 'white', { theme: 'plain' }), side: 'back', px: 500 },
    { name: '인생네컷_뒤_스트립_테마_모눈', record: fc('strip', 'white', { theme: 'grid' }), side: 'back', px: 500 },
    { name: '인생네컷_뒤_2x2', record: fc('grid', 'sky'), side: 'back', px: 700 },
    { name: '인생네컷_뒤_가로', record: fc('wide', 'black'), side: 'back', px: 1000 },
  ];
};
