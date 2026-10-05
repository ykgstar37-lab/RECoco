// 상점 미리보기용 예시 기록 (저장되지 않음)
import { Image } from 'react-native';

import { ConcertRecord, DailyRecord, Photo, ExerciseRecord, FoodRecord, FourcutRecord, GiftCard, GiftRecord, MusicRecord, PaperTheme, ShowRecord, ShowType, SpendingRecord } from '../types';

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
    item: '딸기 생크림 케이크',
    brand: '달밤베이커리',
    price: 28000,
    message: '시험 끝난 거 축하해! 달달한 거 먹고 푹 쉬어',
    photo: SAMPLE_SHOTS.cake(),
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
    photo: SAMPLE_SHOTS.cafe(),
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
    photo: SAMPLE_SHOTS.stage(),
  };
  if (type === 'exhibition')
    return { ...base, photo: SAMPLE_SHOTS.exhibit(), time: '14:30', title: '빛과 그림자', artist: '김하늘', place: '서울시립미술관', seat: '', memo: '마지막 방 영상이 제일 좋았다. 도록도 샀다.' };
  if (type === 'play')
    return { ...base, photo: SAMPLE_SHOTS.poster(), title: '레미제라블', artist: '조승우, 정성화', place: '블루스퀘어 신한카드홀', seat: '1층 7열 12번', memo: '커튼콜에서 눈물 날 뻔했다.' };
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
    photo: SAMPLE_SHOTS.stage(),
    design: 'ticket',
  };
}

/**
 * 앱에 넣어 둔 예시 사진 (일상 미리보기용, assets/samples).
 * ⚠️ 지금은 사용자가 뒷면 진하기를 보려고 준 마인크래프트 캡처다 — **출시 전에 우리 그림으로 바꿀 것** (남의 게임 그림)
 */
const SAMPLE_PHOTOS = [
  { mod: require('../../assets/samples/daily-1.jpg'), width: 480, height: 480 },
  { mod: require('../../assets/samples/daily-2.jpg'), width: 480, height: 613 },
  { mod: require('../../assets/samples/daily-3.jpg'), width: 480, height: 360 },
];

const uriOf = (m: unknown): string => {
  if (typeof m === 'number') return Image.resolveAssetSource(m)?.uri ?? '';
  if (typeof m === 'string') return m;
  const o = m as { uri?: string; default?: unknown };
  return o?.uri ?? uriOf(o?.default);
};

const SAMPLE_TEXT: Pick<DailyRecord, 'tag' | 'title' | 'memo' | 'place'>[] = [
  { tag: '친구', title: '셀카 장인', memo: '사진 찍어준다더니 자기 얼굴만 찍었다. 플래시 때문에 눈 아팠음.', place: '지민이네 집' },
  { tag: '나', title: '', memo: '오늘은 아무것도 안 하고 누워만 있었다. 그래도 괜찮은 하루.', place: '' },
  { tag: '내 강아지', title: '꽃밭 산책', memo: '분홍 꽃밭에서 한참 놀았다. 집에 와서 바로 기절.', place: '동네 공원' },
];

/** 카테고리 미리보기 사진 (사용자가 준 것, 양식 사진 칸 비율로 잘라 둠) — ⚠️ 마인크래프트 캡처라 출시 전에 바꿀 것 */
export const SAMPLE_SHOTS = {
  cafe: () => shot(require('../../assets/samples/food-cafe.jpg'), 480, 434),
  meal: () => shot(require('../../assets/samples/food-meal.jpg'), 480, 434),
  stage: () => shot(require('../../assets/samples/concert.jpg'), 480, 464),
  exercise: () => shot(require('../../assets/samples/exercise.jpg'), 480, 640),
  cake: () => shot(require('../../assets/samples/gift-cake.jpg'), 400, 400),
  melon: () => shot(require('../../assets/samples/gift-melon.jpg'), 400, 400),
  music: () => shot(require('../../assets/samples/music.jpg'), 480, 480),
  exhibit: () => shot(require('../../assets/samples/exhibit-1.jpg'), 480, 480),
  exhibit2: () => shot(require('../../assets/samples/exhibit-2.jpg'), 480, 480),
  poster: () => shot(require('../../assets/samples/show-poster.jpg'), 480, 480),
};

/** 인생네컷 테마 미리보기 사진 (사용자가 준 것, 사진 칸 비율에 맞춰 잘라 둠) — ⚠️ 이것도 마인크래프트 캡처라 출시 전에 바꿀 것 */
const shot = (mod: unknown, width: number, height: number): Photo => ({ uri: uriOf(mod), width, height });

export const FOURCUT_SAMPLE_PHOTOS = {
  /** 하우스네컷 네 칸 (칸 비율 232:177 로 잘랐다) */
  house: () => [
    shot(require('../../assets/samples/house-1.jpg'), 464, 354),
    shot(require('../../assets/samples/house-2.jpg'), 464, 354),
    shot(require('../../assets/samples/house-3.jpg'), 464, 354),
    shot(require('../../assets/samples/house-4.jpg'), 464, 354),
  ],
  /** 코코치 화면 (정사각) */
  cocochi: () => [shot(require('../../assets/samples/cocochi.jpg'), 480, 480)],
  /** 코코몬 카드 창 (가로로 조금 넓다) */
  cocomon: () => [shot(require('../../assets/samples/cocomon.jpg'), 480, 364)],
};

export function sampleDaily(i = 0, extra: Partial<DailyRecord> = {}): DailyRecord {
  const p = SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length];
  return {
    id: `preview-daily-${i}`,
    createdAt: '2026-10-03T19:00:00.000Z',
    kind: 'daily',
    date: '2026-10-03',
    photo: { uri: uriOf(p.mod), width: p.width, height: p.height },
    ...SAMPLE_TEXT[i % SAMPLE_TEXT.length],
    ...extra,
  };
}

export function sampleExercise(type: ExerciseRecord['type'] = 'run'): ExerciseRecord {
  const base = { id: `preview-exercise-${type}`, createdAt: '2026-09-19T08:00:00.000Z', kind: 'exercise' as const, date: '2026-09-19', time: '07:10', type, photo: null, design: 'slip' as const };
  if (type === 'gym')
    return {
      ...base,
      place: '집 근처 헬스장',
      minutes: 65,
      distance: 0,
      pace: '',
      effort: 3,
      memo: '하체 하는 날. 계단 내려갈 때 후들거림.',
      moves: [
        { name: '스쿼트', weight: 40, reps: 12, sets: 4 },
        { name: '레그프레스', weight: 80, reps: 12, sets: 3 },
        { name: '런지', weight: 10, reps: 15, sets: 3 },
      ],
    };
  return { ...base, place: '한강공원 망원지구', minutes: 42, distance: 6.4, pace: `6'32"`, effort: 4, memo: '강바람이 시원했다. 마지막 1km 는 걸었음.', moves: [] };
}

export function sampleMusic(design: MusicRecord['design'] = 'album'): MusicRecord {
  const base = { id: `preview-music-${design}`, createdAt: '2026-09-17T23:00:00.000Z', kind: 'music' as const, date: '2026-09-17', photo: SAMPLE_SHOTS.music(), design };
  if (design === 'list')
    return {
      ...base,
      title: '가을 밤 플레이리스트',
      artist: '',
      label: '',
      year: '',
      place: '출퇴근길',
      stars: 5,
      memo: '이번 가을 무한반복.',
      tracks: [
        { title: 'Golden Hour', artist: '새벽밴드', stars: 5 },
        { title: '밤산책', artist: '달빛', stars: 4 },
        { title: '여름의 끝', artist: '미소', stars: 3 },
      ],
    };
  return {
    ...base,
    title: 'Golden Hour',
    artist: '새벽밴드',
    label: '인디팝',
    year: '2026',
    place: '지하철',
    stars: 5,
    memo: '가을에 듣기 좋다. 3번 트랙 무한반복.',
    tracks: [
      { title: '노을 사이', artist: '', stars: 5 },
      { title: '밤산책', artist: '', stars: 4 },
    ],
  };
}
