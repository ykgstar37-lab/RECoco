// 다른 앱(사진첩·인스타 등)에서 "공유 → 레코코" 로 보낸 사진을 받는다.
// 공유 확장은 네이티브 코드라 개발 빌드에서만 돈다. Expo Go 에서는 꺼 둔다 (켜면 바로 죽는다).
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useShareIntent } from 'expo-share-intent';

export interface SharedImage {
  uri: string;
  width: number;
  height: number;
}

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** 공유로 들어온 사진 한 장 (없으면 null). 다 쓰면 reset 을 불러 비운다 */
export function useSharedImage(): { image: SharedImage | null; reset: () => void } {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({ disabled: inExpoGo, resetOnBackground: true });
  const file = hasShareIntent ? shareIntent.files?.find((f) => f.mimeType?.startsWith('image/')) : undefined;
  const image = file ? { uri: file.path.startsWith('file:') ? file.path : `file://${file.path}`, width: file.width ?? 0, height: file.height ?? 0 } : null;
  return { image, reset: resetShareIntent };
}
