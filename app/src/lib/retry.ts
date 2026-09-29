/**
 * 한 번 더 해보고, 그래도 안 되면 던진다.
 * 잠깐 스친 실패(저장이 몰렸을 때 등)는 넘기고, 진짜 실패는 부르는 쪽에 알리려는 것.
 */
export async function retryOnce<T>(run: () => Promise<T>, waitMs = 300): Promise<T> {
  try {
    return await run();
  } catch {
    await new Promise((r) => setTimeout(r, waitMs));
    return run();
  }
}
