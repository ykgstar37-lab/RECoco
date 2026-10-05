// 웹 미리보기에는 공유 확장이 없다 (shareIntent.native.ts 가 진짜)
export interface SharedImage {
  uri: string;
  width: number;
  height: number;
}

export function useSharedImage(): { image: SharedImage | null; reset: () => void } {
  return { image: null, reset: () => {} };
}
