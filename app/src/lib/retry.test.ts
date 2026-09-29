import assert from 'node:assert/strict';
import { test } from 'node:test';

import { retryOnce } from './retry.ts';

test('한 번에 되면 그대로 돌려준다', async () => {
  let calls = 0;
  const out = await retryOnce(async () => {
    calls += 1;
    return '됐다';
  });
  assert.equal(out, '됐다');
  assert.equal(calls, 1);
});

test('처음 실패하면 한 번 더 해보고, 되면 성공이다', async () => {
  let calls = 0;
  const out = await retryOnce(async () => {
    calls += 1;
    if (calls === 1) throw new Error('잠깐 실패');
    return '두 번째에 됐다';
  }, 0);
  assert.equal(out, '두 번째에 됐다');
  assert.equal(calls, 2);
});

test('두 번 다 실패하면 던진다 — 조용히 삼키지 않는다', async () => {
  let calls = 0;
  await assert.rejects(
    retryOnce(async () => {
      calls += 1;
      throw new Error('저장 공간 없음');
    }, 0),
    /저장 공간 없음/,
  );
  assert.equal(calls, 2);
});
