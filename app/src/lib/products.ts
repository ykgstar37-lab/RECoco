// 상점 미리보기에 보여줄 상품 정보: 이름·설명·가격·쓰는 곳 태그·예시 기록
import { KIND_LABEL } from '../templates';
import { RecoRecord, RecordKind } from '../types';
import { sampleFourcut, sampleGift, sampleSpending } from './previewSamples';
import { PAID_CATEGORIES, THEMES, ThemeItem } from './shop';

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

export function categoryProduct(kind: RecordKind): PreviewProduct | null {
  const c = PAID_CATEGORIES[kind];
  if (!c) return null;
  const samples: PreviewSample[] =
    kind === 'gift'
      ? [
          { record: sampleGift('yellow'), caption: '받은 선물' },
          { record: { ...sampleGift('pink'), direction: 'given', person: '엄마', item: '꽃다발', brand: '', price: 0, message: '생일 축하해요 엄마, 늘 고마워요.' }, caption: '보낸 선물' },
        ]
      : [];
  return { title: c.name, desc: c.desc, productId: c.productId, price: c.price, tags: [], samples };
}
