// 상점 미리보기용 예시 기록 (저장되지 않음)
import { ConcertRecord, FoodRecord, FourcutRecord, GiftCard, GiftRecord, PaperTheme, ShowRecord, ShowType, SpendingRecord } from '../types';

export function sampleSpending(theme?: PaperTheme): SpendingRecord {
  return {
    id: `preview-spending-${theme ?? 'default'}`,
    createdAt: '2026-09-16T15:20:00.000Z',
    kind: 'spending',
    date: '2026-09-16',
    store: '달밤커피',
    category: '카페',
    address: '서울 마포구 연남동',
    items: [
      { name: '아이스 아메리카노', qty: 2, price: 4500 },
      { name: '바스크 치즈케이크', qty: 1, price: 6500 },
    ],
    memo: '☕',
    theme,
  };
}

export function sampleFourcut(theme?: PaperTheme): FourcutRecord {
  return {
    id: `preview-fourcut-${theme ?? 'default'}`,
    createdAt: '2026-09-17T20:10:00.000Z',
    kind: 'fourcut',
    date: '2026-09-17',
    title: '여름의 마지막 네컷',
    place: '연남동',
    withWhom: '지민',
    diary: '퇴근하고 만나서 떡볶이 먹고 사진 찍었다. 포즈 고민하다가 결국 다 웃긴 표정.',
    source: 'photos',
    frameImage: null,
    photos: [],
    layout: 'strip',
    frame: 'white',
    sourceUrl: '',
    theme,
  };
}

export function sampleGift(card: GiftCard = 'yellow'): GiftRecord {
  return {
    id: `preview-gift-${card}`,
    createdAt: '2026-09-14T12:00:00.000Z',
    kind: 'gift',
    date: '2026-09-14',
    direction: 'received',
    person: '지민',
    item: '아이스 아메리카노 2잔',
    brand: '달밤커피',
    price: 9000,
    message: '시험 끝난 거 축하해! 커피 마시면서 푹 쉬어',
    photo: null,
    card,
  };
}

export function sampleFood(): FoodRecord {
  return {
    id: 'preview-food',
    createdAt: '2026-09-16T15:20:00.000Z',
    kind: 'food',
    date: '2026-09-16',
    place: '달밤커피',
    area: '연남동',
    type: 'cafe',
    withWhom: '지민',
    menus: [
      { name: '아이스 라떼', stars: 4 },
      { name: '바스크 치즈케이크', stars: 5 },
    ],
    total: 12500,
    revisit: 'yes',
    memo: '치즈케이크 꾸덕해서 또 먹고 싶다. 창가 자리 명당!',
    photo: null,
  };
}

export function sampleShow(type: ShowType = 'play'): ShowRecord {
  const base = {
    id: `preview-show-${type}`,
    createdAt: '2026-09-13T21:30:00.000Z',
    kind: 'show' as const,
    date: '2026-09-13',
    time: '19:00',
    type,
    stars: 5,
    people: 2,
    photo: null,
  };
  if (type === 'exhibition')
    return { ...base, time: '14:30', title: '빛과 그림자', artist: '김하늘', place: '서울시립미술관', seat: '', memo: '마지막 방 영상이 제일 좋았다. 도록도 샀다.' };
  if (type === 'play')
    return { ...base, title: '레미제라블', artist: '조승우, 정성화', place: '블루스퀘어 신한카드홀', seat: '1층 7열 12번', memo: '커튼콜에서 눈물 날 뻔했다.' };
  return { ...base, title: '한여름밤의 콘서트', artist: '새벽밴드', place: '올림픽공원 올림픽홀', seat: '스탠딩 A구역 132번', memo: '앙코르 세 곡. 목이 다 쉬었다.' };
}

export function sampleConcert(): ConcertRecord {
  return {
    id: 'preview-concert',
    createdAt: '2026-09-13T22:10:00.000Z',
    kind: 'concert',
    date: '2026-09-13',
    time: '19:00',
    title: '한여름밤의 라이브',
    artist: '새벽밴드',
    place: '올림픽공원 올림픽홀',
    seat: '스탠딩 A구역 132번',
    people: 2,
    price: 99000,
    stars: 5,
    memo: '앙코르 세 곡. 목이 다 쉬었다.',
    photo: null,
    design: 'ticket',
  };
}
