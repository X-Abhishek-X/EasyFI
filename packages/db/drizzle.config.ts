import { defineConfig } from 'drizzle-kit';

// `db:generate` only needs schema + out. `db:migrate` targets DATABASE_URL (Supabase: use the
// session pooler / direct URL) or, when unset, a local PGlite data dir (EASYFI_DATA_DIR).
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(url
    ? { dbCredentials: { url } }
    : {
        driver: 'pglite' as const,
        dbCredentials: { url: process.env.EASYFI_DATA_DIR ?? '../../.easyfi-data' },
      }),
});
