import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const KEY = 'recoco.haptics.v1';
const supported = Platform.OS !== 'web';
let on = true;

/** 설정에서 끈 값을 앱 시작 때 불러온다 */
export async function loadHaptics() {
  on = (await AsyncStorage.getItem(KEY)) !== 'off';
  return on;
}

export function setHaptics(next: boolean) {
  on = next;
  AsyncStorage.setItem(KEY, next ? 'on' : 'off').catch(() => {});
}

const enabled = () => supported && on;

export const tick = () => {
  if (enabled()) Haptics.selectionAsync().catch(() => {});
};

export const bump = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (enabled()) Haptics.impactAsync(style).catch(() => {});
};

export const tear = () => bump(Haptics.ImpactFeedbackStyle.Heavy);
