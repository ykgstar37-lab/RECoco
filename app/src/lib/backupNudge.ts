// 백업 권하기: 기록은 폰 안이 유일한 원본이라 앱을 지우면 같이 사라진다.
// 영수증이 10장을 넘으면 홈의 코코가 "백업 파일 만들어 둘까?" 하고 묻는다 ([백업하기] [30일 뒤에]).
// 한 번 물으면(답을 안 해도) 30일, 백업하면 그날부터 30일 동안은 묻지 않는다.
// 10·30·50·100장을 넘긴 뒤 처음 묻는 거면 장수를 넣어 말한다.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { canBackup } from './backup';

const LAST_BACKUP_KEY = 'recoco.backup.lastAt';
const LAST_ASK_KEY = 'recoco.backup.askedAt';
const MILESTONE_KEY = 'recoco.backup.milestone';

const MILESTONES = [10, 30, 50, 100];
const MONTH = 30 * 86400000;

const longAgo = (iso: string | null) => !iso || Date.now() - new Date(iso).getTime() > MONTH;

/** 백업 파일을 만든 날 (없으면 null) */
export const loadLastBackup = () => AsyncStorage.getItem(LAST_BACKUP_KEY);

export async function markBackedUp() {
  await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

/** 지금 물어볼 대사. 물어볼 때가 아니면 null (물어보면 그 자리에서 날짜를 적어 30일 동안 다시 묻지 않는다) */
export async function backupAsk(count: number): Promise<string | null> {
  if (!canBackup || count < MILESTONES[0]) return null;
  const [lastBackup, lastAsk, milestone] = (await AsyncStorage.multiGet([LAST_BACKUP_KEY, LAST_ASK_KEY, MILESTONE_KEY])).map(([, v]) => v);
  if (!longAgo(lastBackup) || !longAgo(lastAsk)) return null;

  const reached = [...MILESTONES].reverse().find((m) => m <= count && m > Number(milestone ?? 0));
  const text = reached
    ? `영수증이 ${reached}장이나 모였어!\n백업 파일 만들어 둘까?`
    : lastBackup
      ? '백업한 지 한 달 지났어!\n새로 하나 만들어 둘까?'
      : '앱을 지우면 기록도 사라져\n백업 파일 만들어 둘까?';

  const pairs: [string, string][] = [[LAST_ASK_KEY, new Date().toISOString()]];
  if (reached) pairs.push([MILESTONE_KEY, String(reached)]);
  await AsyncStorage.multiSet(pairs);
  return text;
}
