import { and, asc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { pricesEod, type PriceEod } from '../schema';
import { chunk, excludedSet } from '../util';

export interface PriceInput {
  ticker: string;
  date: string;
  close: number;
  adjClose?: number | null;
}

export interface LatestPrice {
  ticker: string;
  date: string;
  close: number;
  adjClose: number | null;
  /** Previous trading day's close (null when only one bar is stored). */
  prevDate: string | null;
  prevClose: number | null;
}

export function pricesRepo(db: Db) {
  return {
    async upsertBatch(rows: readonly PriceInput[]): Promise<void> {
      for (const part of chunk(rows)) {
        await db
          .insert(pricesEod)
          .values(part.map((p) => ({ ...p, adjClose: p.adjClose ?? null })))
          .onConflictDoUpdate({
            target: [pricesEod.ticker, pricesEod.date],
            set: excludedSet(pricesEod, ['close', 'adjClose'] as const),
          });
      }
    },

    /** Ascending by date, from `from` (inclusive) if given. */
    history(ticker: string, from?: string): Promise<PriceEod[]> {
      return db
        .select()
        .from(pricesEod)
        .where(and(eq(pricesEod.ticker, ticker), from ? gte(pricesEod.date, from) : undefined))
        .orderBy(asc(pricesEod.date));
    },

    /** Latest bar per ticker plus the previous close. Tickers with no prices are omitted. */
    async latest(tickers: readonly string[]): Promise<LatestPrice[]> {
      if (tickers.length === 0) return [];
      const ranked = db
        .select({
          ticker: pricesEod.ticker,
          date: pricesEod.date,
          close: pricesEod.close,
          adjClose: pricesEod.adjClose,
          rn: sql<number>`row_number() over (partition by ${pricesEod.ticker} order by ${pricesEod.date} desc)`.as(
            'rn',
          ),
        })
        .from(pricesEod)
        .where(inArray(pricesEod.ticker, [...tickers]))
        .as('ranked');
      const rows = await db
        .select()
        .from(ranked)
        .where(lte(ranked.rn, 2))
        .orderBy(asc(ranked.ticker), asc(ranked.rn));
      const out: LatestPrice[] = [];
      for (const row of rows) {
        if (Number(row.rn) === 1) {
          out.push({
            ticker: row.ticker,
            date: row.date,
            close: row.close,
            adjClose: row.adjClose,
            prevDate: null,
            prevClose: null,
          });
        } else {
          const cur = out[out.length - 1]!;
          cur.prevDate = row.date;
          cur.prevClose = row.close;
        }
      }
      return out;
    },

    /** Deletes bars strictly older than `olderThan` (YYYY-MM-DD). Returns rows deleted. */
    async prune(olderThan: string): Promise<number> {
      const rows = await db
        .delete(pricesEod)
        .where(lt(pricesEod.date, olderThan))
        .returning({ ticker: pricesEod.ticker });
      return rows.length;
    },
  };
}
