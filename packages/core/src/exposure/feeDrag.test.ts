import { describe, expect, it } from 'vitest';
import type { FundHoldingsMap, LatestPrices, SecurityMap } from '../types';
import { feeDrag } from './feeDrag';
import { etf, holding, px, snapshot, stock } from './testHelpers';
import { valueHoldings } from './valueHoldings';

const secs: SecurityMap = {
  AAA: stock('AAA'),
  CHEAP: etf('CHEAP', 0.0003),
  PRICEY: etf('PRICEY', 0.005),
  MYSTERY: { ...etf('MYSTERY'), expenseRatio: null },
};
const prices: LatestPrices = { AAA: px(100), CHEAP: px(100), PRICEY: px(100), MYSTERY: px(100) };
const books: FundHoldingsMap = {
  CHEAP: snapshot('CHEAP', [
    ['AAA', 0.1],
    ['BBB', 0.1],
  ]),
  PRICEY: snapshot('PRICEY', [
    ['AAA', 0.2],
    ['CCC', 0.3],
  ]),
};

describe('feeDrag', () => {
  const valuation = valueHoldings(
    [
      holding('AAA', 10),
      holding('CHEAP', 100),
      holding('PRICEY', 20),
      holding('MYSTERY', 5),
      holding('NOPE', 1),
    ],
    prices,
  );

  it('computes a value-weighted blended expense ratio (stocks count as 0)', () => {
    const r = feeDrag(valuation, secs);
    // known value: 1000 + 10000 + 2000 = 13000; cost: 3 + 10 = 13
    expect(r.annualCost).toBeCloseTo(13);
    expect(r.blendedExpenseRatio).toBeCloseTo(13 / 13000);
    expect(r.coveredValue).toBe(13000);
    expect(r.unknown).toEqual(['MYSTERY']);
  });

  it('lists per-fund contributions sorted by cost', () => {
    const r = feeDrag(valuation, secs);
    expect(r.contributions.map((c) => c.ticker)).toEqual(['PRICEY', 'CHEAP']);
    expect(r.contributions[0]).toMatchObject({ value: 2000, expenseRatio: 0.005 });
    expect(r.contributions[0]!.annualCost).toBeCloseTo(10);
    expect(r.contributions[0]!.shareOfCost).toBeCloseTo(10 / 13);
  });

  it('estimates fee overlap waste vs the cheapest fund holding the same company', () => {
    const r = feeDrag(valuation, secs, books);
    // AAA in CHEAP (10000×0.1 = 1000) and PRICEY (2000×0.2 = 400); waste = 400 × (0.005 − 0.0003)
    expect(r.overlapWaste.overlappingValue).toBeCloseTo(1400);
    expect(r.overlapWaste.annualCost).toBeCloseTo(400 * 0.0047);
  });

  it('reports zero waste without fund books and handles empty input', () => {
    expect(feeDrag(valuation, secs).overlapWaste.annualCost).toBe(0);
    const empty = feeDrag(valueHoldings([], {}), secs);
    expect(empty.blendedExpenseRatio).toBeNull();
    expect(empty.annualCost).toBe(0);
  });
});
