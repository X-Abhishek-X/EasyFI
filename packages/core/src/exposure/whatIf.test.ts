import { demoPortfolios, fundHoldings, latestPrices, securities } from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import type { FundHoldingsMap, LatestPrices, SecurityMap } from '../types';
import { etf, holding, px, snapshot, stock } from './testHelpers';
import { whatIf } from './whatIf';

const IT = 'Information Technology';
const FIN = 'Financials';
const secs: SecurityMap = {
  AAA: stock('AAA'),
  BBB: stock('BBB', FIN),
  F1: etf('F1'),
  F2: etf('F2'),
  NEWF: etf('NEWF'),
  BLIND: etf('BLIND'),
};
const books: FundHoldingsMap = {
  F1: snapshot('F1', [['BBB', 1, FIN]]),
  F2: snapshot('F2', [
    ['BBB', 0.5, FIN],
    ['AAA', 0.5],
  ]),
  NEWF: snapshot('NEWF', [['AAA', 1]]),
};
const prices: LatestPrices = { AAA: px(100), F1: px(10), F2: px(10), BLIND: px(10) };
const input = { holdings: [holding('AAA', 10)], fundHoldings: books, prices, securities: secs };

describe('whatIf', () => {
  it('reports before/after sector weights and the shift per sector', () => {
    const r = whatIf(input, { ticker: 'F1', amount: 1000 });
    expect(r.before.totalValue).toBe(1000);
    expect(r.after.totalValue).toBe(2000);
    expect(r.sectorShifts).toEqual([
      { sector: FIN, before: 0, after: 0.5, shift: 0.5 },
      { sector: IT, before: 1, after: 0.5, shift: -0.5 },
    ]);
    expect(r.addedResolved).toBe(true);
  });

  it('scores before and after', () => {
    const r = whatIf(input, { ticker: 'F1', amount: 1000 });
    expect(r.before.score).toBe(0);
    expect(r.after.score).toBe(0); // N_eff = 2 is still below the floor
    expect(r.topChanges[0]).toMatchObject({
      ticker: 'AAA',
      beforeWeight: 1,
      afterWeight: 0.5,
      shift: -0.5,
    });
    expect(r.topChanges[1]).toMatchObject({ ticker: 'BBB', beforeWeight: 0, afterWeight: 0.5 });
  });

  it('measures overlap of the added fund with each fund already held', () => {
    const r = whatIf(
      { ...input, holdings: [holding('F1', 10), holding('F2', 10)] },
      { ticker: 'f2', amount: 500 },
    );
    expect(r.overlaps).toEqual([{ fund: 'F1', overlapByWeight: 0.5, sharedCount: 1 }]);
  });

  it('works for a fund with a book but no price yet', () => {
    const r = whatIf(input, { ticker: 'NEWF', amount: 1000 });
    expect(r.after.totalValue).toBe(2000);
    expect(r.topChanges[0]).toMatchObject({ ticker: 'AAA', afterWeight: 1 });
  });

  it('flags additions that cannot be looked through', () => {
    const r = whatIf(input, { ticker: 'BLIND', amount: 1000 });
    expect(r.addedResolved).toBe(false);
    expect(r.sectorShifts.find((s) => s.sector === 'Unresolved')!.after).toBeCloseTo(0.5);
  });

  it('improves diversification when adding a total-market fund to a single-stock bet', () => {
    const single = demoPortfolios[0]!;
    const r = whatIf(
      {
        holdings: single.holdings,
        cash: single.cash,
        fundHoldings,
        prices: latestPrices(),
        securities,
      },
      { ticker: 'VTI', amount: 20000 },
    );
    expect(r.after.score).toBeGreaterThan(r.before.score);
    const voo = r.overlaps.find((o) => o.fund === 'VOO')!;
    expect(voo.overlapByWeight).toBeGreaterThan(0.5);
    expect(r.topChanges[0]!.ticker).toBe('GOOGL');
  });
});
