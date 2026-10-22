import { demoPortfolios, fundHoldings, latestPrices, securities } from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import type { Holding } from '../types';
import { exposureInsights } from './exposureInsights';
import { lookThrough } from './lookThrough';
import { holding } from './testHelpers';

const prices = latestPrices();
const lt = (holdings: Holding[], cash = 0) =>
  lookThrough({ holdings, cash, fundHoldings, prices, securities });

function demoInput() {
  const portfolios = demoPortfolios.map((p) => ({
    id: p.id,
    name: p.name,
    holdings: p.holdings,
    result: lt(p.holdings, p.cash),
  }));
  const combined = lt(
    demoPortfolios.flatMap((p) => p.holdings),
    demoPortfolios.reduce((s, p) => s + p.cash, 0),
  );
  return { portfolios, combined, fundHoldings };
}

describe('exposureInsights on the demo portfolios', () => {
  const insights = exposureInsights(demoInput());

  it('ranks high severity first', () => {
    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < insights.length; i++) {
      expect(order[insights[i]!.severity]).toBeGreaterThanOrEqual(order[insights[i - 1]!.severity]);
    }
    expect(new Set(insights.map((i) => i.id)).size).toBe(insights.length);
  });

  it('flags the single-stock bet', () => {
    const x = insights.find((i) => i.kind === 'single-stock' && i.portfolioIds[0] === 'pf-single')!;
    expect(x.severity).toBe('high');
    expect(x.tickers).toEqual(['GOOGL']);
    expect(x.title).toMatch(/^Single Stock Bet: 6\d% sits in one stock \(GOOGL\)$/);
    expect(x.askPrompt).toContain('GOOGL');
  });

  it('flags a company concentrated through several funds across everything', () => {
    const x = insights.find((i) => i.kind === 'multi-fund-company' && i.tickers[0] === 'NVDA')!;
    expect(x.severity).toBe('high');
    expect(x.title).toMatch(/^NVDA is \d+\.\d% of everything you own — direct \+ \d funds$/);
    expect(x.portfolioIds.sort()).toEqual(['pf-growth', 'pf-single', 'pf-taxable']);
  });

  it('flags the same fund (or an equivalent) held in more than one portfolio', () => {
    const voo = insights.find((i) => i.kind === 'duplicate-fund' && i.tickers.includes('VOO'))!;
    expect(voo.severity).toBe('medium');
    expect(voo.portfolioIds.sort()).toEqual(['pf-single', 'pf-taxable']);
    expect(voo.title).toBe('VOO appears in 2 portfolios — the same holdings counted twice');
    const nasdaq = insights.find((i) => i.kind === 'duplicate-fund' && i.tickers.includes('QQQM'))!;
    expect(nasdaq.tickers.sort()).toEqual(['QQQ', 'QQQM']);
    expect(nasdaq.portfolioIds.sort()).toEqual(['pf-growth', 'pf-single', 'pf-taxable']);
  });

  it('flags a sector above 40% in the tech-tilt portfolio', () => {
    const x = insights.find((i) => i.kind === 'sector-heavy' && i.portfolioIds[0] === 'pf-growth')!;
    expect(x.tickers).toEqual([]);
    expect(x.title).toMatch(/^Information Technology is \d+% of Growth \/ Tech Tilt$/);
    expect(['medium', 'high']).toContain(x.severity);
  });

  it('flags heavily overlapping funds held together', () => {
    const x = insights.find(
      (i) => i.kind === 'fund-overlap' && i.tickers.includes('VGT') && i.tickers.includes('SCHG'),
    );
    expect(x).toBeDefined();
    expect(x!.title).toMatch(/overlap \d+% by weight$/);
  });

  it('reports each fund pair once even when an equivalent fund is also held', () => {
    const schgNasdaq = insights.filter(
      (i) =>
        i.kind === 'fund-overlap' &&
        i.tickers.includes('SCHG') &&
        i.tickers.some((t) => t.startsWith('QQQ')),
    );
    expect(schgNasdaq).toHaveLength(1);
  });
});

describe('exposureInsights edge cases', () => {
  it('flags a large unresolved slice', () => {
    const holdings = [holding('VOO', 1), holding('SVF-1', null, { statementValue: 2000 })];
    const result = lt(holdings);
    const insights = exposureInsights({
      portfolios: [{ id: 'p', name: 'Work 401k', holdings, result }],
      combined: result,
    });
    const x = insights.find((i) => i.kind === 'unresolved')!;
    expect(x).toMatchObject({ severity: 'medium', portfolioIds: ['p'], tickers: ['SVF-1'] });
    expect(x.title).toBe('78% of Work 401k has no look-through data');
  });

  it('returns nothing for a calm, diversified portfolio', () => {
    const holdings = [holding('VTI', 10)];
    const result = lt(holdings);
    expect(
      exposureInsights({
        portfolios: [{ id: 'p', name: 'Core', holdings, result }],
        combined: result,
      }),
    ).toEqual([]);
  });
});
