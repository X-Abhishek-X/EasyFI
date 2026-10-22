const NULL_TOKENS = new Set(['', '-', '--', '---', 'n/a', 'na', 'none', 'null', 'nan']);
const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

/**
 * Paste-friendly money/number parser.
 * Accepts "$1,234.50", "+$12.34", "-$5", "$-5", "(123.45)" (negative), "1.2k" / "2.5M" / "1b",
 * unicode minus, and a trailing "USD". Returns null for blanks, "--", "n/a", percentages
 * and anything unparseable — never 0 for a missing value.
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;

  let s = input.trim().replace(/−/g, '-');
  if (NULL_TOKENS.has(s.toLowerCase())) return null;
  if (s.includes('%')) return null;

  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/usd$/i, '').replace(/[$,\s]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('-')) {
    negative = !negative;
    s = s.slice(1);
  }

  let multiplier = 1;
  const last = s.slice(-1).toLowerCase();
  if (last in SUFFIX) {
    multiplier = SUFFIX[last]!;
    s = s.slice(0, -1);
  }

  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s) * multiplier;
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}
