// 상점 미리보기용 예시 기록 (저장되지 않음)
import { FourcutRecord, GiftCard, GiftRecord, PaperTheme, SpendingRecord } from '../types';

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
