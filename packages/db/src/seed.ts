import { and, eq } from 'drizzle-orm';
import type { Db } from './client';
import { createRepos } from './repos';
import type { ConstituentInput, SectorWeightsInput } from './repos/fund-holdings';
import type { HoldingInput } from './repos/holdings';
import type { SecurityInput } from './repos/securities';
import { holdings, portfolios, type PortfolioType } from './schema';
import { isUuid } from './util';

/**
 * Plain-data seed input, structurally matching @easyfi/test-fixtures exports (not imported here:
 * @easyfi/db may only use fixtures in tests). Every section is optional.
 */
export interface SeedFixtures {
  securities?: readonly SecurityInput[] | Readonly<Record<string, SecurityInput>>;
  fundHoldings?: Readonly<
    Record<
      string,
      {
        asOf: string;
        constituents: readonly ConstituentInput[];
        sectorWeights?: SectorWeightsInput;
      }
    >
  >;
  /** Either the price rows, or the fixtures' `allPriceHistory` function. */
  prices?: readonly { ticker: string; date: string; close: number; adjClose?: number | null }[];
  allPriceHistory?: () => readonly { ticker: string; date: string; close: number }[];
  dividends?: readonly {
    ticker: string;
    exDate: string;
    payDate?: string | null;
    amount: number;
  }[];
  cpi?: readonly { seriesId: string; period: string; value: number }[];
  demoPortfolios?: readonly SeedPortfolio[];
}

export interface SeedPortfolio {
  /** Stable uuid makes re-seeding target the same row; otherwise matched by (user, name). */
  id?: string;
  name: string;
  type: PortfolioType;
  cash?: number;
  holdings: readonly HoldingInput[];
}

export interface SeedResult {
  securities: number;
  funds: number;
  prices: number;
  dividends: number;
  cpi: number;
  portfolioIds: string[];
}

/**
 * Idempotent: market data is upserted / snapshot-replaced; each demo portfolio is created or
 * found (by id, else by name) for `userId`, and its holdings + cash are replaced.
 */
export async function seedFromFixtures(
  db: Db,
  fixtures: SeedFixtures,
  options: { userId?: string } = {},
): Promise<SeedResult> {
  const r = createRepos(db);

  const securities = fixtures.securities
    ? Array.isArray(fixtures.securities)
      ? (fixtures.securities as readonly SecurityInput[])
      : Object.values(fixtures.securities as Record<string, SecurityInput>)
    : [];
  await r.securities.upsert(securities);

  const funds = Object.entries(fixtures.fundHoldings ?? {});
  for (const [fund, snap] of funds) {
    await r.fundHoldings.replaceSnapshot(fund, snap.asOf, snap.constituents, snap.sectorWeights);
  }

  const prices = fixtures.prices ?? fixtures.allPriceHistory?.() ?? [];
  await r.prices.upsertBatch(prices);
  await r.dividends.upsert(fixtures.dividends ?? []);
  await r.cpi.upsert(fixtures.cpi ?? []);

  const portfolioIds: string[] = [];
  const { userId } = options;
  if (userId && fixtures.demoPortfolios?.length) {
    await r.profiles.upsert(userId);
    for (const p of fixtures.demoPortfolios) {
      const id = await ensurePortfolio(db, userId, p);
      await db
        .delete(holdings)
        .where(and(eq(holdings.userId, userId), eq(holdings.portfolioId, id)));
      await r.holdings.bulkInsert(userId, id, p.holdings);
      await r.cash.set(userId, id, p.cash ?? 0);
      portfolioIds.push(id);
    }
  }

  return {
    securities: securities.length,
    funds: funds.length,
    prices: prices.length,
    dividends: fixtures.dividends?.length ?? 0,
    cpi: fixtures.cpi?.length ?? 0,
    portfolioIds,
  };
}

async function ensurePortfolio(db: Db, userId: string, p: SeedPortfolio): Promise<string> {
  const match =
    p.id && isUuid(p.id)
      ? and(eq(portfolios.userId, userId), eq(portfolios.id, p.id))
      : and(eq(portfolios.userId, userId), eq(portfolios.name, p.name));
  const [existing] = await db.select({ id: portfolios.id }).from(portfolios).where(match);
  if (existing) {
    await db.update(portfolios).set({ name: p.name, type: p.type }).where(match);
    return existing.id;
  }
  const [row] = await db
    .insert(portfolios)
    .values({ ...(p.id && isUuid(p.id) ? { id: p.id } : {}), userId, name: p.name, type: p.type })
    .returning({ id: portfolios.id });
  return row!.id;
}
