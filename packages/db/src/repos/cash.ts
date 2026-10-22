import { and, eq } from 'drizzle-orm';
import type { Db } from '../client';
import { cashBalances, portfolios } from '../schema';
import { isUuid } from '../util';

export function cashRepo(db: Db) {
  const ownsPortfolio = async (userId: string, portfolioId: string) => {
    if (!isUuid(portfolioId)) return false;
    const [row] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(and(eq(portfolios.userId, userId), eq(portfolios.id, portfolioId)));
    return !!row;
  };

  return {
    /** Cash for the portfolio (0 if never set); null when the portfolio is not the user's. */
    async get(userId: string, portfolioId: string): Promise<number | null> {
      if (!(await ownsPortfolio(userId, portfolioId))) return null;
      const [row] = await db
        .select({ amount: cashBalances.amount })
        .from(cashBalances)
        .where(and(eq(cashBalances.userId, userId), eq(cashBalances.portfolioId, portfolioId)));
      return row?.amount ?? 0;
    },

    async set(userId: string, portfolioId: string, amount: number): Promise<boolean> {
      if (!(await ownsPortfolio(userId, portfolioId))) return false;
      await db
        .insert(cashBalances)
        .values({ userId, portfolioId, amount })
        .onConflictDoUpdate({
          target: cashBalances.portfolioId,
          set: { amount, updatedAt: new Date() },
        });
      return true;
    },
  };
}
