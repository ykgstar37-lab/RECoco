// 웹: 스토어 결제는 없음 (폰 전용, billing.native.ts)

export const canBuy = false;

export class PurchaseCancelled extends Error {}

export async function startBilling(_onOwned: (productId: string) => void) {}

export async function buyProduct(_productId: string): Promise<void> {
  throw new Error('웹에서는 결제할 수 없어요.');
}

export async function ownedProductIds(): Promise<string[]> {
  return [];
}
