// 부분 유료화: 코코 옷(보상 해금/개별 구매) + 새 카테고리(개별 구매) + 전부 묶음
// 실제 결제(App Store·Google Play)는 개발 빌드에서 붙인다. 지금은 개발 모드에서만 바로 구매 처리.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OutfitId } from '../components/Outfits';

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
];

/** 옷과 앞으로 나올 새 카테고리까지 전부 */
export const BUNDLE = { productId: 'recoco.bundle.all', price: 4400 };

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
  if (owned.includes(BUNDLE.productId)) return true;
  return item.unlock.type === 'reward' ? recordCount >= item.unlock.records : owned.includes(item.unlock.productId);
}

export class PurchaseUnavailable extends Error {}

/** 스토어 결제. 성공하면 구매한 productId 를 돌려준다 */
export async function purchase(productId: string): Promise<string> {
  if (__DEV__) return productId;
  // TODO: 개발 빌드에서 스토어 결제 연결 (RevenueCat 또는 expo-iap)
  throw new PurchaseUnavailable(productId);
}
