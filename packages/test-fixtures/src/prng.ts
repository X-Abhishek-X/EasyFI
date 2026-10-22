// Tiny deterministic PRNG helpers (no deps). Same seed → same sequence on every machine.

/** 32-bit FNV-1a hash of a string, used to derive per-ticker seeds. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box–Muller. */
export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const DAY_MS = 86_400_000;

export function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function parseIsoDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  return toIsoDate(parseIsoDate(date) + days * DAY_MS);
}

export function isWeekday(date: string): boolean {
  const d = new Date(parseIsoDate(date)).getUTCDay();
  return d !== 0 && d !== 6;
}

/** All weekdays from start to end inclusive. */
export function weekdays(start: string, end: string): string[] {
  const out: string[] = [];
  for (let ms = parseIsoDate(start); ms <= parseIsoDate(end); ms += DAY_MS) {
    const d = toIsoDate(ms);
    if (isWeekday(d)) out.push(d);
  }
  return out;
}
