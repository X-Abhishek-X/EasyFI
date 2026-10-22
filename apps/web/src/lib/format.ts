/**
 * Display formatters. Rule: a missing value (null/undefined/NaN) is NEVER shown as $0 or 0% —
 * it renders as an em dash ("—"). Pair with <UnpricedPill/> where a price is missing.
 */

export const MISSING = '—';

export type Maybe<T> = T | null | undefined;

function isNum(v: Maybe<number>): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $75,306 (whole dollars by default); `cents: true` → $0.74. */
export function formatMoney(v: Maybe<number>, opts: { cents?: boolean; compact?: boolean } = {}) {
  if (!isNum(v)) return MISSING;
  if (opts.compact && Math.abs(v) >= 10_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(v);
  }
  return (opts.cents ? usd2 : usd0).format(v);
}

/** Fraction (0–1) → "43%" / "9.10%". `signed` adds "+" for positives. */
export function formatPercent(
  fraction: Maybe<number>,
  opts: { digits?: number; signed?: boolean } = {},
) {
  if (!isNum(fraction)) return MISSING;
  const digits = opts.digits ?? 1;
  const pct = fraction * 100;
  const s = `${Math.abs(pct).toFixed(digits)}%`;
  if (pct < 0 && Number(Math.abs(pct).toFixed(digits)) !== 0) return `−${s}`;
  if (opts.signed && pct > 0) return `+${s}`;
  return s;
}

export function formatNumber(v: Maybe<number>, digits = 0) {
  if (!isNum(v)) return MISSING;
  return v.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Signed money: "+$1,204" / "−$88". */
export function formatSignedMoney(v: Maybe<number>) {
  if (!isNum(v)) return MISSING;
  const s = formatMoney(Math.abs(v));
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

/** 'up' | 'down' | 'flat' | 'none' for coloring deltas. */
export function trend(v: Maybe<number>): 'up' | 'down' | 'flat' | 'none' {
  if (!isNum(v)) return 'none';
  if (v > 0) return 'up';
  if (v < 0) return 'down';
  return 'flat';
}

export function trendClass(v: Maybe<number>) {
  const t = trend(v);
  return t === 'up' ? 'text-up' : t === 'down' ? 'text-down' : 'text-muted';
}

/** ISO date → "2026-09-30" (kept ISO on purpose: unambiguous as-of labels). */
export function formatIsoDate(iso: Maybe<string>) {
  if (!iso) return MISSING;
  return iso.slice(0, 10);
}

/** ISO date → "Sep 30". */
export function formatShortDate(iso: Maybe<string>) {
  if (!iso) return MISSING;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** ISO month "2026-08" or date → "Aug". */
export function formatMonth(iso: string, withYear = false) {
  const d = new Date(`${iso.slice(0, 7)}-01T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
}
