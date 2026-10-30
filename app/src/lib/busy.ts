// 몇 초 걸리는 일(사진 넣기 등)을 하는 동안 화면을 흐리게 덮고 도는 표시를 띄운다 — components/Loading.tsx 의 LoadingOverlay
import { useSyncExternalStore } from 'react';

let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** job 이 끝날 때까지 기다리는 중 표시 (겹쳐 불러도 다 끝나야 사라진다) */
export async function withBusy<T>(job: () => Promise<T>): Promise<T> {
  count += 1;
  emit();
  try {
    return await job();
  } finally {
    count -= 1;
    emit();
  }
}

export function useBusy() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => count > 0,
  );
}
