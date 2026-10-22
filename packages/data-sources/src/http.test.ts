import { describe, expect, it } from 'vitest';
import { createConcurrencyLimit, createRateLimiter, fetchWithRetry, HttpError } from './http';
import { fakeFetch, jsonResponse } from './testing';

describe('fetchWithRetry', () => {
  it('retries 429 and 5xx with exponential backoff then succeeds', async () => {
    const sleeps: number[] = [];
    const fetch = fakeFetch([
      () => new Response('slow down', { status: 429 }),
      () => new Response('oops', { status: 503 }),
      () => jsonResponse({ ok: true }),
    ]);
    const res = await fetchWithRetry(fetch, 'https://x.test/a', undefined, {
      retries: 3,
      baseDelayMs: 100,
      sleep: async (ms) => void sleeps.push(ms),
    });
    expect(await res.json()).toEqual({ ok: true });
    expect(sleeps).toEqual([100, 200]);
    expect(fetch.calls).toHaveLength(3);
  });

  it('throws HttpError after exhausting retries', async () => {
    const fetch = fakeFetch(() => new Response('down', { status: 500 }));
    await expect(
      fetchWithRetry(fetch, 'https://x.test/a', undefined, { retries: 2, sleep: async () => {} }),
    ).rejects.toMatchObject({ name: 'HttpError', status: 500 });
    expect(fetch.calls).toHaveLength(3);
  });

  it('does not retry 4xx other than 429', async () => {
    const fetch = fakeFetch(() => new Response('nope', { status: 404 }));
    const err = await fetchWithRetry(fetch, 'https://x.test/a', undefined, {
      sleep: async () => {},
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(404);
    expect(fetch.calls).toHaveLength(1);
  });

  it('can return non-ok responses for allowed statuses', async () => {
    const fetch = fakeFetch(() => new Response('nope', { status: 404 }));
    const res = await fetchWithRetry(fetch, 'https://x.test/a', undefined, {
      sleep: async () => {},
      allowStatus: [404],
    });
    expect(res.status).toBe(404);
  });
});

describe('createConcurrencyLimit', () => {
  it('never runs more than N tasks at once', async () => {
    const limit = createConcurrencyLimit(2);
    let active = 0;
    let peak = 0;
    const task = async (i: number) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 1));
      active--;
      return i;
    };
    const out = await Promise.all([1, 2, 3, 4, 5].map((i) => limit(() => task(i))));
    expect(out).toEqual([1, 2, 3, 4, 5]);
    expect(peak).toBe(2);
  });
});

describe('createRateLimiter', () => {
  it('spaces calls at least 1000/perSecond ms apart', async () => {
    let now = 0;
    const sleeps: number[] = [];
    const wait = createRateLimiter(10, {
      now: () => now,
      sleep: async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
    });
    await wait();
    await wait();
    await wait();
    expect(sleeps).toEqual([100, 100]);
  });
});
