// 유료화 스위치. 여기 값만 바꾸면 앱 전체의 잠금이 따라 바뀐다.
//
// v1.0: FREE_FOR_ALL = true → 카테고리·테마가 전부 열린 채로 무료.
// 유료화하는 업데이트에서:
//   FREE_FOR_ALL    = false
//   PAID_SINCE      = '유료화 판이 나가는 날 (YYYY-MM-DD)'
//   PAID_FROM_BUILD = 유료화 판의 iOS 빌드 번호 (App Store Connect 의 빌드 번호, 예: 14)
// 로 바꾸면 무료판부터 쓰던 사람은 계속 전부 열리고, 그 뒤에 새로 받은 사람부터 상점에서 산다.
// 빼앗는 모양이 되면 안 된다 (확정 결정).
//
// 무료판 사용자인지는 두 가지로 본다 (하나만 맞아도 연다):
//  1. iOS: 애플 계정이 처음 받은 빌드 번호 < PAID_FROM_BUILD  (lib/appTransaction — 재설치·기기 변경에도 남는다)
//  2. 폰에 적힌 첫 실행 날짜 < PAID_SINCE                      (lib/since — 안드로이드는 이것뿐)

/** 지금은 모두에게 전부 무료 */
export const FREE_FOR_ALL = true;

/** 유료화가 시작된 날. 이 날보다 먼저 처음 연 사람은 계속 전부 무료 (유료화 전에는 null) */
export const PAID_SINCE: string | null = null;

/** 유료화 판의 iOS 빌드 번호. 이보다 작은 빌드로 처음 받은 사람은 계속 전부 무료 (유료화 전에는 null) */
export const PAID_FROM_BUILD: number | null = null;

/** 이 사람에게 전부 열어줄지 */
export function opensAll(since: string | null, firstBuild: number | null) {
  if (FREE_FOR_ALL) return true;
  if (firstBuild !== null && PAID_FROM_BUILD !== null && firstBuild < PAID_FROM_BUILD) return true;
  return !!since && !!PAID_SINCE && since < PAID_SINCE;
}
