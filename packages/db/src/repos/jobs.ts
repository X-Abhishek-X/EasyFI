import { asc, desc, eq } from 'drizzle-orm';
import type { Db } from '../client';
import { holdings, jobRuns, type JobRun, type JobStatus } from '../schema';

export function jobsRepo(db: Db) {
  return {
    async start(name = 'nightly'): Promise<JobRun> {
      const [row] = await db.insert(jobRuns).values({ name }).returning();
      return row!;
    },

    async finish(
      id: string,
      result: {
        status: Exclude<JobStatus, 'running'>;
        counts?: Record<string, number>;
        errors?: unknown[];
      },
    ): Promise<JobRun | null> {
      const [row] = await db
        .update(jobRuns)
        .set({
          status: result.status,
          counts: result.counts ?? null,
          errors: result.errors ?? null,
          finishedAt: new Date(),
        })
        .where(eq(jobRuns.id, id))
        .returning();
      return row ?? null;
    },

    async latest(name = 'nightly'): Promise<JobRun | null> {
      const [row] = await db
        .select()
        .from(jobRuns)
        .where(eq(jobRuns.name, name))
        .orderBy(desc(jobRuns.startedAt))
        .limit(1);
      return row ?? null;
    },

    /** Job-only (crosses users): distinct tickers held in any portfolio, sorted. */
    async tickersInUse(): Promise<string[]> {
      const rows = await db
        .selectDistinct({ ticker: holdings.ticker })
        .from(holdings)
        .orderBy(asc(holdings.ticker));
      return rows.map((r) => r.ticker);
    },
  };
}
