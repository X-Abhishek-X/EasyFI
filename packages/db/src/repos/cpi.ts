import { and, asc, gte, inArray } from 'drizzle-orm';
import type { Db } from '../client';
import { cpiSeries, type CpiPoint } from '../schema';
import { chunk, excludedSet } from '../util';

export interface CpiInput {
  seriesId: string;
  /** 'YYYY-MM' */
  period: string;
  value: number;
}

export function cpiRepo(db: Db) {
  return {
    async upsert(rows: readonly CpiInput[]): Promise<void> {
      for (const part of chunk(rows)) {
        await db
          .insert(cpiSeries)
          .values([...part])
          .onConflictDoUpdate({
            target: [cpiSeries.seriesId, cpiSeries.period],
            set: excludedSet(cpiSeries, ['value'] as const),
          });
      }
    },

    async list(seriesIds: readonly string[], fromPeriod?: string): Promise<CpiPoint[]> {
      if (seriesIds.length === 0) return [];
      return db
        .select()
        .from(cpiSeries)
        .where(
          and(
            inArray(cpiSeries.seriesId, [...seriesIds]),
            fromPeriod ? gte(cpiSeries.period, fromPeriod) : undefined,
          ),
        )
        .orderBy(asc(cpiSeries.seriesId), asc(cpiSeries.period));
    },
  };
}
