// 언제부터 쓴 사람인지 기록해 둔다.
//
// v1.0 은 모든 카테고리·테마·코코 옷을 연 채로 **무료**로 낸다. 나중에 사용자가 늘면
// 유료화하되 "그 전부터 쓰던 분은 계속 무료" 로 갈라야 한다 (빼앗는 모양이 되면 안 된다).
// 서버도 로그인도 없으므로 그 근거는 기기에 적힌 이 날짜 하나뿐이다.
//
// ⚠️ v1.0 이 이 값을 안 심어두면 나중에는 초기 사용자를 영영 가려낼 수 없다.
// 키 이름을 바꾸거나 지우지 말 것. 백업에도 넣지 않는다 (백업을 옮겨 날짜를 앞당기는 걸 막는다).
import AsyncStorage from '@react-native-async-storage/async-storage';

const SINCE_KEY = 'recoco.since.v1';

/** 앱을 처음 연 날 (YYYY-MM-DD). 이미 있으면 그대로 둔다 */
export async function markFirstRun(): Promise<string> {
  const saved = await AsyncStorage.getItem(SINCE_KEY);
  if (saved) return saved;
  const today = new Date().toISOString().slice(0, 10);
  await AsyncStorage.setItem(SINCE_KEY, today);
  return today;
}

/** 아직 한 번도 안 열었으면 null */
export const loadSince = () => AsyncStorage.getItem(SINCE_KEY);

/**
 * 유료화 이전부터 쓰던 사람인지. 유료화하는 판에서 이 날짜를 정하고,
 * 그날보다 먼저 시작한 사람에게는 잠긴 것 없이 그대로 열어준다.
 */
export async function startedBefore(date: string): Promise<boolean> {
  const since = await loadSince();
  return !!since && since < date;
}
