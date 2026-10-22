import { getTableColumns, sql, type Column, type SQL, type Table } from 'drizzle-orm';
import type { Db } from './client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Malformed ids are treated as "not found" instead of surfacing a Postgres cast error. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function chunk<T>(items: readonly T[], size = 1000): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** A text[] literal built from bound params (drizzle would otherwise spread a JS array as a list). */
export function textArray(values: readonly string[]): SQL {
  if (values.length === 0) return sql`'{}'::text[]`;
  return sql`ARRAY[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )}]::text[]`;
}

/** Rows of a raw query, normalised across PGlite ({ rows }) and postgres-js (array). */
export async function queryRows<T>(db: Db, query: SQL): Promise<T[]> {
  const res = (await db.execute(query)) as unknown as T[] | { rows: T[] };
  return Array.isArray(res) ? res : res.rows;
}

/** Escape LIKE/ILIKE wildcards in user input. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** `SET col = excluded.col` for an upsert, keyed by the Drizzle property names given. */
export function excludedSet<T extends Table, K extends keyof T['_']['columns'] & string>(
  table: T,
  keys: readonly K[],
): Record<K, SQL> {
  const columns = getTableColumns(table) as Record<string, Column>;
  const out = {} as Record<K, SQL>;
  for (const k of keys) out[k] = sql.raw(`excluded."${columns[k]!.name}"`);
  return out;
}
