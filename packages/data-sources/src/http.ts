import type { FetchLike, SleepFn } from './types';

export class HttpError extends Error {
  override readonly name = 'HttpError';
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`HTTP ${status} for ${redact(url)}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
}

/** Strip credentials from URLs before they end up in error messages/logs. */
export function redact(url: string): string {
  return url.replace(/([?&](?:token|registrationkey|api_key)=)[^&]*/gi, '$1***');
}

export const realSleep: SleepFn = (ms) => new Promise((r) => setTimeout(r, ms));

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  sleep?: SleepFn;
  /** Non-ok statuses returned to the caller instead of throwing (e.g. 404 → "not found"). */
  allowStatus?: number[];
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/** fetch with exponential backoff on 429/5xx and network errors. Throws HttpError on failure. */
export async function fetchWithRetry(
  fetch: FetchLike,
  url: string,
  init: RequestInit | undefined,
  opts: RetryOptions = {},
): Promise<Response> {
  const { retries = 3, baseDelayMs = 500, sleep = realSleep, allowStatus = [] } = opts;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(baseDelayMs * 2 ** attempt);
      continue;
    }
    if (res.ok || allowStatus.includes(res.status)) return res;
    if (isRetryable(res.status) && attempt < retries) {
      await sleep(baseDelayMs * 2 ** attempt);
      continue;
    }
    throw new HttpError(res.status, url, await res.text().catch(() => ''));
  }
}

/** Returns a wrapper that runs at most `n` tasks concurrently. */
export function createConcurrencyLimit(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active >= n) return;
    const start = queue.shift();
    if (start) start();
  };
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
  };
}

/** Returns `wait()`; awaiting it guarantees call starts are spaced ≥ 1000/perSecond ms apart. */
export function createRateLimiter(
  perSecond: number,
  deps: { now?: () => number; sleep?: SleepFn } = {},
): () => Promise<void> {
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? realSleep;
  const interval = 1000 / perSecond;
  let last = -Infinity;
  let chain: Promise<void> = Promise.resolve();
  return () => {
    chain = chain.then(async () => {
      const delay = last + interval - now();
      if (delay > 0) await sleep(delay);
      last = now();
    });
    return chain;
  };
}
