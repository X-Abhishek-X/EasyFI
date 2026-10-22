import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Schema = typeof schema;

/** Driver-agnostic Drizzle database (PGlite or postgres-js). Repos take this. */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

export interface DbHandle {
  db: Db;
  driver: 'postgres' | 'pglite';
  close(): Promise<void>;
}

export interface CreateDbOptions {
  /** Postgres connection string. When set, postgres-js is used. */
  databaseUrl?: string;
  /**
   * PGlite only: directory for on-disk persistence (e.g. '.easyfi-data'). Omit for in-memory.
   */
  dataDir?: string;
  /**
   * postgres-js only: use prepared statements. Defaults to false, which is required behind the
   * Supabase transaction pooler (port 6543) and harmless elsewhere.
   */
  prepare?: boolean;
  /** postgres-js only: max pool size (default 5; serverless functions should keep this small). */
  max?: number;
}

export function createDb(options: CreateDbOptions = {}): DbHandle {
  if (options.databaseUrl) {
    const client = postgres(options.databaseUrl, {
      prepare: options.prepare ?? false,
      max: options.max ?? 5,
      onnotice: () => {},
    });
    const db = drizzlePostgres(client, { schema }) as unknown as Db;
    return { db, driver: 'postgres', close: () => client.end() };
  }
  const client = options.dataDir ? new PGlite(options.dataDir) : new PGlite();
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  return { db, driver: 'pglite', close: () => client.close() };
}
