import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Db } from '../client';
import {
  cashBalances,
  holdings,
  portfolios,
  type Holding,
  type Portfolio,
  type PortfolioType,
} from '../schema';
import { isUuid } from '../util';

export interface PortfolioInput {
  name: string;
  type: PortfolioType;
}

export type PortfolioWithHoldings = Portfolio & { holdings: Holding[]; cash: number };

export function portfoliosRepo(db: Db) {
  const owned = (userId: string, id: string) =>
    and(eq(portfolios.userId, userId), eq(portfolios.id, id));

  return {
    list(userId: string): Promise<Portfolio[]> {
      return db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .orderBy(asc(portfolios.createdAt), asc(portfolios.name));
    },

    async get(userId: string, id: string): Promise<Portfolio | null> {
      if (!isUuid(id)) return null;
      const [row] = await db.select().from(portfolios).where(owned(userId, id));
      return row ?? null;
    },

    async create(userId: string, input: PortfolioInput & { id?: string }): Promise<Portfolio> {
      const [row] = await db
        .insert(portfolios)
        .values({ ...input, userId })
        .returning();
      return row!;
    },

    async update(
      userId: string,
      id: string,
      patch: Partial<PortfolioInput>,
    ): Promise<Portfolio | null> {
      if (!isUuid(id)) return null;
      const [row] = await db.update(portfolios).set(patch).where(owned(userId, id)).returning();
      return row ?? null;
    },

    /** Deletes the portfolio and (via cascade) its holdings, cash and share links. */
    async delete(userId: string, id: string): Promise<boolean> {
      if (!isUuid(id)) return false;
      const rows = await db
        .delete(portfolios)
        .where(owned(userId, id))
        .returning({ id: portfolios.id });
      return rows.length > 0;
    },

    async listWithHoldings(userId: string): Promise<PortfolioWithHoldings[]> {
      const list = await this.list(userId);
      if (list.length === 0) return [];
      const ids = list.map((p) => p.id);
      const [hs, cash] = await Promise.all([
        db
          .select()
          .from(holdings)
          .where(and(eq(holdings.userId, userId), inArray(holdings.portfolioId, ids)))
          .orderBy(asc(holdings.createdAt), asc(holdings.ticker)),
        db.select().from(cashBalances).where(eq(cashBalances.userId, userId)),
      ]);
      return list.map((p) => ({
        ...p,
        holdings: hs.filter((x) => x.portfolioId === p.id),
        cash: cash.find((c) => c.portfolioId === p.id)?.amount ?? 0,
      }));
    },
  };
}
