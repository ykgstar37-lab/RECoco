import AsyncStorage from '@react-native-async-storage/async-storage';

import { RecoRecord } from '../types';
import { relinkPhotos } from './photos';
import { retryOnce } from './retry';
import { SAMPLE_RECORDS } from './samples';

const KEY = 'recoco.records.v1';
const SEEDED_KEY = 'recoco.seeded.v1';

export async function loadRecords(): Promise<RecoRecord[]> {
  const [raw, seeded] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(SEEDED_KEY)]);
  // 업데이트로 앱 폴더 경로가 바뀌었을 수 있어서 사진 경로를 지금 폴더로 다시 잇는다
  if (raw) return relinkPhotos(JSON.parse(raw) as RecoRecord[]);
  if (seeded) return [];
  // 첫 실행: 롤이 비어 보이지 않도록 예시 기록을 넣어둔다
  await Promise.all([saveRecords(SAMPLE_RECORDS), AsyncStorage.setItem(SEEDED_KEY, '1')]);
  return SAMPLE_RECORDS;
}

/**
 * 기록은 폰 안이 유일한 원본이다 — 저장에 실패하면 되돌릴 방법이 없다.
 * 그래서 한 번 더 해보고, 그래도 안 되면 **던진다.** 부르는 쪽이 사용자에게 알려야 한다.
 * (조용히 삼키면 화면에는 영수증이 보이는데 앱을 껐다 켜면 사라진다)
 */
export async function saveRecords(records: RecoRecord[]) {
  const body = JSON.stringify(records);
  await retryOnce(() => AsyncStorage.setItem(KEY, body));
}
