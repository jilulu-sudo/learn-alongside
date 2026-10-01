const DEFAULT_LIMIT = 6;

export function clipKey(voice, text) {
  return JSON.stringify([voice, text]);
}

function abortError() {
  return new DOMException('朗读请求已取消。', 'AbortError');
}

function assertActive(signal) {
  if (signal?.aborted) throw abortError();
}

export function makeNarration({
  path = '/api/narration',
  voice = '冰糖',
  limit = DEFAULT_LIMIT,
  fetchImpl = fetch,
  createObjectURL = URL.createObjectURL,
  revokeObjectURL = URL.revokeObjectURL,
} = {}) {
  const cache = new Map();
  const pending = new Map();

  const touch = (key, url) => {
    cache.delete(key);
    cache.set(key, url);
  };

  const evict = () => {
    while (cache.size > limit) {
      const oldest = cache.entries().next().value;
      if (!oldest) return;
      revokeObjectURL(oldest[1]);
      cache.delete(oldest[0]);
    }
  };

  const get = async (text, { signal } = {}) => {
    assertActive(signal);
    const key = clipKey(voice, text);
    const cached = cache.get(key);
    if (cached) {
      touch(key, cached);
      return Promise.resolve(cached);
    }
    const existing = pending.get(key);
    if (existing) return existing;

    const request = fetchImpl(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal,
    })
      .then(response => {
        assertActive(signal);
        if (!response.ok) throw new Error('narration_unavailable');
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('audio/')) throw new Error('invalid_audio_response');
        return response.blob();
      })
      .then(blob => {
        assertActive(signal);
        if (blob.size <= 44) throw new Error('empty_audio');
        const url = createObjectURL(blob);
        cache.set(key, url);
        evict();
        return url;
      })
      .finally(() => {
        if (pending.get(key) === request) pending.delete(key);
      });

    pending.set(key, request);
    return request;
  };

  const release = () => {
    pending.clear();
    for (const url of cache.values()) revokeObjectURL(url);
    cache.clear();
  };

  return { get, release, size: () => cache.size };
}

export function isNarrationAbort(error) {
  return error?.name === 'AbortError';
}
