// 홈 화면 위젯에 '고른 기록' 으로 띄울 기록 id. 크게 보기의 '위젯에 넣기' 로 넣고 뺀다.
// 그림을 굽고 위젯에 넘기는 건 components/WidgetShots.ios.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { KIND_LABEL } from '../templates';
import type { RecoRecord } from '../types';

/** 위젯은 iOS 만 (expo-widgets). 위젯 모듈이 든 새 빌드에서만 — OTA 로 코드만 받은 옛 빌드에서는 버튼도 숨긴다 */
export const widgetsAvailable = Platform.OS === 'ios' && !!requireOptionalNativeModule('ExpoWidgets');

const KEY = 'recoco.widget.picked.v1';
/** 위젯 편집 목록에 뜨는 이름 (넣을 때 직접 붙인다) */
const NAMES_KEY = 'recoco.widget.names.v1';
/** 너무 많으면 굽는 데 오래 걸리고 공용 폴더도 커진다 */
export const MAX_PICKS = 30;

let picks: string[] = [];
let names: Record<string, string> = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function initWidgetPicks() {
  const raw = await AsyncStorage.getItem(KEY);
  picks = raw ? (JSON.parse(raw) as string[]) : [];
  const rawNames = await AsyncStorage.getItem(NAMES_KEY);
  names = rawNames ? (JSON.parse(rawNames) as Record<string, string>) : {};
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

export function useWidgetPickNames() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => names,
  );
}

/** 이름을 안 붙였을 때 — '10.27 인생네컷 · 제목' */
export function defaultPickName(r: RecoRecord) {
  const o = r as unknown as Record<string, unknown>;
  const name = ['title', 'place', 'store'].map((k) => o[k]).find((v): v is string => typeof v === 'string' && !!v.trim());
  return `${r.date.slice(5).replace('-', '.')} ${KIND_LABEL[r.kind]}${name ? ` · ${name.trim()}` : ''}`;
}

export function setPickName(id: string, name: string) {
  names = { ...names, [id]: name };
  AsyncStorage.setItem(NAMES_KEY, JSON.stringify(names)).catch(() => {});
  emit();
}

// 위젯 그림 굽기·넘기기가 어디까지 됐는지 (크게 보기의 ＋ 를 길게 누르면 보인다 — 기기에서 위젯이 빌 때 원인 찾기용)
let status = '아직 위젯에 넘긴 적 없어요';
export const setWidgetStatus = (s: string) => {
  status = s;
};
export const widgetStatus = () => status;

/** 넣었으면 빼고, 없으면 맨 뒤에 넣는다. 꽉 찼으면 false */
export function togglePick(id: string): boolean {
  if (picks.includes(id)) {
    picks = picks.filter((p) => p !== id);
    if (names[id]) {
      const { [id]: _, ...rest } = names;
      names = rest;
      AsyncStorage.setItem(NAMES_KEY, JSON.stringify(names)).catch(() => {});
    }
  }
  else if (picks.length >= MAX_PICKS) return false;
  else picks = [...picks, id];
  AsyncStorage.setItem(KEY, JSON.stringify(picks)).catch(() => {});
  emit();
  return true;
}
