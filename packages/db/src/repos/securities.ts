import { asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { securities, type Security, type SecurityType } from '../schema';
import { chunk, escapeLike, excludedSet } from '../util';

export interface SecurityInput {
  ticker: string;
  name: string;
  type?: SecurityType;
  sector?: string | null;
  industry?: string | null;
  cik?: string | null;
  seriesId?: string | null;
  expenseRatio?: number | null;
}

export function securitiesRepo(db: Db) {
  return {
    /** Insert or fully replace by ticker (fields omitted become null/default). */
    async upsert(rows: readonly SecurityInput[]): Promise<void> {
      for (const part of chunk(rows)) {
        await db
          .insert(securities)
          .values(
            part.map((s) => ({
              ticker: s.ticker,
              name: s.name,
              type: s.type ?? 'other',
              sector: s.sector ?? null,
              industry: s.industry ?? null,
              cik: s.cik ?? null,
              seriesId: s.seriesId ?? null,
              expenseRatio: s.expenseRatio ?? null,
            })),
          )
          .onConflictDoUpdate({
            target: securities.ticker,
            set: {
              ...excludedSet(securities, [
                'name',
                'type',
                'sector',
                'industry',
                'cik',
                'seriesId',
                'expenseRatio',
              ] as const),
              updatedAt: new Date(),
            },
          });
      }
    },

    async get(ticker: string): Promise<Security | null> {
      const [row] = await db.select().from(securities).where(eq(securities.ticker, ticker));
      return row ?? null;
    },

    async getMany(tickers: readonly string[]): Promise<Security[]> {
      if (tickers.length === 0) return [];
      return db
        .select()
        .from(securities)
        .where(inArray(securities.ticker, [...tickers]));
    },

    /** Ticker prefix or name substring (case-insensitive). Exact ticker, then prefix, then name. */
    async search(q: string, limit = 10): Promise<Security[]> {
      const term = q.trim();
      if (!term) return [];
      const esc = escapeLike(term);
      return db
        .select()
        .from(securities)
        .where(or(ilike(securities.ticker, `${esc}%`), ilike(securities.name, `%${esc}%`)))
        .orderBy(
          sql`case when upper(${securities.ticker}) = upper(${term}) then 0
                   when ${securities.ticker} ilike ${`${esc}%`} then 1 else 2 end`,
          asc(securities.ticker),
        )
        .limit(limit);
    },
  };
}
