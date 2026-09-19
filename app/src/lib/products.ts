// 상점 미리보기에 보여줄 상품 정보: 이름·설명·가격·쓰는 곳 태그·예시 기록
import { KIND_LABEL } from '../templates';
import { HOUSE_COLORS } from '../templates/FoodHouse';
import { ConcertDesign, FoodRecord, HouseColor, RecoRecord, RecordKind, ShowDesign } from '../types';
import { sampleConcert, sampleFood, sampleFourcut, sampleGift, sampleShow, sampleSpending } from './previewSamples';
import { CONCERT_DESIGNS, ConcertDesignItem, FOOD_DESIGNS, FoodDesignItem, PAID_CATEGORIES, SHOW_DESIGNS, ShowDesignItem, THEMES, ThemeItem } from './shop';

export interface PreviewSample {
  record: RecoRecord;
  /** 인생네컷 뒷면을 보여줄 때 */
  side?: 'back';
  caption: string;
}

export interface PreviewProduct {
  title: string;
  desc: string;
  productId: string;
  price: number;
  /** 어느 카테고리에 쓰는지 (원형 태그) */
  tags: string[];
  /** 이 중 하나라도 사야 쓸 수 있는 카테고리 (영수증 모양 테마) */
  requires?: RecordKind[];
  samples: PreviewSample[];
}

/** 테마가 적용되는 카테고리 */
export const THEME_TAGS = [KIND_LABEL.spending, KIND_LABEL.fourcut];

export function themeProduct(t: ThemeItem): PreviewProduct {
  return {
    title: t.name,
    desc: t.desc,
    productId: t.productId,
    price: t.price,
    tags: THEME_TAGS,
    samples: [
      { record: sampleSpending(t.id), caption: '소비 영수증' },
      { record: sampleFourcut(t.id), side: 'back', caption: '인생네컷 뒷면' },
    ],
  };
}

export const themeProductById = (id: ThemeItem['id']) => themeProduct(THEMES.find((t) => t.id === id)!);

export function foodDesignProduct(d: FoodDesignItem): PreviewProduct {
  return {
    title: d.name,
    desc: d.desc,
    productId: d.productId,
    price: d.price,
    tags: [KIND_LABEL.food],
    requires: ['food'],
    // 지붕 색이 여러 가지라는 걸 보여준다 (색은 가게 종류와 상관없이 고른다)
    samples: HOUSE_SAMPLES.map(({ color, type, place, menus, total, revisit, memo }) => ({
      record: { ...sampleFood(), id: `preview-food-${d.id}-${color}`, design: d.id, houseColor: color, type, place, menus, total, revisit, memo },
      caption: `${HOUSE_COLORS[color].name} 지붕`,
    })),
  };
}

/** 집 모양 미리보기: 색마다 다른 가게로 한 장씩 */
const HOUSE_SAMPLES: (Pick<FoodRecord, 'type' | 'place' | 'menus' | 'total' | 'revisit' | 'memo'> & { color: HouseColor })[] = [
  {
    color: 'orange',
    type: 'cafe',
    place: '달밤커피',
    menus: [
      { name: '아이스 라떼', stars: 4 },
      { name: '바스크 치즈케이크', stars: 5 },
    ],
    total: 12500,
    revisit: 'yes',
    memo: '치즈케이크 꾸덕해서 또 먹고 싶다. 창가 자리 명당!',
  },
  {
    color: 'green',
    type: 'meal',
    place: '초록상회 국수',
    menus: [
      { name: '들기름 막국수', stars: 5 },
      { name: '수육 한 접시', stars: 4 },
    ],
    total: 23000,
    revisit: 'yes',
    memo: '들기름 향이 진하다. 다음엔 비빔으로.',
  },
  {
    color: 'blue',
    type: 'bar',
    place: '연남 작은 술집',
    menus: [
      { name: '하이볼', stars: 5 },
      { name: '감자전', stars: 4 },
    ],
    total: 21000,
    revisit: 'maybe',
    memo: '',
  },
  {
    color: 'pink',
    type: 'dessert',
    place: '설탕구름 디저트',
    menus: [
      { name: '딸기 생크림 케이크', stars: 5 },
      { name: '얼그레이 밀크티', stars: 3 },
    ],
    total: 16800,
    revisit: 'yes',
    memo: '생크림이 안 느끼하다.',
  },
  {
    color: 'red',
    type: 'meal',
    place: '골목 분식',
    menus: [
      { name: '즉석 떡볶이', stars: 5 },
      { name: '튀김 모둠', stars: 4 },
    ],
    total: 14000,
    revisit: 'yes',
    memo: '',
  },
];

export const foodDesignProductById = (id: FoodDesignItem['id']) => foodDesignProduct(FOOD_DESIGNS.find((d) => d.id === id)!);

/** 콘서트·공연전시 영수증 모양 하나의 미리보기 (두 카테고리가 같이 쓰면 양쪽 예시를 다 보여준다) */
export function designProduct(d: ConcertDesignItem | ShowDesignItem): PreviewProduct {
  const samples: PreviewSample[] = [];
  const both = d.kinds.length > 1;
  if (d.kinds.includes('concert')) {
    samples.push({ record: { ...sampleConcert(), id: `preview-${d.id}-concert`, design: d.id as ConcertDesign }, caption: both ? KIND_LABEL.concert : d.name });
    if (!both)
      samples.push({
        record: {
          ...sampleConcert(),
          id: `preview-${d.id}-concert2`,
          design: d.id as ConcertDesign,
          artist: '달빛소년단',
          title: '월드투어 서울',
          place: 'KSPO DOME',
          seat: '2층 F구역 7열 21번',
          stars: 4,
          memo: '앵콜 때 은박지 폭죽이 터졌다.',
        },
        caption: '다른 공연',
      });
  }
  if (d.kinds.includes('show')) {
    samples.push({ record: { ...sampleShow('play'), id: `preview-${d.id}-play`, design: d.id as ShowDesign }, caption: '뮤지컬·연극' });
    samples.push({ record: { ...sampleShow('exhibition'), id: `preview-${d.id}-ex`, design: d.id as ShowDesign }, caption: '전시' });
  }
  return { title: d.name, desc: d.desc, productId: d.productId, price: d.price, tags: d.kinds.map((k) => KIND_LABEL[k]), requires: d.kinds, samples };
}

export const concertDesignProduct = designProduct;
export const showDesignProduct = designProduct;

export const concertDesignProductById = (id: ConcertDesignItem['id']) => designProduct(CONCERT_DESIGNS.find((d) => d.id === id)!);
export const showDesignProductById = (id: ShowDesignItem['id']) => designProduct(SHOW_DESIGNS.find((d) => d.id === id)!);

export function categoryProduct(kind: RecordKind): PreviewProduct | null {
  const c = PAID_CATEGORIES[kind];
  if (!c) return null;
  const samples: PreviewSample[] =
    kind === 'gift'
      ? [
          { record: sampleGift('yellow'), caption: '받은 선물' },
          { record: { ...sampleGift('pink'), direction: 'given', person: '엄마', item: '꽃다발', brand: '', price: 0, message: '생일 축하해요 엄마, 늘 고마워요.' }, caption: '보낸 선물' },
        ]
      : kind === 'food'
        ? [
            { record: sampleFood(), caption: '주문서' },
            { record: { ...sampleFood(), id: 'preview-food-plain', design: 'plain' }, caption: '단색 주문서' },
            {
              record: {
                ...sampleFood(),
                id: 'preview-food-meal',
                place: '골목 칼국수',
                area: '망원동',
                type: 'meal',
                withWhom: '엄마',
                menus: [
                  { name: '바지락 칼국수', stars: 5 },
                  { name: '김치만두', stars: 3 },
                  { name: '보리밥', stars: 4 },
                ],
                total: 23000,
                revisit: 'maybe',
                memo: '',
              },
              caption: '식당',
            },
          ]
        : kind === 'show'
          ? [
              { record: sampleShow('play'), caption: '입장권' },
              { record: { ...sampleShow('play'), id: 'preview-show-poster', design: 'poster' }, caption: '포스터 입장권' },
              { record: sampleShow('exhibition'), caption: '전시' },
            ]
          : kind === 'concert'
            ? [
                { record: sampleConcert(), caption: '가로 티켓' },
                { record: { ...sampleConcert(), id: 'preview-concert-retro', design: 'retro' }, caption: '레트로 티켓' },
              ]
            : [];
  return { title: c.name, desc: c.desc, productId: c.productId, price: c.price, tags: [], samples };
}
