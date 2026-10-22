// MOCK DATA helpers — deterministic value series until GET /api/v1/portfolios/{id}/value-history exists.
import type { RangeSeries } from '@/components/overview/ValueCard';
import type { ValuePoint } from '@/components/types';
import type { RangeKey } from '@/components/ui/RangeTabs';

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Random walk ending at `end` on `endDate`, starting near end/(1+change). */
export function walk(
  end: number,
  change: number,
  days: number,
  stepDays: number,
  seed: number,
  endDate = '2026-09-30',
  vol = 0.012,
): ValuePoint[] {
  const r = rng(seed);
  const n = Math.max(2, Math.floor(days / stepDays));
  const start = end / (1 + change);
  const raw: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    raw.push(v);
    v *= 1 + (r() - 0.5) * 2 * vol;
  }
  // bend the walk so it lands exactly on `end`
  const drift = end / raw[n - 1]!;
  const endMs = Date.parse(`${endDate}T00:00:00Z`);
  return raw.map((x, i) => {
    const t = i / (n - 1);
    const d = new Date(endMs - (n - 1 - i) * stepDays * 86_400_000);
    return { date: d.toISOString().slice(0, 10), value: Math.round(x * (1 + (drift - 1) * t)) };
  });
}

export function seriesSet(
  end: number,
  seed: number,
  changes: Partial<Record<RangeKey, number>>,
): Partial<Record<RangeKey, RangeSeries>> {
  const spec: Record<RangeKey, [days: number, step: number, label: string]> = {
    '1D': [1, 1 / 26, 'today'],
    '7D': [7, 0.25, 'past week'],
    '1M': [30, 1, 'past month'],
    '3M': [91, 1, 'past 3 months'],
    YTD: [273, 3, 'year to date'],
    '1Y': [365, 7, 'past year'],
    MAX: [1095, 14, 'since first holding'],
  };
  const out: Partial<Record<RangeKey, RangeSeries>> = {};
  (Object.keys(changes) as RangeKey[]).forEach((k, i) => {
    const [days, step, label] = spec[k];
    const change = changes[k]!;
    out[k] = {
      points: walk(
        end,
        change,
        days,
        step,
        seed + i * 31,
        '2026-09-30',
        k === '1Y' || k === 'MAX' ? 0.03 : 0.014,
      ),
      change,
      changeLabel: label,
    };
  });
  return out;
}
