import type { DividendEvent } from '../types';
import { daysBetween } from './dates';

export type PayoutFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'irregular';

export interface PayoutFrequencyResult {
  frequency: PayoutFrequency;
  /** Months between regular payments; null when irregular. */
  intervalMonths: 1 | 3 | 6 | 12 | null;
  /** True when a payment is much larger than the median or falls outside the cadence. */
  hasSpecials: boolean;
  /** Events classified as special (outsized or extra), sorted by exDate. */
  specials: DividendEvent[];
  /** Per-share amount of the most recent regular payment; null if there is none. */
  regularAmount: number | null;
}

/** A payment ≥ this multiple of the median amount counts as special. */
const SPECIAL_MULTIPLE = 2;
/** A regular-sized payment arriving sooner than this fraction of the median gap is "extra". */
const EXTRA_GAP_FRACTION = 0.5;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function classify(medianGapDays: number): Exclude<PayoutFrequency, 'irregular'> | null {
  if (medianGapDays >= 20 && medianGapDays <= 45) return 'monthly';
  if (medianGapDays >= 70 && medianGapDays <= 115) return 'quarterly';
  if (medianGapDays >= 150 && medianGapDays <= 215) return 'semiannual';
  if (medianGapDays >= 320 && medianGapDays <= 410) return 'annual';
  return null;
}

const INTERVAL = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 } as const;

/**
 * Detects payout cadence for ONE ticker's dividend history.
 * Specials: an amount ≥ 2× the median, or a regular-sized payment that arrives well inside the
 * normal gap (an extra payment beyond cadence). Specials are excluded from cadence detection.
 * Needs ≥ 2 regular payments with consistent gaps; otherwise 'irregular'.
 */
export function detectPayoutFrequency(events: DividendEvent[]): PayoutFrequencyResult {
  const sorted = [...events].sort((a, b) => a.exDate.localeCompare(b.exDate));
  const med = median(sorted.map((e) => e.amount));
  const specials: DividendEvent[] = [];
  let regular: DividendEvent[] = [];
  for (const e of sorted) {
    if (med > 0 && e.amount >= SPECIAL_MULTIPLE * med) specials.push(e);
    else regular.push(e);
  }

  const gapsOf = (list: DividendEvent[]) =>
    list.slice(1).map((e, i) => daysBetween(list[i]!.exDate, e.exDate));

  // Remove extra payments that arrive far sooner than the usual gap.
  if (regular.length >= 3) {
    const medGap = median(gapsOf(regular).filter((g) => g > 0));
    const kept: DividendEvent[] = [regular[0]!];
    for (const e of regular.slice(1)) {
      const prev = kept[kept.length - 1]!;
      if (daysBetween(prev.exDate, e.exDate) < EXTRA_GAP_FRACTION * medGap) specials.push(e);
      else kept.push(e);
    }
    regular = kept;
  }
  specials.sort((a, b) => a.exDate.localeCompare(b.exDate));

  const regularAmount = regular.length ? regular[regular.length - 1]!.amount : null;
  const base = { hasSpecials: specials.length > 0, specials, regularAmount };

  const gaps = gapsOf(regular);
  if (gaps.length === 0) return { frequency: 'irregular', intervalMonths: null, ...base };
  const medGap = median(gaps);
  const frequency = classify(medGap);
  const consistent = gaps.filter((g) => Math.abs(g - medGap) <= medGap * 0.35).length;
  if (!frequency || consistent / gaps.length < 0.6) {
    return { frequency: 'irregular', intervalMonths: null, ...base };
  }
  return { frequency, intervalMonths: INTERVAL[frequency], ...base };
}
