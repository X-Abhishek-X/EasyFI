import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, type DbHandle } from './client';
import { runMigrations } from './migrate';
import { createRepos } from './repos';
import { queryRows } from './util';

// Opt-in: point TEST_DATABASE_URL at a DISPOSABLE Postgres (it migrates the public schema).
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('real Postgres (postgres-js)', () => {
  let h: DbHandle;
  beforeAll(async () => {
    h = createDb({ databaseUrl: url });
    await runMigrations(h);
  });
  afterAll(() => h?.close());

  it('applies migrations with RLS on every table', async () => {
    const off = await queryRows<{ relname: string }>(
      h.db,
      sql`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(off).toEqual([]);
  });

  it('round-trips dates as strings and numerics as numbers', async () => {
    const r = createRepos(h.db);
    await r.prices.upsertBatch([{ ticker: 'ZZTEST', date: '2026-10-21', close: 1.5 }]);
    const [p] = await r.prices.latest(['ZZTEST']);
    expect(p).toMatchObject({ date: '2026-10-21', close: 1.5 });
    await r.prices.prune('2100-01-01');
  });
});
