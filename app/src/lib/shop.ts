// 부분 유료화: 코코 옷(보상 해금/개별 구매) + 새 카테고리·영수증 테마(개별 구매, 예정)
// 실제 결제(App Store·Google Play)는 개발 빌드에서 붙인다. 지금은 개발 모드에서만 바로 구매 처리.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { PurchaseCancelled, buyProduct, canBuy, ownedProductIds, startBilling } from './billing';

import type { OutfitId } from '../components/Outfits';
import type { ConcertDesign, ExerciseDesign, FoodDesign, FourcutDesign, MusicDesign, PaperTheme, RecordKind, ShowDesign } from '../types';

const OWNED_KEY = 'recoco.owned.v1';
const OUTFIT_KEY = 'recoco.outfit.v1';

export type Unlock = { type: 'reward'; records: number } | { type: 'paid'; productId: string; price: number };

export interface OutfitItem {
  id: OutfitId;
  name: string;
  unlock: Unlock;
}

export const OUTFITS: OutfitItem[] = [
  { id: 'ribbon', name: '리본', unlock: { type: 'reward', records: 3 } },
  { id: 'heart', name: '하트 꼬랑지', unlock: { type: 'reward', records: 10 } },
  { id: 'straw', name: '밀짚모자', unlock: { type: 'reward', records: 30 } },
  { id: 'beret', name: '베레모', unlock: { type: 'paid', productId: 'recoco.outfit.beret', price: 1000 } },
  { id: 'crown', name: '왕관', unlock: { type: 'paid', productId: 'recoco.outfit.crown', price: 1000 } },
  { id: 'party', name: '파티 고깔', unlock: { type: 'paid', productId: 'recoco.outfit.party', price: 1000 } },
  { id: 'headphones', name: '헤드폰', unlock: { type: 'paid', productId: 'recoco.outfit.headphones', price: 1000 } },
  { id: 'earflap', name: '귀도리 니트', unlock: { type: 'paid', productId: 'recoco.outfit.earflap', price: 1000 } },
  { id: 'trapper', name: '털 방한모', unlock: { type: 'paid', productId: 'recoco.outfit.trapper', price: 1000 } },
  { id: 'glasses', name: '빨간 안경', unlock: { type: 'paid', productId: 'recoco.outfit.glasses', price: 1000 } },
  { id: 'cat', name: '고양이', unlock: { type: 'paid', productId: 'recoco.outfit.cat', price: 1000 } },
  { id: 'dog', name: '강아지 귀', unlock: { type: 'paid', productId: 'recoco.outfit.dog', price: 1000 } },
];

export interface ThemeItem {
  id: PaperTheme;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 기본으로 주는 종이 (소비 영수증·인생네컷 뒷면) */
export const FREE_THEMES: { id: PaperTheme; name: string }[] = [{ id: 'plain', name: '흰 무지' }];

/** 영수증 테마: 하나 사면 소비 영수증과 인생네컷 뒷면 모두에 쓸 수 있다 */
export const THEMES: ThemeItem[] = [
  { id: 'grid', name: '모눈종이', desc: '모눈이 깔린 노트 종이 · 격자 색 4가지', productId: 'recoco.theme.grid', price: 1000 },
];

export const themeUnlocked = (id: PaperTheme | undefined, owned: string[]) =>
  !id || FREE_THEMES.some((t) => t.id === id) || owned.includes(THEMES.find((t) => t.id === id)?.productId ?? '');

export interface FoodDesignItem {
  id: Exclude<FoodDesign, 'order'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 카페·맛집 영수증 모양 테마 (기본은 맛집 주문서. 색은 모양을 고른 다음 따로 고른다) */
export const FREE_FOOD_DESIGNS: { id: FoodDesign; name: string }[] = [{ id: 'order', name: '주문서' }];

export const FOOD_DESIGNS: FoodDesignItem[] = [
  { id: 'house', name: '집 모양', desc: '간판·창문 사진·칠판 메뉴가 있는 작은 가게 집 · 지붕 색 5가지', productId: 'recoco.theme.food-house', price: 1000 },
];

export const foodDesignUnlocked = (id: FoodDesign | undefined, owned: string[]) =>
  !id || FREE_FOOD_DESIGNS.some((d) => d.id === id) || owned.includes(FOOD_DESIGNS.find((d) => d.id === id)?.productId ?? '');

/** 콘서트·공연전시가 같이 쓰는 모양: 한 번 사면 두 카테고리 모두에서 고를 수 있다 */
const BOTH = ['concert', 'show'] as RecordKind[];
const PHOTO_TICKET = { name: '포토 티켓', desc: '사진이 큼직하게 박힌 티켓 · 색 4가지', productId: 'recoco.theme.photo-ticket', price: 1000, kinds: BOTH };
const WRIST_BAND = { name: '팔찌 티켓', desc: '공연장에서 채워주는 손목 팔찌 · 색 5가지', productId: 'recoco.theme.wristband', price: 1000, kinds: BOTH };
const RETRO_TICKET = { name: '레트로 티켓', desc: '크림 종이에 색 조각이 붙은 옛날 극장 티켓 · 색 5가지', productId: 'recoco.theme.retro', price: 1000, kinds: BOTH };

export interface ConcertDesignItem {
  id: Exclude<ConcertDesign, 'ticket'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
  /** 이 모양을 쓸 수 있는 카테고리 (상점 태그·미리보기에 쓴다) */
  kinds: RecordKind[];
}

/** 카테고리를 사면 바로 쓰는 기본 모양 (무료) */
export const FREE_CONCERT_DESIGNS: { id: ConcertDesign; name: string }[] = [
  { id: 'plain', name: '흰 무지' },
  { id: 'ticket', name: '밤하늘 티켓' },
];

export const CONCERT_DESIGNS: ConcertDesignItem[] = [
  { id: 'retro', ...RETRO_TICKET },
  { id: 'band', ...WRIST_BAND },
  { id: 'kpop', ...PHOTO_TICKET },
];

export const concertDesignUnlocked = (id: ConcertDesign | undefined, owned: string[]) =>
  !id || FREE_CONCERT_DESIGNS.some((d) => d.id === id) || owned.includes(CONCERT_DESIGNS.find((d) => d.id === id)?.productId ?? '');

export interface ShowDesignItem {
  id: Exclude<ShowDesign, 'ticket'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
  kinds: RecordKind[];
}

/** 공연·전시 영수증 모양 테마 (기본은 흰 무지) */
export const FREE_SHOW_DESIGNS: { id: ShowDesign; name: string }[] = [
  { id: 'plain', name: '흰 무지' },
  { id: 'poster', name: '포스터 입장권' },
];

export const SHOW_DESIGNS: ShowDesignItem[] = [
  { id: 'retro', ...RETRO_TICKET },
  { id: 'holo', name: '별빛 티켓', desc: '별이 뿌려진 밤하늘 종이에 칸칸이 적는 관람 기록 · 색 5가지', productId: 'recoco.theme.holo', price: 1000, kinds: ['show'] },
  { id: 'band', ...WRIST_BAND },
  { id: 'kpop', ...PHOTO_TICKET },
];

/** 상점에 한 줄로 보여줄 영수증 모양 (두 카테고리가 같이 쓰는 건 한 번만) */
export const DESIGN_SHELF: (ConcertDesignItem | ShowDesignItem)[] = [
  ...CONCERT_DESIGNS,
  ...SHOW_DESIGNS.filter((d) => !CONCERT_DESIGNS.some((c) => c.productId === d.productId)),
];

export const showDesignUnlocked = (id: ShowDesign | undefined, owned: string[]) => {
  const key = id === 'ticket' ? 'retro' : id; // 'ticket' 은 레트로의 예전 이름
  return !key || FREE_SHOW_DESIGNS.some((d) => d.id === key) || owned.includes(SHOW_DESIGNS.find((d) => d.id === key)?.productId ?? '');
};

/** 인생네컷 모양: 네컷 사진 그대로(무료) + 코코몬 카드(유료) */
export const FREE_FOURCUT_DESIGNS: { id: FourcutDesign; name: string }[] = [{ id: 'strip', name: '네컷 사진' }];

export interface FourcutDesignItem {
  id: Exclude<FourcutDesign, 'strip'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

export const FOURCUT_DESIGNS: FourcutDesignItem[] = [
  { id: 'card', name: '코코몬 카드', desc: '네컷 사진을 수집 카드로 · 등급은 뽑을 때 무작위 (C·B·A·S·SS·R 6등급)', productId: 'recoco.theme.cocomon', price: 1000 },
];

export const fourcutDesignUnlocked = (id: FourcutDesign | undefined, owned: string[]) =>
  !id || FREE_FOURCUT_DESIGNS.some((d) => d.id === id) || owned.includes(FOURCUT_DESIGNS.find((d) => d.id === id)?.productId ?? '');

/** 운동·음악의 무료 모양 (유료 테마는 아직 없다) */
export const FREE_EXERCISE_DESIGNS: { id: ExerciseDesign; name: string }[] = [
  { id: 'slip', name: '기록표' },
  { id: 'card', name: '기록 카드' },
];

export const FREE_MUSIC_DESIGNS: { id: MusicDesign; name: string }[] = [
  { id: 'album', name: '앨범 카드' },
  { id: 'list', name: '플레이리스트' },
];

/** 새 카테고리 (기본 5개는 무료) */
export const PAID_CATEGORIES: Partial<Record<RecordKind, { name: string; desc: string; icon: string; productId: string; price: number }>> = {
  gift: { name: '선물', desc: '받은·보낸 선물을 모바일 교환권처럼', icon: '🎁', productId: 'recoco.category.gift', price: 1500 },
  food: { name: '카페·맛집', desc: '메뉴마다 별점을 매기는 주문서 · 인쇄 색 4가지', icon: '☕', productId: 'recoco.category.food', price: 1500 },
  show: { name: '공연·전시', desc: '뮤지컬·연극·전시 · 흰 무지 티켓 · 포스터 입장권', icon: '🎫', productId: 'recoco.category.show', price: 1500 },
  concert: { name: '콘서트', desc: '밤하늘 티켓 · 흰 무지 티켓', icon: '🎤', productId: 'recoco.category.concert', price: 1500 },
  exercise: { name: '운동', desc: '러닝·헬스·요가·등산·수영 · 기록표와 기록 카드', icon: '🏋', productId: 'recoco.category.exercise', price: 1500 },
  music: { name: '음악', desc: '앨범 감상과 플레이리스트 · 앨범 카드와 영수증', icon: '🎧', productId: 'recoco.category.music', price: 1500 },
};

export const categoryUnlocked = (kind: RecordKind, owned: string[]) => {
  const paid = PAID_CATEGORIES[kind];
  return !paid || owned.includes(paid.productId);
};

export interface ShopState {
  owned: string[]; // 구매한 productId
  outfit: OutfitId | null; // 입고 있는 옷
}

export async function loadShop(): Promise<ShopState> {
  const [owned, outfit] = await Promise.all([AsyncStorage.getItem(OWNED_KEY), AsyncStorage.getItem(OUTFIT_KEY)]);
  return { owned: owned ? (JSON.parse(owned) as string[]) : [], outfit: (outfit as OutfitId | null) || null };
}

export const saveOwned = (owned: string[]) => AsyncStorage.setItem(OWNED_KEY, JSON.stringify(owned));
export const saveOutfit = (outfit: OutfitId | null) => (outfit ? AsyncStorage.setItem(OUTFIT_KEY, outfit) : AsyncStorage.removeItem(OUTFIT_KEY));

export function isUnlocked(item: OutfitItem, owned: string[], recordCount: number) {
  return item.unlock.type === 'reward' ? recordCount >= item.unlock.records : owned.includes(item.unlock.productId);
}

// ── 앱 전체가 같이 보는 구매·옷 상태 ──
let state: ShopState = { owned: [], outfit: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function initShop() {
  state = await loadShop();
  emit();
  // 스토어에 연결해 두면 끝나지 않은 거래·다른 기기에서 산 것이 알아서 들어온다
  if (canBuy) await startBilling(addOwned);
}

export function useShop() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function addOwned(productId: string) {
  if (state.owned.includes(productId)) return;
  state = { ...state, owned: [...state.owned, productId] };
  saveOwned(state.owned).catch(() => {});
  emit();
}

export function wearOutfit(outfit: OutfitId | null) {
  state = { ...state, outfit };
  saveOutfit(outfit).catch(() => {});
  emit();
}

/** 사고 나서 상태에 반영까지 */
export async function buy(productId: string) {
  addOwned(await purchase(productId));
}

export class PurchaseUnavailable extends Error {}

/** 스토어 결제. 성공하면 구매한 productId 를 돌려준다 */
export async function purchase(productId: string): Promise<string> {
  if (!canBuy) {
    if (__DEV__) return productId; // 웹 미리보기
    throw new PurchaseUnavailable(productId);
  }
  try {
    await buyProduct(productId);
    return productId;
  } catch (e) {
    if (e instanceof PurchaseCancelled) throw e;
    // 개발 중에는 스토어에 상품을 아직 안 올렸어도 눌러서 확인할 수 있게 열어준다.
    // (취소는 위에서 걸러내서, 취소했는데 해금되는 일은 없다)
    if (__DEV__) return productId;
    throw e;
  }
}

/** 구매 복원 (스토어 계정에 남은 구매 내역을 다시 불러오기) */
export async function restorePurchases(): Promise<string[]> {
  if (!canBuy) throw new PurchaseUnavailable('restore');
  const ids = await ownedProductIds();
  ids.forEach(addOwned);
  return ids;
}

export const purchaseErrorMessage = (e: unknown) =>
  e instanceof PurchaseCancelled
    ? ''
    : e instanceof PurchaseUnavailable
      ? '결제는 스토어 출시 버전에서 열려요.'
      : '결제를 완료하지 못했어요.';
