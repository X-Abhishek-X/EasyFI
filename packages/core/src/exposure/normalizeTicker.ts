import {
  CASH_ALIASES,
  CASH_TICKER,
  CRYPTO_SYMBOLS,
  MONEY_MARKET_TICKERS,
  SHARE_CLASS_ALIASES,
} from './constants';

const CASH_SET = new Set([...MONEY_MARKET_TICKERS, ...CASH_ALIASES]);
const CRYPTO_SET = new Set(CRYPTO_SYMBOLS);

const PREFIXED_PAIR = /^X:([A-Z0-9]+?)(?:USDT|USDC|USD)$/;
const SEPARATED_PAIR = /^([A-Z0-9]+)[-/](?:USDT|USDC|USD)$/;
const JOINED_PAIR = /^([A-Z0-9]+?)(?:USDT|USDC|USD)$/;
const SHARE_CLASS = /^([A-Z]{1,5})[\s\-/.]([A-Z])$/;

function cleanup(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^\$/, '')
    .replace(/\*+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cryptoBase(s: string): string | null {
  const prefixed = PREFIXED_PAIR.exec(s) ?? SEPARATED_PAIR.exec(s);
  if (prefixed) return prefixed[1]!;
  const joined = JOINED_PAIR.exec(s);
  if (joined && CRYPTO_SET.has(joined[1]!)) return joined[1]!;
  return null;
}

/**
 * Canonical ticker used everywhere in look-through:
 * - uppercase / trimmed, broker decorations ($, trailing **) removed
 * - money-market funds and cash aliases → 'CASH'
 * - crypto pairs (BTC-USD, X:BTCUSD, BTCUSD) → base symbol ('BTC')
 * - share classes (BRK-B, BRK/B, BRK B, BRKB) → dotted form ('BRK.B')
 */
export function normalizeTicker(raw: string): string {
  const s = cleanup(raw);
  if (s === '') return '';
  if (CASH_SET.has(s)) return CASH_TICKER;
  const crypto = cryptoBase(s);
  if (crypto) return crypto;
  const alias = SHARE_CLASS_ALIASES[s];
  if (alias) return alias;
  const cls = SHARE_CLASS.exec(s);
  if (cls) return `${cls[1]}.${cls[2]}`;
  return s;
}

export function isCashTicker(raw: string): boolean {
  return normalizeTicker(raw) === CASH_TICKER;
}
