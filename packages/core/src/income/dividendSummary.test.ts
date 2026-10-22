import { describe, expect, it } from 'vitest';
import type { DividendEvent, Holding, LatestPrices } from '../types';
import { dividendSummary } from './dividendSummary';

function holding(ticker: string, shares: number | null, costBasis: number | null = null): Holding {
  return {
    id: `${ticker}-${shares}`,
    portfolioId: 'p1',
    ticker,
    accountType: 'taxable',
    shares,
    costBasis,
    statementValue: null,
    statementDate: null,
    tags: [],
  };
}

const ev = (
  ticker: string,
  exDate: string,
  payDate: string | null,
  amount: number,
): DividendEvent => ({
  ticker,
  exDate,
  payDate,
  amount,
});

const asOf = '2026-10-22';

const schd: DividendEvent[] = [
  ev('SCHD', '2024-12-11', '2024-12-16', 0.6),
  ev('SCHD', '2025-03-26', '2025-03-31', 0.6),
  ev('SCHD', '2025-06-25', '2025-06-30', 0.6),
  ev('SCHD', '2025-09-24', '2025-09-29', 0.6),
  ev('SCHD', '2025-12-10', '2025-12-15', 0.7),
  ev('SCHD', '2026-03-25', '2026-03-30', 0.7),
  ev('SCHD', '2026-06-24', '2026-06-29', 0.7),
  ev('SCHD', '2026-09-23', '2026-09-28', 0.7),
];
const vym: DividendEvent[] = [
  ev('VYM', '2024-12-23', '2024-12-27', 0.75),
  ev('VYM', '2025-03-21', '2025-03-26', 0.75),
  ev('VYM', '2025-06-20', '2025-06-25', 0.75),
  ev('VYM', '2025-09-19', '2025-09-24', 0.75),
  ev('VYM', '2025-12-22', '2025-12-26', 0.8),
  ev('VYM', '2026-03-20', '2026-03-25', 0.8),
  ev('VYM', '2026-06-19', '2026-06-24', 0.8),
  ev('VYM', '2026-09-18', '2026-09-23', 0.8),
];
const jepiMonths = [
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
];
const jepi: DividendEvent[] = [
  ...jepiMonths.map((m) => ev('JEPI', `${m}-01`, `${m}-05`, 0.4)),
  ev('JEPI', '2026-11-02', '2026-11-05', 0.42), // announced
];

const holdings = [
  holding('SCHD', 120, 8400),
  holding('SCHD', 80, 5600),
  holding('JEPI', 100),
  holding('VYM', 300, 36000),
  holding('PRIV', 10),
];
const prices: LatestPrices = {
  SCHD: { close: 28, date: asOf },
  JEPI: { close: 57, date: asOf },
  VYM: { close: 160, date: asOf },
};

describe('dividendSummary', () => {
  const r = dividendSummary({
    holdings,
    dividends: [...schd, ...vym, ...jepi, ev('ZZZ', '2026-01-01', null, 9)],
    prices,
    asOf,
  });

  it('computes TTM vs prior TTM income', () => {
    expect(r.ttmIncome).toBeCloseTo(560 + 480 + 960, 8);
    expect(r.priorTtmIncome).toBeCloseTo(480 + 900, 8);
    expect(r.ttmChangePct).toBeCloseTo(2000 / 1380 - 1, 10);
  });

  it('computes yield on priced market value and yield on cost', () => {
    expect(r.pricedMarketValue).toBeCloseTo(5600 + 5700 + 48000, 8);
    expect(r.portfolioYield).toBeCloseTo(2000 / 59300, 10);
    expect(r.yieldOnCost).toBeCloseTo(1520 / 50000, 10);
    expect(r.unpriced).toEqual(['PRIV']);
  });

  it('estimates the next 30 days from announced events', () => {
    expect(r.next30Days.total).toBeCloseTo(42, 8);
    expect(r.next30Days.events).toHaveLength(1);
    expect(r.next30Days.events[0]).toMatchObject({
      ticker: 'JEPI',
      status: 'announced',
      payDate: '2026-11-05',
    });
  });

  it('builds a 24-month calendar of received + projected income', () => {
    expect(r.calendar).toHaveLength(24);
    expect(r.calendar[0]!.month).toBe('2025-11');
    expect(r.calendar[23]!.month).toBe('2027-10');
    const sep = r.calendar.find((m) => m.month === '2026-09')!;
    expect(sep.received).toBeCloseTo(140 + 240 + 40, 8);
    expect(sep.projected).toBe(0);
    const dec = r.calendar.find((m) => m.month === '2026-12')!;
    expect(dec.received).toBe(0);
    expect(dec.projected).toBeCloseTo(42 + 140 + 240, 8);
    const schdDec = dec.events.find((e) => e.ticker === 'SCHD')!;
    expect(schdDec).toMatchObject({
      exDate: '2026-12-23',
      payDate: '2026-12-28',
      status: 'projected',
      perShare: 0.7,
      total: 140,
    });
    expect(r.projection12m).toBeCloseTo(12 * 42 + 560 + 960, 8);
  });

  it('builds per-holding rows with frequency, next dates and income share', () => {
    const byTicker = Object.fromEntries(r.perHolding.map((row) => [row.ticker, row]));
    expect(byTicker.SCHD).toMatchObject({
      shares: 200,
      frequency: 'quarterly',
      nextExDate: '2026-12-23',
      nextPayDate: '2026-12-28',
      nextIsEstimate: true,
    });
    expect(byTicker.SCHD!.ttmPerShare).toBeCloseTo(2.8, 10);
    expect(byTicker.SCHD!.yield).toBeCloseTo(0.1, 10);
    expect(byTicker.SCHD!.yieldOnCost).toBeCloseTo(0.04, 10);
    expect(byTicker.SCHD!.pctOfIncome).toBeCloseTo(0.28, 10);
    expect(byTicker.JEPI).toMatchObject({
      frequency: 'monthly',
      nextPayDate: '2026-11-05',
      nextIsEstimate: false,
      yieldOnCost: null,
    });
    expect(byTicker.PRIV).toMatchObject({ yield: null, ttmIncome: 0, frequency: null });
    expect(byTicker.ZZZ).toBeUndefined();
  });

  it('ranks yield leaders and warns on income concentration', () => {
    expect(r.yieldLeaders.map((x) => x.ticker)).toEqual(['SCHD', 'JEPI', 'VYM']);
    expect(r.incomeConcentration).toHaveLength(1);
    expect(r.incomeConcentration[0]).toMatchObject({ ticker: 'VYM' });
    expect(r.incomeConcentration[0]!.pctOfIncome).toBeCloseTo(0.48, 10);
  });

  it('does not project stale or irregular payers and excludes specials from projections', () => {
    const s = dividendSummary({
      holdings: [holding('OLD', 10), holding('SPC', 10)],
      dividends: [
        ev('OLD', '2024-03-01', '2024-03-05', 1),
        ev('OLD', '2024-06-01', '2024-06-05', 1),
        ev('OLD', '2024-09-01', '2024-09-05', 1),
        ev('SPC', '2025-12-01', '2025-12-05', 0.5),
        ev('SPC', '2026-03-01', '2026-03-05', 0.5),
        ev('SPC', '2026-06-01', '2026-06-05', 0.5),
        ev('SPC', '2026-09-01', '2026-09-05', 0.5),
        ev('SPC', '2026-09-15', '2026-09-20', 3),
      ],
      prices: {},
      asOf,
    });
    const rows = Object.fromEntries(s.perHolding.map((row) => [row.ticker, row]));
    expect(rows.OLD!.nextPayDate).toBeNull();
    expect(rows.SPC!.hasSpecials).toBe(true);
    expect(rows.SPC!.ttmIncome).toBeCloseTo(10 * 5, 8);
    expect(s.projection12m).toBeCloseTo(4 * 5, 8);
    expect(s.portfolioYield).toBeNull();
    expect(s.yieldOnCost).toBeNull();
    expect(s.yieldLeaders).toEqual([]);
  });
});
