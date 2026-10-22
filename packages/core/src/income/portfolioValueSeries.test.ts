import { describe, expect, it } from 'vitest';
import type { Holding, PricePoint } from '../types';
import { portfolioValueSeries } from './portfolioValueSeries';
import { addDays } from './dates';

function holding(partial: Partial<Holding> & { ticker: string }): Holding {
  return {
    id: partial.ticker,
    portfolioId: 'p1',
    accountType: 'taxable',
    shares: null,
    costBasis: null,
    statementValue: null,
    statementDate: null,
    tags: [],
    ...partial,
  };
}

const prices: PricePoint[] = [
  { ticker: 'AAA', date: '2026-10-16', close: 10 },
  { ticker: 'AAA', date: '2026-10-19', close: 11 },
  { ticker: 'AAA', date: '2026-10-20', close: 12 },
  { ticker: 'AAA', date: '2026-10-21', close: 13 },
  { ticker: 'AAA', date: '2026-10-22', close: 14 }, // after asOf below in some tests
  { ticker: 'BBB', date: '2026-10-16', close: 100 },
  // BBB missing 10-19 → carried forward
  { ticker: 'BBB', date: '2026-10-20', close: 110 },
  { ticker: 'BBB', date: '2026-10-21', close: 120 },
];

describe('portfolioValueSeries', () => {
  const holdings = [
    holding({ ticker: 'AAA', shares: 10 }),
    holding({ ticker: 'AAA', shares: 5, accountType: 'roth_ira' }),
    holding({ ticker: 'BBB', shares: 1 }),
    holding({ ticker: 'TRUST', statementValue: 1000 }),
    holding({ ticker: 'NOPE', shares: 3 }),
  ];

  it('replays current shares, carries forward missing closes, adds flat statement + cash', () => {
    const r = portfolioValueSeries({
      holdings,
      cash: 50,
      priceHistory: prices,
      range: 'max',
      asOf: '2026-10-21',
    });
    // flat = 1000 + 50
    expect(r.points).toEqual([
      { date: '2026-10-16', value: 15 * 10 + 100 + 1050 },
      { date: '2026-10-19', value: 15 * 11 + 100 + 1050 },
      { date: '2026-10-20', value: 15 * 12 + 110 + 1050 },
      { date: '2026-10-21', value: 15 * 13 + 120 + 1050 },
    ]);
    expect(r.startValue).toBe(1300);
    expect(r.endValue).toBe(1365);
    expect(r.change.abs).toBe(65);
    expect(r.change.pct).toBeCloseTo(65 / 1300, 12);
    expect(r.unpriced).toEqual(['NOPE']);
    expect(r.startDate).toBe('2026-10-16');
    expect(r.endDate).toBe('2026-10-21');
  });

  it('1d compares the last two closes', () => {
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 })],
      cash: 0,
      priceHistory: prices,
      range: '1d',
      asOf: '2026-10-22',
    });
    expect(r.points.map((p) => p.date)).toEqual(['2026-10-21', '2026-10-22']);
    expect(r.change.abs).toBe(1);
  });

  it('7d starts from the last close on or before asOf-7 days', () => {
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 })],
      cash: 0,
      priceHistory: prices,
      range: '7d',
      asOf: '2026-10-24',
    });
    // start = 2026-10-17 (no close) → baseline 2026-10-16
    expect(r.points[0]).toEqual({ date: '2026-10-16', value: 10 });
    expect(r.endValue).toBe(14);
  });

  it('ytd uses prior year-end close as baseline', () => {
    const hist: PricePoint[] = [
      { ticker: 'AAA', date: '2025-12-30', close: 9 },
      { ticker: 'AAA', date: '2025-12-31', close: 10 },
      { ticker: 'AAA', date: '2026-01-02', close: 12 },
    ];
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 })],
      cash: 0,
      priceHistory: hist,
      range: 'ytd',
      asOf: '2026-01-05',
    });
    expect(r.points.map((p) => p.date)).toEqual(['2025-12-31', '2026-01-02']);
    expect(r.change.pct).toBeCloseTo(0.2, 12);
  });

  it('back-fills a ticker whose history starts mid-range and reports it', () => {
    const hist: PricePoint[] = [
      { ticker: 'AAA', date: '2026-10-19', close: 10 },
      { ticker: 'AAA', date: '2026-10-20', close: 10 },
      { ticker: 'NEW', date: '2026-10-20', close: 5 },
    ];
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 }), holding({ ticker: 'NEW', shares: 2 })],
      cash: 0,
      priceHistory: hist,
      range: 'max',
      asOf: '2026-10-20',
    });
    expect(r.points.map((p) => p.value)).toEqual([20, 20]);
    expect(r.partialHistory).toEqual(['NEW']);
  });

  it('downsamples long histories to at most maxPoints keeping first and last', () => {
    const hist: PricePoint[] = Array.from({ length: 1000 }, (_, i) => ({
      ticker: 'AAA',
      date: addDays('2023-01-01', i),
      close: i + 1,
    }));
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 })],
      cash: 0,
      priceHistory: hist,
      range: 'max',
      asOf: '2030-01-01',
    });
    expect(r.points.length).toBeLessThanOrEqual(260);
    expect(r.points.length).toBeGreaterThan(200);
    expect(r.points[0]).toEqual({ date: '2023-01-01', value: 1 });
    expect(r.points[r.points.length - 1]!.value).toBe(1000);
    expect(r.startValue).toBe(1);
    expect(r.endValue).toBe(1000);
  });

  it('returns empty series with null values when there is no price history', () => {
    const r = portfolioValueSeries({
      holdings: [holding({ ticker: 'AAA', shares: 1 })],
      cash: 100,
      priceHistory: [],
      range: '1m',
      asOf: '2026-10-22',
    });
    expect(r.points).toEqual([]);
    expect(r.startValue).toBeNull();
    expect(r.endValue).toBeNull();
    expect(r.change).toEqual({ abs: null, pct: null });
    expect(r.unpriced).toEqual(['AAA']);
  });
});
