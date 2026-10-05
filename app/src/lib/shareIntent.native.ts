// 다른 앱(사진첩·인스타 등)에서 "공유 → 레코코" 로 보낸 사진을 받는다.
// 공유 확장은 네이티브 코드라 개발 빌드에서만 돈다. Expo Go 에서는 꺼 둔다 (켜면 바로 죽는다).
//
// ⚠️ 공유 확장(expo-share-intent → ExpoLinking)을 넣기 **전에** 만든 빌드에는 그 네이티브 모듈이 없다.
// 그대로 import 하면 앱이 켜지자마자 "Cannot find native module 'ExpoLinking'" 로 죽으므로,
// 불러오다 실패하면 공유 기능만 끄고 나머지는 그대로 돌게 한다 (2026-10-06 실제로 겪음).
import Constants, { ExecutionEnvironment } from 'expo-constants';

export interface SharedImage {
  uri: string;
  width: number;
  height: number;
}

type ShareHook = typeof import('expo-share-intent').useShareIntent;

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** 네이티브 모듈이 없는 빌드면 null */
const useShareIntentSafe: ShareHook | null = (() => {
  if (inExpoGo) return null;
  try {
    return (require('expo-share-intent') as typeof import('expo-share-intent')).useShareIntent;
  } catch {
    return null;
  }
})();

/** 공유로 들어온 사진 한 장 (없으면 null). 다 쓰면 reset 을 불러 비운다 */
export function useSharedImage(): { image: SharedImage | null; reset: () => void } {
  if (!useShareIntentSafe) return { image: null, reset: () => {} };
  // 빌드마다 위의 값이 고정이라 훅 호출 순서는 바뀌지 않는다
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentSafe({ resetOnBackground: true });
  const file = hasShareIntent ? shareIntent.files?.find((f) => f.mimeType?.startsWith('image/')) : undefined;
  const image = file ? { uri: file.path.startsWith('file:') ? file.path : `file://${file.path}`, width: file.width ?? 0, height: file.height ?? 0 } : null;
  return { image, reset: resetShareIntent };
}
