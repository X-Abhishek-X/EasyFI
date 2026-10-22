import { and, asc, gte, inArray } from 'drizzle-orm';
import type { Db } from '../client';
import { dividends, type Dividend } from '../schema';
import { chunk, excludedSet } from '../util';

export interface DividendInput {
  ticker: string;
  exDate: string;
  payDate?: string | null;
  amount: number;
}

export function dividendsRepo(db: Db) {
  return {
    async upsert(rows: readonly DividendInput[]): Promise<void> {
      for (const part of chunk(rows)) {
        await db
          .insert(dividends)
          .values(part.map((d) => ({ ...d, payDate: d.payDate ?? null })))
          .onConflictDoUpdate({
            target: [dividends.ticker, dividends.exDate],
            set: excludedSet(dividends, ['payDate', 'amount'] as const),
          });
      }
    },

    /** Ordered by ticker, exDate. `from` is an inclusive ex-date lower bound. */
    async list(tickers: readonly string[], from?: string): Promise<Dividend[]> {
      if (tickers.length === 0) return [];
      return db
        .select()
        .from(dividends)
        .where(
          and(
            inArray(dividends.ticker, [...tickers]),
            from ? gte(dividends.exDate, from) : undefined,
          ),
        )
        .orderBy(asc(dividends.ticker), asc(dividends.exDate));
    },
  };
}
