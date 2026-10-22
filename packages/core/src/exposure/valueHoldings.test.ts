import { describe, expect, it } from 'vitest';
import type { Holding, LatestPrices } from '../types';
import { valueHoldings } from './valueHoldings';

function h(ticker: string, over: Partial<Holding> = {}): Holding {
  return {
    id: ticker,
    portfolioId: 'p',
    ticker,
    accountType: 'taxable',
    shares: 10,
    costBasis: null,
    statementValue: null,
    statementDate: null,
    tags: [],
    ...over,
  };
}

const prices: LatestPrices = {
  VOO: { close: 500, date: '2026-09-30', prevClose: 490 },
  'BRK.B': { close: 400, date: '2026-09-29', prevClose: 404 },
  AAPL: { close: 200, date: '2026-09-30' },
};

describe('valueHoldings', () => {
  it('values priced lines as shares × close with day change and gain', () => {
    const r = valueHoldings([h('VOO', { costBasis: 4000 })], prices);
    const line = r.lines[0]!;
    expect(line.valueSource).toBe('market');
    expect(line.value).toBe(5000);
    expect(line.dayChange).toBe(100);
    expect(line.dayChangePct).toBeCloseTo(100 / 4900);
    expect(line.gain).toBe(1000);
    expect(line.gainPct).toBeCloseTo(0.25);
  });

  it('normalises tickers before price lookup', () => {
    const r = valueHoldings([h('brk-b', { shares: 1 })], prices);
    expect(r.lines[0]!.ticker).toBe('BRK.B');
    expect(r.lines[0]!.value).toBe(400);
  });

  it('falls back to statement value, then flags unpriced (never 0)', () => {
    const r = valueHoldings(
      [
        h('SVF-1', { shares: null, statementValue: 1500, statementDate: '2026-09-30' }),
        h('MYSTERY', { costBasis: 100 }),
      ],
      prices,
    );
    expect(r.lines[0]!.valueSource).toBe('statement');
    expect(r.lines[0]!.value).toBe(1500);
    expect(r.lines[0]!.dayChange).toBeNull();
    expect(r.lines[1]!.valueSource).toBe('unpriced');
    expect(r.lines[1]!.value).toBeNull();
    expect(r.lines[1]!.gain).toBeNull();
    expect(r.unpriced).toEqual(['MYSTERY']);
    expect(r.totalValue).toBe(1500);
  });

  it('totals exclude unpriced and non-market lines from day change', () => {
    const r = valueHoldings(
      [
        h('VOO', { costBasis: 4000 }),
        h('BRK.B', { shares: 1, costBasis: 300 }),
        h('AAPL', { shares: 1 }),
        h('SVF-1', { shares: null, statementValue: 1000 }),
        h('NOPE'),
      ],
      prices,
    );
    expect(r.totalValue).toBe(5000 + 400 + 200 + 1000);
    expect(r.marketValue).toBe(5600);
    expect(r.statementValue).toBe(1000);
    expect(r.dayChange).toBe(100 - 4);
    expect(r.dayChangePct).toBeCloseTo(96 / (4900 + 404));
    expect(r.costBasis).toBe(4300);
    expect(r.gain).toBe(1100);
    expect(r.asOf).toBe('2026-09-29');
  });

  it('values money-market lines without a price at $1 per share', () => {
    const r = valueHoldings([h('SPAXX', { shares: 250 })], {});
    expect(r.lines[0]!.ticker).toBe('CASH');
    expect(r.lines[0]!.value).toBe(250);
  });

  it('handles an empty list', () => {
    const r = valueHoldings([], prices);
    expect(r.totalValue).toBe(0);
    expect(r.dayChangePct).toBeNull();
    expect(r.asOf).toBeNull();
  });
});
