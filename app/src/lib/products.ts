// 상점 미리보기에 보여줄 상품 정보: 이름·설명·가격·쓰는 곳 태그·예시 기록
import { KIND_LABEL } from '../templates';
import { RecoRecord, RecordKind } from '../types';
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
    samples: [
      { record: { ...sampleFood(), id: `preview-food-${d.id}`, design: d.id }, caption: '카페' },
      {
        record: {
          ...sampleFood(),
          id: `preview-food-${d.id}-bar`,
          design: d.id,
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
        caption: '술집',
      },
    ],
  };
}

export const foodDesignProductById = (id: FoodDesignItem['id']) => foodDesignProduct(FOOD_DESIGNS.find((d) => d.id === id)!);

export function concertDesignProduct(d: ConcertDesignItem): PreviewProduct {
  return {
    title: d.name,
    desc: d.desc,
    productId: d.productId,
    price: d.price,
    tags: [KIND_LABEL.concert],
    samples: [
      { record: { ...sampleConcert(), id: `preview-concert-${d.id}`, design: d.id }, caption: d.name },
      {
        record: {
          ...sampleConcert(),
          id: `preview-concert-${d.id}-2`,
          design: d.id,
          artist: '달빛소년단',
          title: '월드투어 서울',
          place: 'KSPO DOME',
          seat: '2층 F구역 7열 21번',
          stars: 4,
          memo: '앵콜 때 은박지 폭죽이 터졌다.',
        },
        caption: '다른 공연',
      },
    ],
  };
}

export const concertDesignProductById = (id: ConcertDesignItem['id']) => concertDesignProduct(CONCERT_DESIGNS.find((d) => d.id === id)!);

export function showDesignProduct(d: ShowDesignItem): PreviewProduct {
  return {
    title: d.name,
    desc: d.desc,
    productId: d.productId,
    price: d.price,
    tags: [KIND_LABEL.show],
    samples: [
      { record: { ...sampleShow('play'), id: `preview-show-${d.id}`, design: d.id }, caption: '뮤지컬·연극' },
      { record: { ...sampleShow('exhibition'), id: `preview-show-${d.id}-ex`, design: d.id }, caption: '전시' },
    ],
  };
}

export const showDesignProductById = (id: ShowDesignItem['id']) => showDesignProduct(SHOW_DESIGNS.find((d) => d.id === id)!);

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
            { record: sampleFood(), caption: '카페' },
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
              { record: sampleShow('play'), caption: '뮤지컬·연극' },
              { record: sampleShow('exhibition'), caption: '전시' },
            ]
          : kind === 'concert'
            ? [
                { record: sampleConcert(), caption: '콘서트 티켓' },
                {
                  record: { ...sampleConcert(), id: 'preview-concert-2', artist: '달빛소년단', title: '월드투어 서울', place: 'KSPO DOME', seat: '2층 F구역 7열 21번', price: 154000, stars: 4, memo: '' },
                  caption: '다른 공연',
                },
              ]
            : [];
  return { title: c.name, desc: c.desc, productId: c.productId, price: c.price, tags: [], samples };
}
