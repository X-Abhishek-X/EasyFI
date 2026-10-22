import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../client';
import { holdings, portfolios, type AccountType, type Holding } from '../schema';
import { chunk, isUuid, textArray } from '../util';

export interface HoldingInput {
  ticker: string;
  shares: number;
  accountType?: AccountType;
  costBasis?: number | null;
  statementValue?: number | null;
  statementDate?: string | null;
  statementKind?: string | null;
  tags?: string[];
}

export function holdingsRepo(db: Db) {
  const ownsPortfolio = async (userId: string, portfolioId: string) => {
    if (!isUuid(portfolioId)) return false;
    const [row] = await db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(and(eq(portfolios.userId, userId), eq(portfolios.id, portfolioId)));
    return !!row;
  };
  const owned = (userId: string, id: string) =>
    and(eq(holdings.userId, userId), eq(holdings.id, id));
  const validIds = (ids: readonly string[]) => ids.filter(isUuid);

  return {
    async list(userId: string, portfolioId: string): Promise<Holding[]> {
      if (!isUuid(portfolioId)) return [];
      return db
        .select()
        .from(holdings)
        .where(and(eq(holdings.userId, userId), eq(holdings.portfolioId, portfolioId)))
        .orderBy(asc(holdings.createdAt), asc(holdings.ticker));
    },

    async get(userId: string, id: string): Promise<Holding | null> {
      if (!isUuid(id)) return null;
      const [row] = await db.select().from(holdings).where(owned(userId, id));
      return row ?? null;
    },

    /** Returns null when the portfolio does not exist or belongs to someone else. */
    async create(
      userId: string,
      portfolioId: string,
      input: HoldingInput,
    ): Promise<Holding | null> {
      const rows = await this.bulkInsert(userId, portfolioId, [input]);
      return rows?.[0] ?? null;
    },

    /** CSV import path. Chunked; all-or-nothing. Null when the portfolio is not the user's. */
    async bulkInsert(
      userId: string,
      portfolioId: string,
      inputs: readonly HoldingInput[],
    ): Promise<Holding[] | null> {
      if (!(await ownsPortfolio(userId, portfolioId))) return null;
      if (inputs.length === 0) return [];
      return db.transaction(async (tx) => {
        const out: Holding[] = [];
        for (const part of chunk(inputs)) {
          out.push(
            ...(await tx
              .insert(holdings)
              .values(part.map((h) => ({ ...h, userId, portfolioId })))
              .returning()),
          );
        }
        return out;
      });
    },

    async update(
      userId: string,
      id: string,
      patch: Partial<HoldingInput>,
    ): Promise<Holding | null> {
      if (!isUuid(id)) return null;
      const [row] = await db.update(holdings).set(patch).where(owned(userId, id)).returning();
      return row ?? null;
    },

    async delete(userId: string, id: string): Promise<boolean> {
      if (!isUuid(id)) return false;
      const rows = await db
        .delete(holdings)
        .where(owned(userId, id))
        .returning({ id: holdings.id });
      return rows.length > 0;
    },

    /** Returns the number of the user's holdings deleted (others' ids are silently ignored). */
    async bulkDelete(userId: string, ids: readonly string[]): Promise<number> {
      const valid = validIds(ids);
      if (valid.length === 0) return 0;
      const rows = await db
        .delete(holdings)
        .where(and(eq(holdings.userId, userId), inArray(holdings.id, valid)))
        .returning({ id: holdings.id });
      return rows.length;
    },

    /** Adds then removes tags (deduped, sorted). Returns number of holdings updated. */
    async bulkTag(
      userId: string,
      ids: readonly string[],
      change: { add?: string[]; remove?: string[] },
    ): Promise<number> {
      const valid = validIds(ids);
      if (valid.length === 0) return 0;
      const add = textArray(change.add ?? []);
      const remove = textArray(change.remove ?? []);
      const rows = await db
        .update(holdings)
        .set({
          tags: sql`array(select distinct t from unnest(${holdings.tags} || ${add}) as t where t <> all(${remove}) order by t)`,
        })
        .where(and(eq(holdings.userId, userId), inArray(holdings.id, valid)))
        .returning({ id: holdings.id });
      return rows.length;
    },
  };
}
