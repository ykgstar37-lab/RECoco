// 홈 화면 위젯에 '고른 기록' 으로 띄울 기록 id. 크게 보기의 '위젯에 넣기' 로 넣고 뺀다.
// 그림을 굽고 위젯에 넘기는 건 components/WidgetShots.ios.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/** 위젯은 iOS 만 (expo-widgets) */
export const widgetsAvailable = Platform.OS === 'ios';

const KEY = 'recoco.widget.picked.v1';
/** 너무 많으면 굽는 데 오래 걸리고 공용 폴더도 커진다 */
export const MAX_PICKS = 30;

let picks: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function initWidgetPicks() {
  const raw = await AsyncStorage.getItem(KEY);
  picks = raw ? (JSON.parse(raw) as string[]) : [];
  emit();
}

export function useWidgetPicks() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => picks,
  );
}

/** 넣었으면 빼고, 없으면 맨 뒤에 넣는다. 꽉 찼으면 false */
export function togglePick(id: string): boolean {
  if (picks.includes(id)) picks = picks.filter((p) => p !== id);
  else if (picks.length >= MAX_PICKS) return false;
  else picks = [...picks, id];
  AsyncStorage.setItem(KEY, JSON.stringify(picks)).catch(() => {});
  emit();
  return true;
}
