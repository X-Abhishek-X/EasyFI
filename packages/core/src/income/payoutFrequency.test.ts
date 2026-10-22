import { describe, expect, it } from 'vitest';
import type { DividendEvent } from '../types';
import { detectPayoutFrequency } from './payoutFrequency';
import { addMonths } from './dates';

function series(start: string, stepMonths: number, count: number, amount: number): DividendEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const exDate = addMonths(start, i * stepMonths);
    return { ticker: 'X', exDate, payDate: exDate, amount };
  });
}

describe('detectPayoutFrequency', () => {
  it('detects monthly', () => {
    const r = detectPayoutFrequency(series('2025-01-02', 1, 12, 0.4));
    expect(r.frequency).toBe('monthly');
    expect(r.intervalMonths).toBe(1);
    expect(r.hasSpecials).toBe(false);
    expect(r.regularAmount).toBe(0.4);
  });

  it('detects quarterly regardless of input order', () => {
    const r = detectPayoutFrequency(series('2024-03-20', 3, 8, 0.66).reverse());
    expect(r.frequency).toBe('quarterly');
    expect(r.intervalMonths).toBe(3);
  });

  it('detects semiannual and annual', () => {
    expect(detectPayoutFrequency(series('2022-06-15', 6, 6, 1)).frequency).toBe('semiannual');
    expect(detectPayoutFrequency(series('2021-12-15', 12, 4, 2)).frequency).toBe('annual');
  });

  it('flags an outsized special payment and ignores it for cadence', () => {
    const events = series('2025-01-02', 1, 12, 0.4);
    events.push({ ticker: 'X', exDate: '2025-12-20', payDate: '2025-12-28', amount: 1.5 });
    const r = detectPayoutFrequency(events);
    expect(r.frequency).toBe('monthly');
    expect(r.hasSpecials).toBe(true);
    expect(r.specials.map((e) => e.exDate)).toEqual(['2025-12-20']);
    expect(r.regularAmount).toBe(0.4);
  });

  it('flags an extra regular-sized payment beyond cadence', () => {
    const events = series('2024-03-15', 3, 8, 0.5);
    events.push({ ticker: 'X', exDate: '2024-04-10', payDate: '2024-04-20', amount: 0.5 });
    const r = detectPayoutFrequency(events);
    expect(r.frequency).toBe('quarterly');
    expect(r.hasSpecials).toBe(true);
    expect(r.specials).toHaveLength(1);
  });

  it('returns irregular for too few or erratic events', () => {
    expect(detectPayoutFrequency([]).frequency).toBe('irregular');
    expect(detectPayoutFrequency(series('2025-01-01', 1, 1, 1)).frequency).toBe('irregular');
    const erratic: DividendEvent[] = [
      '2023-01-05',
      '2023-02-01',
      '2023-09-10',
      '2024-08-01',
      '2024-08-20',
    ].map((exDate) => ({ ticker: 'X', exDate, payDate: null, amount: 1 }));
    expect(detectPayoutFrequency(erratic).frequency).toBe('irregular');
  });
});
