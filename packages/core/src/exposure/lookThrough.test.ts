import {
  demoPortfolios,
  fundHoldings as fixtureBooks,
  latestPrices,
  mulberry32,
  securities as fixtureSecurities,
} from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import type { FundHoldingsMap, LatestPrices, SecurityMap } from '../types';
import { lookThrough } from './lookThrough';
import { etf, holding, px, snapshot, stock } from './testHelpers';
import type { LookThroughResult } from './types';

const IT = 'Information Technology';
const FIN = 'Financials';

const securities: SecurityMap = {
  AAA: stock('AAA'),
  BBB: stock('BBB', FIN),
  CCC: stock('CCC', FIN),
  FUND: etf('FUND'),
  PART: etf('PART'),
  NOBOOK: etf('NOBOOK'),
  FOF: etf('FOF'),
  VOO: etf('VOO'),
  FXAIX: { ...etf('FXAIX'), type: 'mutual_fund' },
  SPAXX: { ...etf('SPAXX'), type: 'mmf' },
  BTC: { ...stock('BTC', null), type: 'crypto', name: 'Bitcoin' },
};

const books: FundHoldingsMap = {
  FUND: snapshot('FUND', [
    ['AAA', 0.6],
    ['BBB', 0.4, FIN],
  ]),
  PART: snapshot(
    'PART',
    [
      ['AAA', 0.3],
      ['BBB', 0.1, FIN],
    ],
    { [IT]: 0.5, [FIN]: 0.5 },
    '2026-03-31',
  ),
  FOF: snapshot('FOF', [
    ['FUND', 0.5, null],
    ['CCC', 0.5, FIN],
  ]),
  VOO: snapshot('VOO', [['AAA', 1]]),
};

const prices: LatestPrices = {
  AAA: px(100),
  BBB: px(50, '2026-09-29'),
  FUND: px(10),
  PART: px(10),
  NOBOOK: px(10),
  FOF: px(10),
  FXAIX: px(20),
  BTC: px(60000),
};

const run = (holdings: Parameters<typeof lookThrough>[0]['holdings'], extra = {}) =>
  lookThrough({ holdings, fundHoldings: books, prices, securities, ...extra });

const byKey = (r: LookThroughResult, key: string) => r.exposures.find((e) => e.key === key);

function expectConsistent(r: LookThroughResult) {
  const sumValues = r.exposures.reduce((s, e) => s + e.value, 0) + r.unresolved.value;
  expect(sumValues).toBeCloseTo(r.totalValue, 6);
  const sumWeights = r.exposures.reduce((s, e) => s + e.weight, 0) + r.unresolved.weight;
  expect(sumWeights).toBeLessThanOrEqual(1 + 1e-9);
  if (r.totalValue > 0) expect(sumWeights).toBeCloseTo(1, 9);
}

describe('lookThrough', () => {
  it('maps a direct stock to a single company exposure', () => {
    const r = run([holding('AAA', 10)]);
    expect(r.totalValue).toBe(1000);
    expect(r.exposures).toHaveLength(1);
    const a = r.exposures[0]!;
    expect(a).toMatchObject({
      key: 'AAA',
      ticker: 'AAA',
      kind: 'company',
      weight: 1,
      directValue: 1000,
      fundCount: 0,
    });
    expect(a.sources).toEqual([{ via: 'direct', value: 1000, weightInFund: null }]);
  });

  it('adds direct and fund exposure (effective = direct + Σ fund value × weight)', () => {
    const r = run([holding('AAA', 1), holding('FUND', 100)]);
    expect(r.totalValue).toBe(1100);
    const a = byKey(r, 'AAA')!;
    expect(a.value).toBeCloseTo(100 + 600);
    expect(a.fundCount).toBe(1);
    expect(a.sources).toEqual([
      { via: 'FUND', value: 600, weightInFund: 0.6 },
      { via: 'direct', value: 100, weightInFund: null },
    ]);
    expect(byKey(r, 'BBB')!.value).toBeCloseTo(400);
    expect(r.funds).toEqual([
      { ticker: 'FUND', bookTicker: 'FUND', value: 1000, weight: 1000 / 1100, asOf: '2026-06-30' },
    ]);
    expectConsistent(r);
  });

  it('attributes the unlisted remainder to sectors via sectorWeights', () => {
    const r = run([holding('PART', 100)]);
    // listed: IT 0.3, FIN 0.1 → residual IT 0.2, FIN 0.4 → remainder 0.6 split 1:2
    const itTail = byKey(r, `tail:PART:${IT}`)!;
    const finTail = byKey(r, `tail:PART:${FIN}`)!;
    expect(itTail).toMatchObject({
      kind: 'tail',
      ticker: null,
      name: 'Other PART holdings',
      sector: IT,
    });
    expect(itTail.value).toBeCloseTo(200);
    expect(finTail.value).toBeCloseTo(400);
    expect(r.tail.value).toBeCloseTo(600);
    expect(r.tail.weight).toBeCloseTo(0.6);
    expect(r.holdingsAsOf).toBe('2026-03-31');
    expectConsistent(r);
  });

  it('uses a single unclassified tail when the fund has no sectorWeights', () => {
    const r = lookThrough({
      holdings: [holding('FUND', 100)],
      fundHoldings: { FUND: snapshot('FUND', [['AAA', 0.25]]) },
      prices,
      securities,
    });
    const tail = r.exposures.find((e) => e.kind === 'tail')!;
    expect(tail.sector).toBeNull();
    expect(tail.value).toBeCloseTo(750);
  });

  it('scales down books whose weights sum above 1', () => {
    const r = lookThrough({
      holdings: [holding('FUND', 100)],
      fundHoldings: {
        FUND: snapshot('FUND', [
          ['AAA', 0.8],
          ['BBB', 0.4, FIN],
        ]),
      },
      prices,
      securities,
    });
    expect(byKey(r, 'AAA')!.value).toBeCloseTo(1000 * (0.8 / 1.2));
    expect(r.tail.value).toBe(0);
    expectConsistent(r);
  });

  it('puts funds without a book and statement-only lines in the unresolved slice', () => {
    const r = run([
      holding('AAA', 10),
      holding('NOBOOK', 50),
      holding('SVF-1', null, { statementValue: 1500 }),
    ]);
    expect(r.totalValue).toBe(1000 + 500 + 1500);
    expect(r.resolvedValue).toBe(1000);
    expect(r.unresolved.value).toBe(2000);
    expect(r.unresolved.weight).toBeCloseTo(2000 / 3000);
    expect(r.unresolved.reasons).toEqual([
      { ticker: 'NOBOOK', reason: 'no look-through data', value: 500 },
      { ticker: 'SVF-1', reason: 'statement value only', value: 1500 },
    ]);
    expectConsistent(r);
  });

  it('excludes unpriced lines entirely and lists them', () => {
    const r = run([holding('AAA', 10), holding('ZZZ', 5)]);
    expect(r.totalValue).toBe(1000);
    expect(r.unpriced).toEqual(['ZZZ']);
    expect(r.exposures.map((e) => e.key)).toEqual(['AAA']);
  });

  it('merges portfolio cash, money-market funds and fund cash lines into CASH', () => {
    const r = lookThrough({
      holdings: [holding('SPAXX', 200), holding('FUND', 100)],
      cash: 300,
      fundHoldings: {
        FUND: snapshot('FUND', [
          ['AAA', 0.9],
          [null, 0.1, null, 'cash'],
        ]),
      },
      prices,
      securities,
    });
    const cash = byKey(r, 'CASH')!;
    expect(cash).toMatchObject({ kind: 'cash', assetBucket: 'cash', ticker: 'CASH' });
    expect(cash.value).toBeCloseTo(300 + 200 + 100);
    expect(cash.sources.map((s) => s.via).sort()).toEqual(['FUND', 'direct']);
    expectConsistent(r);
  });

  it('keeps ticker-less constituents as unmapped exposures', () => {
    const r = lookThrough({
      holdings: [holding('FUND', 100)],
      fundHoldings: {
        FUND: snapshot('FUND', [
          ['AAA', 0.85],
          [null, 0.15, null, 'other'],
        ]),
      },
      prices,
      securities,
    });
    const u = r.exposures.find((e) => e.kind === 'unmapped')!;
    expect(u).toMatchObject({ ticker: null, name: 'Unmapped line', assetBucket: 'other' });
    expect(u.value).toBeCloseTo(150);
  });

  it('recurses into fund-of-funds and attributes to the held fund', () => {
    const r = run([holding('FOF', 100)]);
    const a = byKey(r, 'AAA')!;
    expect(a.value).toBeCloseTo(1000 * 0.5 * 0.6);
    expect(a.sources).toEqual([{ via: 'FOF', value: 300, weightInFund: 0.3 }]);
    expect(byKey(r, 'CCC')!.value).toBeCloseTo(500);
    expect(byKey(r, 'FUND')).toBeUndefined();
    expectConsistent(r);
  });

  it('stops at maxDepth and keeps the nested fund as a fund exposure', () => {
    const r = run([holding('FOF', 100)], { maxDepth: 1 });
    expect(byKey(r, 'FUND')).toMatchObject({ kind: 'fund', value: 500 });
    expect(byKey(r, 'AAA')).toBeUndefined();
  });

  it('survives cyclic books', () => {
    const r = lookThrough({
      holdings: [holding('FUND', 100)],
      fundHoldings: {
        FUND: snapshot('FUND', [
          ['FOF', 0.5, null],
          ['AAA', 0.5],
        ]),
        FOF: snapshot('FOF', [['FUND', 1, null]]),
      },
      prices,
      securities,
    });
    expectConsistent(r);
    expect(byKey(r, 'AAA')!.value).toBeCloseTo(500);
  });

  it('looks through an index mutual fund using an equivalent ETF book', () => {
    const r = run([holding('FXAIX', 10)]);
    expect(byKey(r, 'AAA')!.value).toBeCloseTo(200);
    expect(byKey(r, 'AAA')!.sources[0]!.via).toBe('FXAIX');
    expect(r.funds[0]).toMatchObject({ ticker: 'FXAIX', bookTicker: 'VOO' });
  });

  it('classifies crypto as a non-company asset', () => {
    const r = run([holding('BTC-USD', 0.1)]);
    expect(r.exposures[0]).toMatchObject({ key: 'BTC', kind: 'asset', assetBucket: 'crypto' });
  });

  it('reports the oldest price date as asOf', () => {
    expect(run([holding('AAA', 1), holding('BBB', 1)]).asOf).toBe('2026-09-29');
  });

  it('returns zero weights for an empty portfolio', () => {
    const r = run([]);
    expect(r.totalValue).toBe(0);
    expect(r.exposures).toEqual([]);
    expect(r.unresolved.weight).toBe(0);
  });
});

describe('lookThrough on fixtures', () => {
  const fixturePrices = latestPrices();
  const fx = (holdings: Parameters<typeof lookThrough>[0]['holdings'], cash = 0) =>
    lookThrough({
      holdings,
      cash,
      fundHoldings: fixtureBooks,
      prices: fixturePrices,
      securities: fixtureSecurities,
    });

  it('makes BRK.B the top exposure of the family taxable account (~12%)', () => {
    const family = demoPortfolios[1]!;
    const r = fx(family.holdings, family.cash);
    const companies = r.exposures.filter((e) => e.kind === 'company');
    expect(companies[0]!.ticker).toBe('BRK.B');
    expect(companies[0]!.weight).toBeGreaterThan(0.1);
    expect(companies[0]!.weight).toBeLessThan(0.14);
    expect(companies[0]!.fundCount).toBeGreaterThanOrEqual(2);
    expect(r.unresolved.reasons.map((x) => x.ticker)).toEqual(['SVF-1']);
    expectConsistent(r);
  });

  it('property: weights sum to ≤ 1 and values to the total for random fixture portfolios', () => {
    const rand = mulberry32(42);
    const tickers = Object.keys(fixturePrices).concat(['SVF-1', 'SPAXX', 'NOPE']);
    for (let i = 0; i < 50; i++) {
      const n = 1 + Math.floor(rand() * 8);
      const holdings = Array.from({ length: n }, (_, j) => {
        const t = tickers[Math.floor(rand() * tickers.length)]!;
        return t === 'SVF-1'
          ? holding(t, null, { id: `x${j}`, statementValue: Math.round(rand() * 5000) })
          : holding(t, Math.round(rand() * 100 * 100) / 100, { id: `x${j}` });
      });
      const r = fx(holdings, Math.round(rand() * 1000));
      expectConsistent(r);
      for (const e of r.exposures) expect(e.value).toBeGreaterThanOrEqual(0);
    }
  });
});
