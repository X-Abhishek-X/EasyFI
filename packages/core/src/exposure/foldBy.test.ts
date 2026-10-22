import { describe, expect, it } from 'vitest';
import type { FundHoldingsMap, LatestPrices, SecurityMap } from '../types';
import { foldBy } from './foldBy';
import { lookThrough } from './lookThrough';
import { etf, holding, px, snapshot, stock } from './testHelpers';

const IT = 'Information Technology';
const FIN = 'Financials';

const securities: SecurityMap = {
  AAA: stock('AAA'),
  BBB: stock('BBB', FIN),
  F1: etf('F1'),
  F2: etf('F2'),
  NB: etf('NB'),
};
const books: FundHoldingsMap = {
  F1: snapshot(
    'F1',
    [
      ['AAA', 0.5],
      ['BBB', 0.3, FIN],
    ],
    { [IT]: 0.6, [FIN]: 0.4 },
  ),
  F2: snapshot('F2', [
    ['AAA', 0.9],
    [null, 0.1, null, 'cash'],
  ]),
};
const prices: LatestPrices = { AAA: px(100), BBB: px(100), F1: px(10), F2: px(10), NB: px(10) };

// AAA: direct 1000 + F1 500 + F2 900 = 2400; BBB: 300; tail F1: 200 (IT 0.1 / FIN 0.1 → 100/100)
// cash: F2 100 + portfolio 400; NB unresolved 500. Total = 1000 + 1000 + 1000 + 500 + 400 = 3900.
const result = lookThrough({
  holdings: [holding('AAA', 10), holding('F1', 100), holding('F2', 100), holding('NB', 50)],
  cash: 400,
  fundHoldings: books,
  prices,
  securities,
});

describe('foldBy', () => {
  it('company: only companies, with per-fund sources, sorted by value', () => {
    const groups = foldBy(result, 'company');
    expect(groups.map((g) => g.key)).toEqual(['AAA', 'BBB']);
    const a = groups[0]!;
    expect(a).toMatchObject({ label: 'AAA Inc', value: 2400, count: 1 });
    expect(a.weight).toBeCloseTo(2400 / 3900);
    expect(a.sources).toEqual([
      { via: 'direct', value: 1000 },
      { via: 'F2', value: 900 },
      { via: 'F1', value: 500 },
    ]);
  });

  it('sector: includes tails, cash and the unresolved slice so weights sum to 1', () => {
    const groups = foldBy(result, 'sector');
    const it_ = groups.find((g) => g.key === IT)!;
    expect(it_.value).toBeCloseTo(2400 + 100);
    expect(it_.count).toBe(2);
    expect(groups.find((g) => g.key === FIN)!.value).toBeCloseTo(400);
    expect(groups.find((g) => g.key === 'Cash')!.value).toBeCloseTo(500);
    expect(groups.find((g) => g.key === 'Unresolved')).toMatchObject({
      value: 500,
      label: 'No look-through data',
    });
    expect(groups.reduce((s, g) => s + g.weight, 0)).toBeCloseTo(1);
    expect(groups[0]!.key).toBe(IT);
  });

  it('industry: groups by industry with a fallback for unknowns', () => {
    const groups = foldBy(result, 'industry');
    expect(groups.find((g) => g.key === `${IT} industry`)!.value).toBeCloseTo(2400);
    expect(groups.find((g) => g.key === 'Other')!.value).toBeCloseTo(200);
  });

  it('asset: buckets with readable labels', () => {
    const groups = foldBy(result, 'asset');
    expect(groups.find((g) => g.key === 'stocks')).toMatchObject({ label: 'Stocks', value: 2900 });
    expect(groups.find((g) => g.key === 'cash')).toMatchObject({ label: 'Cash', value: 500 });
    expect(groups.reduce((s, g) => s + g.weight, 0)).toBeCloseTo(1);
  });
});
