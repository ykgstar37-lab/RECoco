// 부분 유료화: 코코 옷(보상 해금/개별 구매) + 새 카테고리·영수증 테마(개별 구매, 예정)
// 실제 결제(App Store·Google Play)는 개발 빌드에서 붙인다. 지금은 개발 모드에서만 바로 구매 처리.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { OutfitId } from '../components/Outfits';
import type { ConcertDesign, FoodDesign, PaperTheme, RecordKind, ShowDesign } from '../types';

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
  { id: 'beanie', name: '비니', unlock: { type: 'reward', records: 10 } },
  { id: 'straw', name: '밀짚모자', unlock: { type: 'reward', records: 30 } },
  { id: 'beret', name: '베레모', unlock: { type: 'paid', productId: 'recoco.outfit.beret', price: 1000 } },
  { id: 'crown', name: '왕관', unlock: { type: 'paid', productId: 'recoco.outfit.crown', price: 1000 } },
  { id: 'party', name: '파티 고깔', unlock: { type: 'paid', productId: 'recoco.outfit.party', price: 1000 } },
  { id: 'headphones', name: '헤드폰', unlock: { type: 'paid', productId: 'recoco.outfit.headphones', price: 1000 } },
  { id: 'earflap', name: '귀도리 니트', unlock: { type: 'paid', productId: 'recoco.outfit.earflap', price: 1000 } },
  { id: 'trapper', name: '털 방한모', unlock: { type: 'paid', productId: 'recoco.outfit.trapper', price: 1000 } },
];

export interface ThemeItem {
  id: PaperTheme;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 영수증 테마: 하나 사면 소비 영수증과 인생네컷 뒷면 모두에 쓸 수 있다 */
export const THEMES: ThemeItem[] = [
  { id: 'plain', name: '흰 무지', desc: '깨끗한 흰 종이에 연한 회색 선', productId: 'recoco.theme.plain', price: 1000 },
  { id: 'grid', name: '모눈종이', desc: '연두빛 모눈이 깔린 노트 종이', productId: 'recoco.theme.grid', price: 1000 },
];

export const themeUnlocked = (id: PaperTheme | undefined, owned: string[]) =>
  !id || owned.includes(THEMES.find((t) => t.id === id)?.productId ?? '');

export interface FoodDesignItem {
  id: Exclude<FoodDesign, 'order'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 카페·맛집 영수증 모양 테마 (기본은 맛집 주문서) */
export const FREE_FOOD_DESIGNS: { id: FoodDesign; name: string }[] = [
  { id: 'order', name: '주문서' },
  { id: 'plain', name: '단색 주문서' },
];

export const FOOD_DESIGNS: FoodDesignItem[] = [
  { id: 'house', name: '집 모양', desc: '간판·창문 사진·칠판 메뉴가 있는 작은 가게 집', productId: 'recoco.theme.food-house', price: 1000 },
];

export const foodDesignUnlocked = (id: FoodDesign | undefined, owned: string[]) =>
  !id || FREE_FOOD_DESIGNS.some((d) => d.id === id) || owned.includes(FOOD_DESIGNS.find((d) => d.id === id)?.productId ?? '');

export interface ConcertDesignItem {
  id: Exclude<ConcertDesign, 'ticket'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 콘서트 영수증 모양 테마 (기본은 레트로 티켓) */
/** 카테고리를 사면 바로 쓰는 기본 모양 (무료) */
export const FREE_CONCERT_DESIGNS: { id: ConcertDesign; name: string }[] = [
  { id: 'ticket', name: '가로 티켓' },
  { id: 'retro', name: '레트로 티켓' },
];

export const CONCERT_DESIGNS: ConcertDesignItem[] = [
  { id: 'band', name: '스탠딩 팔찌', desc: '공연장에서 채워주는 손목 팔찌', productId: 'recoco.theme.concert-band', price: 1000 },
  { id: 'kpop', name: 'K-POP 포토 티켓', desc: '분홍 줄무늬에 사진이 큼직하게 박힌 티켓', productId: 'recoco.theme.concert-kpop', price: 1000 },
];

export const concertDesignUnlocked = (id: ConcertDesign | undefined, owned: string[]) =>
  !id || FREE_CONCERT_DESIGNS.some((d) => d.id === id) || owned.includes(CONCERT_DESIGNS.find((d) => d.id === id)?.productId ?? '');

export interface ShowDesignItem {
  id: Exclude<ShowDesign, 'ticket'>;
  name: string;
  desc: string;
  productId: string;
  price: number;
}

/** 공연·전시 영수증 모양 테마 (기본은 입장권) */
export const FREE_SHOW_DESIGNS: { id: ShowDesign; name: string }[] = [
  { id: 'ticket', name: '입장권' },
  { id: 'poster', name: '포스터 입장권' },
];

export const SHOW_DESIGNS: ShowDesignItem[] = [
  { id: 'holo', name: '홀로그램 기록표', desc: '파란 홀로그램 종이에 칸칸이 적는 관람 기록표', productId: 'recoco.theme.show-holo', price: 1000 },
];

export const showDesignUnlocked = (id: ShowDesign | undefined, owned: string[]) =>
  !id || FREE_SHOW_DESIGNS.some((d) => d.id === id) || owned.includes(SHOW_DESIGNS.find((d) => d.id === id)?.productId ?? '');

/** 새 카테고리 (기본 5개는 무료) */
export const PAID_CATEGORIES: Partial<Record<RecordKind, { name: string; desc: string; icon: string; productId: string; price: number }>> = {
  gift: { name: '선물', desc: '받은·보낸 선물을 모바일 교환권처럼', icon: '🎁', productId: 'recoco.category.gift', price: 1500 },
  food: { name: '카페·맛집', desc: '메뉴마다 별점을 매기는 주문서 · 단색 2가지', icon: '☕', productId: 'recoco.category.food', price: 1500 },
  show: { name: '공연·전시', desc: '뮤지컬·연극·전시 · 입장권 모양 2가지', icon: '🎫', productId: 'recoco.category.show', price: 1500 },
  concert: { name: '콘서트', desc: '가로 공연 티켓 · 레트로 티켓 2가지', icon: '🎤', productId: 'recoco.category.concert', price: 1500 },
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
  if (__DEV__) return productId;
  // TODO: 개발 빌드에서 스토어 결제 연결 (RevenueCat 또는 expo-iap)
  throw new PurchaseUnavailable(productId);
}

/** 구매 복원 (스토어 계정에 남은 구매 내역을 다시 불러오기) */
export async function restorePurchases(): Promise<string[]> {
  // TODO: 스토어 결제 연결 시 구현
  throw new PurchaseUnavailable('restore');
}

export const purchaseErrorMessage = (e: unknown) =>
  e instanceof PurchaseUnavailable ? '결제는 스토어 출시 버전에서 열려요.' : '결제를 완료하지 못했어요.';
