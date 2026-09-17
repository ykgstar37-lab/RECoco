// 부분 유료화: 코코 옷(보상 해금/개별 구매) + 새 카테고리·영수증 테마(개별 구매, 예정)
// 실제 결제(App Store·Google Play)는 개발 빌드에서 붙인다. 지금은 개발 모드에서만 바로 구매 처리.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { OutfitId } from '../components/Outfits';
import type { PaperTheme } from '../types';

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
