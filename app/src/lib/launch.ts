// 유료화 스위치. 여기 값만 바꾸면 앱 전체의 잠금이 따라 바뀐다.
//
// v1.0: FREE_FOR_ALL = true → 카테고리·테마를 전부 무료로 **받을 수 있다** (상점에서 하나씩 '무료로 받기', 저절로 열리지는 않는다).
// 유료화하는 업데이트에서:
//   FREE_FOR_ALL    = false
//   PAID_SINCE      = '유료화 판이 나가는 날 (YYYY-MM-DD)'
//   PAID_FROM_BUILD = 유료화 판의 iOS 빌드 번호 (App Store Connect 의 빌드 번호, 예: 14)
//   FREE_ERA_PRODUCTS = 무료판에 있던 상품 ID 전부 (그때 상점에 있던 카테고리·테마)
// 로 바꾸면 무료판부터 쓰던 사람은 **그때 있던 것만** 계속 무료로 받고, 그 뒤에 새로 받은 사람부터 상점에서 산다.
// 유료화 뒤에 새로 추가되는 상품은 무료판 사용자도 산다 (2026-10-29 사용자 확정).
// 이미 받은 것은 빼앗지 않는다 (확정 결정) — 받은 건 claimed 에 남아 계속 쓴다.
// 무료판 상품을 날짜가 아니라 목록으로 두는 건, 재설치하면 claimed 가 지워져도 다시 받을 수 있게.
// 목록에 빠진 상품은 유료로 잡힌다 (새 상품을 실수로 공짜로 푸는 쪽보다 안전).
//
// 무료판 사용자인지는 두 가지로 본다 (하나만 맞아도 연다):
//  1. iOS: 애플 계정이 처음 받은 빌드 번호 < PAID_FROM_BUILD  (lib/appTransaction — 재설치·기기 변경에도 남는다)
//  2. 폰에 적힌 첫 실행 날짜 < PAID_SINCE                      (lib/since — 안드로이드는 이것뿐)

/** 지금은 모두 무료로 받을 수 있다 */
export const FREE_FOR_ALL = true;

/** 유료화가 시작된 날. 이 날보다 먼저 처음 연 사람은 계속 전부 무료 (유료화 전에는 null) */
export const PAID_SINCE: string | null = null;

/** 유료화 판의 iOS 빌드 번호. 이보다 작은 빌드로 처음 받은 사람은 계속 전부 무료 (유료화 전에는 null) */
export const PAID_FROM_BUILD: number | null = null;

/** 무료판에 있던 상품 ID. 무료판 사용자는 이것만 계속 무료로 받는다 (유료화 전에는 null) */
export const FREE_ERA_PRODUCTS: string[] | null = null;

/** 코코몬 카드 등급을 기록할 때 직접 고를 수 있게 (스토어 미리보기 캡처용). 다 찍으면 false 로 — 원래는 뽑을 때 무작위 */
export const PICK_COCOMON_RANK = false;

/** 이 사람이 돈 없이 받을 수 있는지 */
export function opensAll(since: string | null, firstBuild: number | null) {
  if (FREE_FOR_ALL) return true;
  if (firstBuild !== null && PAID_FROM_BUILD !== null && firstBuild < PAID_FROM_BUILD) return true;
  return !!since && !!PAID_SINCE && since < PAID_SINCE;
}

/** 이 상품을 돈 없이 받을 수 있는지. early = opensAll 결과 (무료판부터 쓰던 사람) */
export function freeFor(early: boolean, productId: string | undefined) {
  if (!early || !productId) return false;
  return FREE_FOR_ALL || (FREE_ERA_PRODUCTS ?? []).includes(productId);
}
