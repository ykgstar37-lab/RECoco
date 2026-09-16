import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

export const tick = () => {
  if (enabled) Haptics.selectionAsync().catch(() => {});
};

export const bump = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (enabled) Haptics.impactAsync(style).catch(() => {});
};

export const tear = () => bump(Haptics.ImpactFeedbackStyle.Heavy);
