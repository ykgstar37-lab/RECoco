import AsyncStorage from '@react-native-async-storage/async-storage';

import { RecoRecord } from '../types';
import { SAMPLE_RECORDS } from './samples';

const KEY = 'recoco.records.v1';
const SEEDED_KEY = 'recoco.seeded.v1';

export async function loadRecords(): Promise<RecoRecord[]> {
  const [raw, seeded] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(SEEDED_KEY)]);
  if (raw) return JSON.parse(raw) as RecoRecord[];
  if (seeded) return [];
  // 첫 실행: 롤이 비어 보이지 않도록 예시 기록을 넣어둔다
  await Promise.all([saveRecords(SAMPLE_RECORDS), AsyncStorage.setItem(SEEDED_KEY, '1')]);
  return SAMPLE_RECORDS;
}

export function saveRecords(records: RecoRecord[]) {
  return AsyncStorage.setItem(KEY, JSON.stringify(records));
}
