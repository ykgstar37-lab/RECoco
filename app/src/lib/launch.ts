// 유료화 스위치. 여기 두 값만 바꾸면 앱 전체의 잠금이 따라 바뀐다.
//
// v1.0: FREE_FOR_ALL = true → 카테고리·테마가 전부 열린 채로 무료.
// 유료화하는 업데이트에서:
//   FREE_FOR_ALL = false
//   PAID_SINCE  = '유료화 판이 나가는 날 (YYYY-MM-DD)'
// 로 바꾸면, 그날보다 **먼저 처음 연 사람**(lib/since.ts 의 첫 실행 날짜)은 계속 전부 열리고
// 그 뒤에 새로 깐 사람부터 상점에서 산다. 빼앗는 모양이 되면 안 된다 (확정 결정).
//
// ⚠️ 첫 실행 날짜는 폰 안에만 있다 → 앱을 지웠다 다시 깔면 새 사용자로 보인다.
// iOS 는 유료화 때 StoreKit 의 AppTransaction.originalAppVersion(처음 받은 앱 버전, 애플 계정에 남는다)으로
// 한 번 더 확인하면 재설치·기기 변경에도 안전하다 (docs 참고, 아직 미구현).

/** 지금은 모두에게 전부 무료 */
export const FREE_FOR_ALL = true;

/** 유료화가 시작된 날. 이 날보다 먼저 처음 연 사람은 계속 전부 무료 (유료화 전에는 null) */
export const PAID_SINCE: string | null = null;

/** 첫 실행 날짜로 이 사람에게 전부 열어줄지 */
export function opensAll(since: string | null) {
  if (FREE_FOR_ALL) return true;
  return !!since && !!PAID_SINCE && since < PAID_SINCE;
}
