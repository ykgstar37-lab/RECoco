// 상점 미리보기에 보여줄 상품 정보: 이름·설명·가격·쓰는 곳 태그·예시 기록
import { KIND_LABEL } from '../templates';
import { RETRO_COLORS, RETRO_COLOR_IDS } from '../templates/ConcertRetro';
import { HOUSE_COLORS } from '../templates/FoodHouse';
import { PHOTO_COLORS, PHOTO_COLOR_IDS } from '../templates/PhotoTicket';
import { GRID_COLORS, GRID_COLOR_IDS } from '../templates/shared';
import { HOLO_COLORS, HOLO_COLOR_IDS } from '../templates/ShowHolo';
import { BAND_COLORS, BAND_COLOR_IDS } from '../templates/WristBand';
import { ConcertDesign, FoodRecord, HouseColor, RecoRecord, RecordKind, ShowDesign, TicketColor } from '../types';
import { sampleConcert, sampleExercise, sampleFood, sampleFourcut, sampleGift, sampleMusic, sampleShow, sampleSpending } from './previewSamples';
import { CONCERT_DESIGNS, ConcertDesignItem, FOOD_DESIGNS, FOURCUT_DESIGNS, FoodDesignItem, FourcutDesignItem, PAID_CATEGORIES, SHOW_DESIGNS, ShowDesignItem, THEMES, ThemeItem } from './shop';

export interface PreviewSample {
  record: RecoRecord;
  /** 가로로 납작한 모양은 한 칸에 여러 색을 세로로 쌓아 보여준다 */
  more?: RecoRecord[];
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
  // 모눈종이는 색마다 한 장씩, 소비 영수증과 인생네컷 뒷면을 번갈아 보여준다
  const samples: PreviewSample[] =
    t.id === 'grid'
      ? GRID_COLOR_IDS.map((c, i) =>
          i % 2 === 0
            ? { record: { ...sampleSpending(t.id), id: `preview-spending-grid-${c}`, themeColor: c }, caption: `소비 · ${GRID_COLORS[c].name}` }
            : { record: { ...sampleFourcut(t.id), id: `preview-fourcut-grid-${c}`, themeColor: c }, side: 'back', caption: `네컷 뒷면 · ${GRID_COLORS[c].name}` },
        )
      : [
          { record: sampleSpending(t.id), caption: '소비 영수증' },
          { record: sampleFourcut(t.id), side: 'back', caption: '인생네컷 뒷면' },
        ];
  return { title: t.name, desc: t.desc, productId: t.productId, price: t.price, tags: THEME_TAGS, samples };
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
      record: { ...sampleFood(), id: `preview-food-${d.id}-${color}`, design: d.id, color, type, place, menus, total, revisit, memo },
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

/** 코코몬 카드: 등급이 뽑기라서 여러 등급을 나란히 보여준다 */
export function fourcutDesignProduct(d: FourcutDesignItem): PreviewProduct {
  const of = (id: string, caption: string) => ({ record: { ...sampleFourcut(), id, design: 'card' as const }, caption });
  return {
    title: d.name,
    desc: d.desc,
    productId: d.productId,
    price: d.price,
    tags: [KIND_LABEL.fourcut],
    samples: [of('cm52', 'R · 무지개 (1%)'), of('cm16', 'SS (4%)'), of('cm13', 'S (9%)'), of('cm3', 'A (18%)'), of('cm4', 'B (28%)'), of('cm0', 'C (40%)')],
  };
}

export const fourcutDesignProductById = (id: FourcutDesignItem['id']) => fourcutDesignProduct(FOURCUT_DESIGNS.find((d) => d.id === id)!);

/** 콘서트·공연전시 영수증 모양 하나의 미리보기 (두 카테고리가 같이 쓰면 양쪽 예시를 다 보여준다) */
/** 이 모양에서 고를 수 있는 색 (없으면 단색 모양) */
const designColors = (id: ConcertDesign | ShowDesign): { id: TicketColor; name: string }[] =>
  id === 'retro'
    ? RETRO_COLOR_IDS.map((c) => ({ id: c as TicketColor, name: RETRO_COLORS[c].name }))
    : id === 'band'
    ? BAND_COLOR_IDS.map((c) => ({ id: c as TicketColor, name: BAND_COLORS[c].name }))
    : id === 'kpop'
      ? PHOTO_COLOR_IDS.map((c) => ({ id: c as TicketColor, name: PHOTO_COLORS[c].name }))
      : id === 'holo'
        ? HOLO_COLOR_IDS.map((c) => ({ id: c as TicketColor, name: HOLO_COLORS[c].name }))
        : [];

export function designProduct(d: ConcertDesignItem | ShowDesignItem): PreviewProduct {
  const samples: PreviewSample[] = [];
  const both = d.kinds.length > 1;
  const colors = designColors(d.id);

  if (d.id === 'retro') {
    // 콘서트 레트로는 가로로 납작해서 한 칸에 세 색을 세로로 쌓고, 공연은 세로라 한 장씩
    const concertOf = (c: TicketColor) => ({ ...sampleConcert(), id: `preview-retro-${c}`, design: 'retro' as ConcertDesign, color: c });
    samples.push({ record: concertOf('burgundy'), more: [concertOf('charcoal'), concertOf('navy')], caption: '콘서트 · 버건디·먹색·남색' });
    samples.push({ record: { ...sampleShow('play'), id: 'preview-retro-forest', design: 'retro', color: 'forest' }, caption: '숲 초록' });
    samples.push({ record: { ...sampleShow('exhibition'), id: 'preview-retro-sepia', design: 'retro', color: 'sepia' }, caption: '세피아' });
  } else if (colors.length) {
    // 색마다 한 장씩. 두 카테고리가 같이 쓰는 모양은 콘서트·공연을 번갈아 보여준다
    colors.forEach((c, i) => {
      const asShow = d.kinds.includes('show') && (!both || i % 2 === 1);
      samples.push(
        asShow
          ? { record: { ...sampleShow(i % 4 === 3 ? 'exhibition' : 'play'), id: `preview-${d.id}-${c.id}`, design: d.id as ShowDesign, color: c.id }, caption: c.name }
          : { record: { ...sampleConcert(), id: `preview-${d.id}-${c.id}`, design: d.id as ConcertDesign, color: c.id }, caption: c.name },
      );
    });
  } else {
    if (d.kinds.includes('concert')) samples.push({ record: { ...sampleConcert(), id: `preview-${d.id}-concert`, design: d.id as ConcertDesign }, caption: both ? KIND_LABEL.concert : d.name });
    if (d.kinds.includes('show')) {
      samples.push({ record: { ...sampleShow('play'), id: `preview-${d.id}-play`, design: d.id as ShowDesign }, caption: '뮤지컬·연극' });
      samples.push({ record: { ...sampleShow('exhibition'), id: `preview-${d.id}-ex`, design: d.id as ShowDesign }, caption: '전시' });
    }
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
            { record: sampleFood(), caption: '주문서 · 초록' },
            { record: { ...sampleFood(), id: 'preview-food-ink', color: 'ink' }, caption: '주문서 · 먹색' },
            { record: { ...sampleFood(), id: 'preview-food-navy', color: 'navy' }, caption: '주문서 · 남색' },
            { record: { ...sampleFood(), id: 'preview-food-wine', color: 'wine' }, caption: '주문서 · 팥색' },
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
              { record: { ...sampleShow('play'), id: 'preview-show-plain', design: 'plain' }, caption: '흰 무지' },
              { record: { ...sampleShow('play'), id: 'preview-show-poster', design: 'poster' }, caption: '포스터 입장권' },
              { record: { ...sampleShow('exhibition'), id: 'preview-show-ex', design: 'poster' }, caption: '전시' },
            ]
          : kind === 'concert'
            ? [
                { record: { ...sampleConcert(), id: 'preview-concert-plain', design: 'plain' }, caption: '흰 무지' },
                { record: sampleConcert(), caption: '밤하늘 티켓' },
              ]
            : kind === 'exercise'
              ? [
                  { record: sampleExercise('run'), caption: '기록표 · 러닝' },
                  { record: { ...sampleExercise('gym'), id: 'preview-exercise-gym-slip' }, caption: '기록표 · 헬스' },
                  { record: { ...sampleExercise('run'), id: 'preview-exercise-card', design: 'card' }, caption: '기록 카드' },
                ]
              : kind === 'music'
                ? [
                    { record: sampleMusic('album'), caption: '앨범 카드' },
                    { record: sampleMusic('list'), caption: '플레이리스트 영수증' },
                  ]
                : [];
  return { title: c.name, desc: c.desc, productId: c.productId, price: c.price, tags: [], samples };
}
