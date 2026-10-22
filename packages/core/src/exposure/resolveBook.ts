import type { FundHoldingsMap, FundHoldingsSnapshot, Security } from '../types';
import { EQUIVALENT_FUND_GROUPS, FUND_EQUIVALENTS } from './constants';

export interface ResolvedBook {
  /** Ticker whose snapshot is used (the fund itself, or an equivalent). */
  bookTicker: string;
  snapshot: FundHoldingsSnapshot;
}

/** A fund's own holdings book, else the first equivalent fund's book (FXAIX → IVV/VOO). */
export function resolveBook(
  ticker: string,
  fundHoldings: FundHoldingsMap,
  equivalents: Readonly<Record<string, readonly string[]>> = FUND_EQUIVALENTS,
): ResolvedBook | null {
  const own = fundHoldings[ticker];
  if (own) return { bookTicker: ticker, snapshot: own };
  for (const alt of equivalents[ticker] ?? []) {
    const snap = fundHoldings[alt];
    if (snap) return { bookTicker: alt, snapshot: snap };
  }
  return null;
}

/** Canonical member of a ticker's equivalence group (VOO for FXAIX, QQQ for QQQM). */
export function canonicalFund(ticker: string): string {
  for (const group of Object.values(EQUIVALENT_FUND_GROUPS)) {
    if (group.includes(ticker)) return group[0]!;
  }
  return ticker;
}

export function isFundSecurity(security: Security | undefined): boolean {
  return security?.type === 'etf' || security?.type === 'mutual_fund';
}
