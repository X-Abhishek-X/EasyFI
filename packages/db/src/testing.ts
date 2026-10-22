import { createDb, type DbHandle } from './client';
import { runMigrations } from './migrate';

/** Fresh in-memory PGlite with all migrations applied. Call once per test file (beforeAll). */
export async function createTestDb(): Promise<DbHandle> {
  const handle = createDb();
  await runMigrations(handle);
  return handle;
}
