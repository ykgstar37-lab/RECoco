// 일상 카테고리의 소분류 (연애·친구·내 강아지 …). 사용자가 직접 만들고 지운다.
// 서버가 없으니 폰 안(AsyncStorage)에만 둔다. 기록에는 이름(글자)만 저장해서,
// 소분류를 목록에서 지워도 이미 붙인 기록의 이름은 그대로 남는다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { seededRandom } from './format';

const KEY = 'recoco.dailyTags.v1';
const COLOR_KEY = 'recoco.dailyTagColors.v1';

/** 소분류 색 8가지. 고른 색이 없으면 이름으로 정해진다 (tagColorOf) */
export const TAG_COLORS = ['#f08fac', '#f5a25d', '#6fbf8e', '#6fa3e0', '#b48ce0', '#e9b93c', '#5fb8b8', '#e07a6f'];

/** 처음 열었을 때 깔려 있는 소분류 (예시 하나만. 나머지는 사용자가 만든다) */
export const DEFAULT_DAILY_TAGS = ['친구'];

export const MAX_TAG_LENGTH = 10;

let tags: string[] = DEFAULT_DAILY_TAGS;
/** 사용자가 고른 소분류 색. 목록에서 지워도 남겨서 이미 붙인 기록은 같은 색을 쓴다 */
let colors: Record<string, string> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const save = () => AsyncStorage.setItem(KEY, JSON.stringify(tags)).catch(() => {});
const saveColors = () => AsyncStorage.setItem(COLOR_KEY, JSON.stringify(colors)).catch(() => {});

export async function initDailyTags() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) tags = JSON.parse(raw) as string[];
    const rawColors = await AsyncStorage.getItem(COLOR_KEY);
    if (rawColors) colors = JSON.parse(rawColors) as Record<string, string>;
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

/** 색이 바뀌면 다시 그리도록 (칩·필터용) */
export function useDailyTagColors() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => colors,
  );
}

/** 고른 색 → 없으면 이름으로 정해지는 색 */
export function tagColorOf(tag: string) {
  const t = tag.trim();
  if (!t) return '#b9b2a6';
  return colors[t] ?? TAG_COLORS[Math.floor(seededRandom(`tag-${t}`)() * TAG_COLORS.length)];
}

export function setDailyTagColor(name: string, color: string) {
  colors = { ...colors, [name.trim()]: color };
  saveColors();
  emit();
}

/** 새 소분류. 이미 있으면 그대로 두고 그 이름을 돌려준다 */
export function addDailyTag(name: string) {
  const t = name.trim().slice(0, MAX_TAG_LENGTH);
  if (!t) return '';
  if (!tags.includes(t)) {
    // 새로 만든 건 아직 안 쓰인 색부터 (이름으로 정하면 겹치기 쉬워서)
    if (!colors[t]) {
      const used = new Set(tags.map(tagColorOf));
      colors = { ...colors, [t]: TAG_COLORS.find((c) => !used.has(c)) ?? TAG_COLORS[tags.length % TAG_COLORS.length] };
      saveColors();
    }
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
