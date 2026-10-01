import { describe, expect, test } from 'vitest';
import { clipKey, makeNarration } from '../src/player/narration.js';

const audio = (body = new Uint8Array(45), type = 'audio/wav') =>
  new Response(new Blob([body], { type }), {
    status: 200,
    headers: { 'content-type': type },
  });

function harness(options = {}) {
  const created = [];
  const revoked = [];
  const source = makeNarration({
    voice: '冰糖',
    createObjectURL: blob => {
      const url = `blob:${created.length + 1}`;
      created.push({ url, blob });
      return url;
    },
    revokeObjectURL: url => revoked.push(url),
    ...options,
  });
  return { source, created, revoked };
}

describe('narration clips', () => {
  test('clip keys include the voice and exact text', () => {
    expect(clipKey('冰糖', '你好')).toBe(JSON.stringify(['冰糖', '你好']));
    expect(clipKey('冰糖', '你好')).not.toBe(clipKey('Mia', '你好'));
  });

  test('posts the read-atlas narration contract and caches the object URL', async () => {
    let calls = 0;
    let request;
    const { source, created } = harness({
      fetchImpl: (path, init) => {
        calls += 1;
        request = { path, init };
        return Promise.resolve(audio());
      },
    });

    const first = await source.get('Effect 是值。');
    const second = await source.get('Effect 是值。');

    expect(first).toBe(second);
    expect(calls).toBe(1);
    expect(request.path).toBe('/api/narration');
    expect(request.init.method).toBe('POST');
    expect(request.init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(request.init.body)).toEqual({ text: 'Effect 是值。', voice: '冰糖' });
    expect(created).toHaveLength(1);
  });

  test('rejects non-audio and empty responses without creating URLs', async () => {
    const badType = harness({ fetchImpl: () => Promise.resolve(audio(new Uint8Array(45), 'application/json')) });
    await expect(badType.source.get('坏响应')).rejects.toThrow('invalid_audio_response');
    expect(badType.created).toHaveLength(0);

    const empty = harness({ fetchImpl: () => Promise.resolve(audio(new Uint8Array(0))) });
    await expect(empty.source.get('空音频')).rejects.toThrow('empty_audio');
    expect(empty.created).toHaveLength(0);
  });

  test('aborting before or during a response does not cache a clip', async () => {
    const before = harness({ fetchImpl: () => { throw new Error('fetch should not run'); } });
    const beforeController = new AbortController();
    beforeController.abort();
    await expect(before.source.get('提前取消', { signal: beforeController.signal })).rejects.toMatchObject({ name: 'AbortError' });

    let resolveResponse;
    const during = harness({ fetchImpl: () => new Promise(resolve => { resolveResponse = resolve; }) });
    const duringController = new AbortController();
    const pending = during.source.get('中途取消', { signal: duringController.signal });
    duringController.abort();
    resolveResponse(audio());
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(during.created).toHaveLength(0);
    expect(during.source.size()).toBe(0);
  });

  test('evicts the least recently used URL and releases the rest', async () => {
    const { source, revoked } = harness({ limit: 2, fetchImpl: () => Promise.resolve(audio()) });
    const first = await source.get('第一句');
    await source.get('第二句');
    await source.get('第一句');
    await source.get('第三句');

    expect(revoked).toEqual(['blob:2']);
    expect(source.size()).toBe(2);
    source.release();
    expect(revoked.sort()).toEqual(['blob:1', 'blob:2', 'blob:3']);
    expect(source.size()).toBe(0);
    expect(first).toBe('blob:1');
  });
});
