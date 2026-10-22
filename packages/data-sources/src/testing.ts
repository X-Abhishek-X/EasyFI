import type { FetchLike } from './types';

export interface RecordedCall {
  url: string;
  init: RequestInit | undefined;
}

export type FakeFetch = FetchLike & { calls: RecordedCall[] };

type Handler = (url: string, init: RequestInit | undefined) => Response | Promise<Response>;

/**
 * Test helper: a fetch that never touches the network.
 * Pass a single handler (called for every request) or a queue of handlers (one per request).
 */
export function fakeFetch(handlers: Handler | Handler[]): FakeFetch {
  const calls: RecordedCall[] = [];
  let i = 0;
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const h = Array.isArray(handlers) ? handlers[i++] : handlers;
    if (!h) throw new Error(`fakeFetch: no handler for request #${i} ${url}`);
    return h(url, init);
  }) as FakeFetch;
  fn.calls = calls;
  return fn;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}
