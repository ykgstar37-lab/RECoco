// 위젯 배경 맞추기 — iOS 는 위젯 밑에 판(기본 모양에서는 흰 판)을 꼭 깐다. 앱이 배경화면을 읽을 수는 없어서,
// 사용자가 찍어 준 빈 홈 화면 스크린샷에서 위젯 자리만큼 잘라 위젯 바탕에 깔면 투명한 것처럼 보인다.
//  - calib: 맞추는 동안 위젯을 하얀 판으로만 둔다 (스크린샷에서 위젯 자리를 찾으려고 — lib/widgetPanels.js)
//  - bg: 잘라 둔 바탕 그림 (위젯 공용 폴더의 파일 경로). 크기마다 하나 (같은 크기 위젯이 여럿이면 모두 같은 자리 그림)
// 화면은 components/WidgetBgSetup.tsx, 위젯에 넘기는 건 components/WidgetShots.ios.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export interface WidgetBg {
  small?: string;
  large?: string;
}

const KEY = 'recoco.widget.bg.v1';

let bg: WidgetBg = {};
let calib = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export async function initWidgetBg() {
  const raw = await AsyncStorage.getItem(KEY);
  bg = raw ? (JSON.parse(raw) as WidgetBg) : {};
  emit();
}

export function setWidgetBg(next: WidgetBg) {
  bg = next;
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  emit();
}

export function setWidgetCalib(on: boolean) {
  if (calib === on) return;
  calib = on;
  emit();
}

export const useWidgetBg = () => useSyncExternalStore(subscribe, () => bg);
export const useWidgetCalib = () => useSyncExternalStore(subscribe, () => calib);
