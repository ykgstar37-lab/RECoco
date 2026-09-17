import type { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 전체 화면 Modal 안의 안전 영역.
 * iOS에서는 Modal 안의 SafeAreaView 가 윗여백을 0으로 잡는 경우가 있어서(✕ 버튼이 시계와 겹침),
 * 앱 최상단 SafeAreaProvider 가 알고 있는 값으로 직접 띄운다.
 */
export function ModalSafeArea({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[style, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>{children}</View>;
}
