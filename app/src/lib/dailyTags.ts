// 일상 카테고리의 소분류 (연애·친구·내 강아지 …). 사용자가 직접 만들고 지운다.
// 서버가 없으니 폰 안(AsyncStorage)에만 둔다. 기록에는 이름(글자)만 저장해서,
// 소분류를 목록에서 지워도 이미 붙인 기록의 이름은 그대로 남는다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const KEY = 'recoco.dailyTags.v1';

/** 처음 열었을 때 깔려 있는 소분류 (예시 하나만. 나머지는 사용자가 만든다) */
export const DEFAULT_DAILY_TAGS = ['친구'];

export const MAX_TAG_LENGTH = 10;

let tags: string[] = DEFAULT_DAILY_TAGS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(tags)).catch(() => {});

export async function initDailyTags() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) tags = JSON.parse(raw) as string[];
  } catch {
    // 못 읽으면 기본 소분류로 둔다
  }
  emit();
}

export function useDailyTags() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => tags,
  );
}

/** 새 소분류. 이미 있으면 그대로 두고 그 이름을 돌려준다 */
export function addDailyTag(name: string) {
  const t = name.trim().slice(0, MAX_TAG_LENGTH);
  if (!t) return '';
  if (!tags.includes(t)) {
    tags = [...tags, t];
    save();
    emit();
  }
  return t;
}

export function removeDailyTag(name: string) {
  tags = tags.filter((t) => t !== name);
  save();
  emit();
}
