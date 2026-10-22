import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DbHandle } from './client';
import { createRepos, type Repos } from './repos';
import { seedFromFixtures, type SeedFixtures } from './seed';
import { createTestDb } from './testing';

const U = '00000000-0000-4000-8000-0000000000aa';

const fixtures: SeedFixtures = {
  securities: {
    VOO: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', expenseRatio: 0.0003 },
    AAPL: { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock', sector: 'IT', industry: 'Hardware' },
  },
  fundHoldings: {
    VOO: {
      asOf: '2026-06-30',
      constituents: [
        {
          fundTicker: 'VOO',
          constituentTicker: 'AAPL',
          name: 'Apple',
          weight: 0.07,
          assetBucket: 'equity',
          sector: 'IT',
          industry: 'Hardware',
        },
      ],
      sectorWeights: { IT: 0.3 },
    },
  },
  allPriceHistory: () =>
    Array.from({ length: 1500 }, (_, i) => ({
      ticker: 'VOO',
      date: new Date(Date.UTC(2021, 0, 1) + i * 86_400_000).toISOString().slice(0, 10),
      close: 300 + i / 10,
    })),
  dividends: [{ ticker: 'VOO', exDate: '2026-03-25', payDate: '2026-03-30', amount: 1.8 }],
  cpi: [{ seriesId: 'CUUR0000SA0', period: '2026-09', value: 321 }],
  demoPortfolios: [
    {
      name: 'Demo Actual',
      type: 'actual',
      cash: 500,
      holdings: [
        {
          ticker: 'VOO',
          accountType: 'roth_ira',
          shares: 10,
          costBasis: 4000,
          statementValue: 5000,
          statementDate: '2026-09-30',
          tags: ['core'],
        },
        { ticker: 'AAPL', accountType: 'taxable', shares: 5, costBasis: null, tags: [] },
      ],
    },
  ],
};

let h: DbHandle;
let r: Repos;
beforeAll(async () => {
  h = await createTestDb();
  r = createRepos(h.db);
});
afterAll(() => h.close());

describe('seedFromFixtures', () => {
  it('seeds market data and demo portfolios, idempotently', async () => {
    const first = await seedFromFixtures(h.db, fixtures, { userId: U });
    const second = await seedFromFixtures(h.db, fixtures, { userId: U });
    expect(second.portfolioIds).toEqual(first.portfolioIds);
    expect(first).toMatchObject({ securities: 2, funds: 1, prices: 1500, dividends: 1, cpi: 1 });

    expect(await r.securities.get('AAPL')).toMatchObject({ sector: 'IT' });
    expect(await r.prices.history('VOO')).toHaveLength(1500);
    const voo = (await r.fundHoldings.latest(['VOO'])).VOO!;
    expect(voo.constituents).toHaveLength(1);
    expect(voo.sectorWeights).toEqual([{ sector: 'IT', weight: 0.3 }]);

    const ps = await r.portfolios.listWithHoldings(U);
    expect(ps).toHaveLength(1);
    expect(ps[0]).toMatchObject({ name: 'Demo Actual', cash: 500 });
    expect(ps[0]!.holdings.map((x) => x.ticker).sort()).toEqual(['AAPL', 'VOO']);
    expect(await r.profiles.get(U)).not.toBeNull();
  });

  it('market-only seed without userId', async () => {
    const res = await seedFromFixtures(h.db, { cpi: fixtures.cpi });
    expect(res.portfolioIds).toEqual([]);
  });
});
