import type { CpiPoint } from '../types';
import { addMonthKey } from './dates';

export interface CpiSnapshotOptions {
  headlineSeriesId: string;
  /** Category series id → display label. */
  categories: Record<string, string>;
  /** Optional relative-importance weights (fractions of the basket) per category series id. */
  weights?: Record<string, number>;
}

export interface CpiReading {
  seriesId: string;
  period: string;
  value: number;
  /** Year-over-year change (fraction); null without a value 12 months earlier. */
  yoy: number | null;
  /** Month-over-month change (fraction); null without the prior month. */
  mom: number | null;
}

export interface CpiDriver extends CpiReading {
  label: string;
  weight: number | null;
  /** weight × yoy, when a weight is known. */
  contribution: number | null;
}

export interface CpiSnapshot {
  /** Latest headline period 'YYYY-MM'. */
  asOfPeriod: string | null;
  headline: CpiReading | null;
  /** Headline YoY for (up to) the 12 months ending at asOfPeriod. */
  trend: { period: string; yoy: number }[];
  /** Sorted by |contribution| when weights are given, else by |yoy|. */
  drivers: CpiDriver[];
}

type SeriesMap = Map<string, number>;

function change(series: SeriesMap, period: string, months: number): number | null {
  const now = series.get(period);
  const then = series.get(addMonthKey(period, -months));
  if (now === undefined || then === undefined || then === 0) return null;
  return now / then - 1;
}

function reading(seriesId: string, series: SeriesMap, period: string): CpiReading {
  return {
    seriesId,
    period,
    value: series.get(period)!,
    yoy: change(series, period, 12),
    mom: change(series, period, 1),
  };
}

function latest(series: SeriesMap, atOrBefore: string | null): string | null {
  let best: string | null = null;
  for (const p of series.keys()) {
    if (atOrBefore !== null && p > atOrBefore) continue;
    if (best === null || p > best) best = p;
  }
  return best;
}

export function cpiSnapshot(points: CpiPoint[], options: CpiSnapshotOptions): CpiSnapshot {
  const bySeries = new Map<string, SeriesMap>();
  for (const p of points) {
    const s = bySeries.get(p.seriesId) ?? new Map<string, number>();
    s.set(p.period, p.value);
    bySeries.set(p.seriesId, s);
  }

  const head = bySeries.get(options.headlineSeriesId);
  const asOfPeriod = head ? latest(head, null) : null;
  const headline = head && asOfPeriod ? reading(options.headlineSeriesId, head, asOfPeriod) : null;

  const trend: { period: string; yoy: number }[] = [];
  if (head && asOfPeriod) {
    for (let i = 11; i >= 0; i--) {
      const period = addMonthKey(asOfPeriod, -i);
      const yoy = change(head, period, 12);
      if (yoy !== null) trend.push({ period, yoy });
    }
  }

  const drivers: CpiDriver[] = [];
  for (const [seriesId, label] of Object.entries(options.categories)) {
    const s = bySeries.get(seriesId);
    const period = s ? latest(s, asOfPeriod) : null;
    if (!s || !period) continue;
    const r = reading(seriesId, s, period);
    const weight = options.weights?.[seriesId] ?? null;
    drivers.push({
      ...r,
      label,
      weight,
      contribution: weight !== null && r.yoy !== null ? weight * r.yoy : null,
    });
  }
  // Unknown values sort last.
  const key = (d: CpiDriver): number => {
    const v = options.weights ? d.contribution : d.yoy;
    return v === null ? -1 : Math.abs(v);
  };
  drivers.sort((a, b) => key(b) - key(a));

  return { asOfPeriod, headline, trend, drivers };
}
