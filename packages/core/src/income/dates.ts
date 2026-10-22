// Small UTC date helpers for 'YYYY-MM-DD' / 'YYYY-MM' strings. Pure, no Date.now().

const MS_PER_DAY = 86_400_000;

function parse(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function fmt(y: number, m: number, d: number): string {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

/** Days since the Unix epoch (UTC). */
export function toDayNumber(date: string): number {
  const { y, m, d } = parse(date);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromDayNumber(n: number): string {
  const dt = new Date(n * MS_PER_DAY);
  return fmt(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days);
}

/** b - a in days. */
export function daysBetween(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Adds calendar months, clamping the day to the end of the target month. */
export function addMonths(date: string, months: number): string {
  const { y, m, d } = parse(date);
  const idx = y * 12 + (m - 1) + months;
  const ny = Math.floor(idx / 12);
  const nm = idx - ny * 12 + 1;
  return fmt(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

/** 'YYYY-MM-DD' → 'YYYY-MM'. */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Adds months to a 'YYYY-MM' key. */
export function addMonthKey(key: string, months: number): string {
  return addMonths(`${key}-01`, months).slice(0, 7);
}
