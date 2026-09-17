// 웹용: 이미지 캡처·앨범 저장은 앱(iOS/Android)에서만 지원한다.
// 실제 구현은 share.native.ts (웹에서 expo-media-library 를 불러오면 바로 오류가 나서 파일을 나눴다)
import type { RefObject } from 'react';
import type { View } from 'react-native';

export const canCapture = false;

export async function shareCard(_ref: RefObject<View | null>): Promise<void> {
  throw new Error('unsupported-on-web');
}

export async function saveCard(_ref: RefObject<View | null>): Promise<void> {
  throw new Error('unsupported-on-web');
}
