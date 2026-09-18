// 스토어 결제 (App Store · Google Play). expo-iap 을 감싸서 shop.ts 가 쓰기 좋은 모양으로만 내놓는다.
// 레코코 상품은 전부 비소모성 1회 구매라 소비(consume)하지 않고 확인만 한다 → "뭘 샀나"는 스토어가 기억한다.
import {
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'expo-iap';

export const canBuy = true;

/** 결제창을 띄웠다가 사용자가 취소함 (개발 중 자동 해금에서 빼려고 구분한다) */
export class PurchaseCancelled extends Error {}

type Owned = (productId: string) => void;

let connected = false;
let notify: Owned = () => {};
// 한 번에 한 개만 사게 되어 있어서(상점 버튼이 잠김) 기다리는 것도 하나면 된다
let pending: { productId: string; ok: () => void; fail: (e: Error) => void } | null = null;

/** 기다리던 구매를 끝낸다 (productId 를 주면 그것과 맞을 때만) */
const settle = (fn: (p: NonNullable<typeof pending>) => void, productId?: string) => {
  const p = pending;
  if (!p || (productId !== undefined && p.productId !== productId)) return;
  pending = null;
  fn(p);
};

/** 산 것을 넘겨받고(새 구매·복원·다른 기기에서 산 것) 스토어에 연결한다 */
export async function startBilling(onOwned: Owned) {
  notify = onOwned;
  if (connected) return;
  await initConnection();
  connected = true;

  purchaseUpdatedListener(async (purchase: Purchase) => {
    // 확인(acknowledge)을 안 하면 iOS 는 켤 때마다 다시 들고 오고 안드로이드는 3일 뒤 자동 환불한다
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {
      // 이미 확인된 거래면 그냥 넘어간다
    }
    notify(purchase.productId);
    settle((p) => p.ok(), purchase.productId);
  });

  purchaseErrorListener((e) => {
    settle((p) => p.fail(isUserCancelledError(e) ? new PurchaseCancelled(p.productId) : new Error(e.message)));
  });
}

/** 결제창을 띄우고 살 때까지 기다린다 (취소하면 PurchaseCancelled) */
export function buyProduct(productId: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!connected) return reject(new Error('스토어에 연결되지 않았어요.'));
    pending = { productId, ok: resolve, fail: reject };
    requestPurchase({ type: 'in-app', request: { apple: { sku: productId }, google: { skus: [productId] } } }).catch((e: unknown) => {
      settle((p) => p.fail(e instanceof Error ? e : new Error(String(e))));
    });
  });
}

/** 이 스토어 계정이 갖고 있는 상품 (구매 복원) */
export async function ownedProductIds(): Promise<string[]> {
  const purchases = await getAvailablePurchases();
  for (const purchase of purchases) {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {
      // 이미 확인된 거래
    }
  }
  return [...new Set(purchases.map((p) => p.productId))];
}
