import type { Holding, PricePoint } from '../types';
import { addDays, addMonths } from './dates';

export type ValueRange = '1d' | '7d' | '1m' | '3m' | 'ytd' | '1y' | 'max';

export interface PortfolioValueSeriesInput {
  holdings: Holding[];
  cash: number;
  priceHistory: PricePoint[];
  range: ValueRange;
  /** 'YYYY-MM-DD'; closes after this date are ignored. */
  asOf: string;
  /** Downsample target. Default 260. */
  maxPoints?: number;
}

export interface ValuePoint {
  date: string;
  value: number;
}

export interface PortfolioValueSeries {
  range: ValueRange;
  startDate: string | null;
  endDate: string | null;
  points: ValuePoint[];
  startValue: number | null;
  endValue: number | null;
  change: { abs: number | null; pct: number | null };
  /** Tickers with shares but no close on or before asOf (and no statement value) — excluded. */
  unpriced: string[];
  /** Tickers whose first close is after the series start; their first close is back-filled. */
  partialHistory: string[];
}

function rangeStart(range: ValueRange, asOf: string): string | null {
  switch (range) {
    case '7d':
      return addDays(asOf, -7);
    case '1m':
      return addMonths(asOf, -1);
    case '3m':
      return addMonths(asOf, -3);
    case '1y':
      return addMonths(asOf, -12);
    case 'ytd':
      return `${asOf.slice(0, 4)}-01-01`;
    default:
      return null; // '1d' and 'max' are handled from the available dates
  }
}

function downsample<T>(items: T[], max: number): T[] {
  if (items.length <= max || max < 2) return items;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(items[Math.round((i * (items.length - 1)) / (max - 1))]!);
  return out;
}

/**
 * Replays CURRENT shares over past end-of-day closes (not a true performance history:
 * buys/sells during the range are ignored). Missing closes are carried forward from the
 * previous close; statement-value lines and cash contribute a flat amount.
 * Change is measured from the last close on or before the range start.
 */
export function portfolioValueSeries(input: PortfolioValueSeriesInput): PortfolioValueSeries {
  const { holdings, cash, priceHistory, range, asOf, maxPoints = 260 } = input;

  const byTicker = new Map<string, PricePoint[]>();
  for (const p of priceHistory) {
    if (p.date > asOf || !Number.isFinite(p.close)) continue;
    const list = byTicker.get(p.ticker) ?? [];
    list.push(p);
    byTicker.set(p.ticker, list);
  }
  for (const list of byTicker.values()) list.sort((a, b) => a.date.localeCompare(b.date));

  const shares = new Map<string, number>();
  const unpriced = new Set<string>();
  let flat = cash;
  for (const h of holdings) {
    if (h.shares !== null && byTicker.has(h.ticker)) {
      shares.set(h.ticker, (shares.get(h.ticker) ?? 0) + h.shares);
    } else if (h.statementValue !== null) {
      flat += h.statementValue;
    } else {
      unpriced.add(h.ticker);
    }
  }

  // Dates: union of closes for held tickers.
  const dateSet = new Set<string>();
  for (const t of shares.keys()) for (const p of byTicker.get(t)!) dateSet.add(p.date);
  const allDates = [...dateSet].sort();

  let dates: string[];
  if (range === 'max') {
    dates = allDates;
  } else if (range === '1d') {
    dates = allDates.slice(-2);
  } else {
    const start = rangeStart(range, asOf)!;
    const firstIdx = allDates.findIndex((d) => d >= start);
    if (firstIdx === -1) dates = allDates.slice(-1);
    else if (allDates[firstIdx] !== start && firstIdx > 0) dates = allDates.slice(firstIdx - 1);
    else dates = allDates.slice(firstIdx);
  }

  const partialHistory: string[] = [];
  const firstDate = dates[0];
  const cursors = [...shares.entries()].map(([ticker, qty]) => {
    const list = byTicker.get(ticker)!;
    if (firstDate !== undefined && list[0]!.date > firstDate) partialHistory.push(ticker);
    return { qty, list, idx: 0 };
  });

  const full: ValuePoint[] = dates.map((date) => {
    let value = flat;
    for (const c of cursors) {
      while (c.idx + 1 < c.list.length && c.list[c.idx + 1]!.date <= date) c.idx++;
      // Before the first close, list[0] is used (back-fill); otherwise last close ≤ date.
      value += c.qty * c.list[c.idx]!.close;
    }
    return { date, value };
  });

  const startValue = full[0]?.value ?? null;
  const endValue = full[full.length - 1]?.value ?? null;
  const abs = startValue !== null && endValue !== null ? endValue - startValue : null;
  const pct = abs !== null && startValue ? abs / startValue : null;

  return {
    range,
    startDate: full[0]?.date ?? null,
    endDate: full[full.length - 1]?.date ?? null,
    points: downsample(full, maxPoints),
    startValue,
    endValue,
    change: { abs, pct },
    unpriced: [...unpriced].sort(),
    partialHistory: partialHistory.sort(),
  };
}
