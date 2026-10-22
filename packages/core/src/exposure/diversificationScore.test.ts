import { demoPortfolios, fundHoldings, latestPrices, securities } from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import type { Holding } from '../types';
import { diversificationScore, herfindahl } from './diversificationScore';
import { lookThrough } from './lookThrough';
import { holding } from './testHelpers';
import type { Exposure } from './types';

const prices = latestPrices();
const lt = (holdings: Holding[], cash = 0) =>
  lookThrough({ holdings, cash, fundHoldings, prices, securities });

function exp(key: string, value: number, kind: Exposure['kind'] = 'company'): Exposure {
  return {
    key,
    ticker: key,
    name: key,
    kind,
    sector: null,
    industry: null,
    assetBucket: 'stocks',
    value,
    weight: 0,
    directValue: value,
    sources: [],
    fundCount: 0,
  };
}

describe('herfindahl', () => {
  it('sums squared shares of concentrated positions, ignoring tail and cash', () => {
    expect(herfindahl([exp('A', 50), exp('B', 50)])).toBeCloseTo(0.5);
    expect(herfindahl([exp('A', 50), exp('T', 50, 'tail'), exp('C', 100, 'cash')])).toBeCloseTo(
      0.0625,
    );
    expect(herfindahl([])).toBe(0);
  });
});

describe('diversificationScore', () => {
  it('returns integers in 0–100 and 0 for a single stock', () => {
    expect(diversificationScore([exp('A', 100)])).toBe(0);
    expect(Number.isInteger(diversificationScore([exp('A', 1), exp('B', 1)]))).toBe(true);
  });

  it('treats an all-tail (fully diversified) set as 100 and an empty set as 0', () => {
    expect(diversificationScore([exp('T', 100, 'tail')])).toBe(100);
    expect(diversificationScore([])).toBe(0);
  });

  it('accepts a look-through result and ignores the unresolved slice', () => {
    const r = lt([holding('VOO', 10), holding('SVF-1', null, { statementValue: 1e6 })]);
    expect(diversificationScore(r)).toBe(diversificationScore(lt([holding('VOO', 10)])));
  });

  it('scores the fixtures in the expected bands', () => {
    const [single, family] = demoPortfolios;
    expect(diversificationScore(lt(single!.holdings, single!.cash))).toBeLessThanOrEqual(10);
    const fam = diversificationScore(lt(family!.holdings, family!.cash));
    expect(fam).toBeGreaterThanOrEqual(30);
    expect(fam).toBeLessThanOrEqual(50);
    expect(diversificationScore(lt([holding('VTI', 100)]))).toBeGreaterThanOrEqual(85);
  });
});
