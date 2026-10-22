import type { AssetBucket, FundHoldingsMap, Holding, LatestPrices, SecurityMap } from '../types';

// ---------- valuation ----------

export type ValueSource = 'market' | 'statement' | 'unpriced';

export interface ValuedHolding {
  holding: Holding;
  /** Normalised ticker. */
  ticker: string;
  valueSource: ValueSource;
  price: number | null;
  priceDate: string | null;
  /** Null when unpriced (never 0). */
  value: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  gain: number | null;
  gainPct: number | null;
}

export interface HoldingsValuation {
  lines: ValuedHolding[];
  /** Market + statement value of every valued line (unpriced lines excluded). */
  totalValue: number;
  marketValue: number;
  statementValue: number;
  /** Day change over lines with a market price and prevClose only. */
  dayChange: number;
  dayChangePct: number | null;
  /** Cost basis / gain over lines that have both a value and a cost basis. */
  costBasis: number;
  gain: number;
  gainPct: number | null;
  /** Tickers with neither a price nor a statement value. */
  unpriced: string[];
  /** Oldest price date used (null when nothing is market-priced). */
  asOf: string | null;
}

// ---------- look-through ----------

export interface LookThroughInput {
  holdings: Holding[];
  /** Uninvested cash balance of the portfolio(s). */
  cash?: number;
  fundHoldings: FundHoldingsMap;
  prices: LatestPrices;
  securities: SecurityMap;
  /** Override for index-fund equivalence (defaults to FUND_EQUIVALENTS). */
  equivalents?: Readonly<Record<string, readonly string[]>>;
  /** Fund-of-funds recursion limit (defaults to DEFAULT_LOOK_THROUGH_DEPTH). */
  maxDepth?: number;
}

/**
 * company  – an operating company (stock), held directly or via funds
 * fund     – a fund we could not look into further (nested beyond depth / no book)
 * asset    – a non-company direct asset (crypto, bond, other)
 * tail     – the unlisted remainder of a fund's book (1 − Σ listed weights), by sector
 * unmapped – a fund constituent without a ticker (CUSIP-only bond, ELN, swap …)
 * cash     – cash, money-market funds and fund cash lines
 */
export type ExposureKind = 'company' | 'fund' | 'asset' | 'tail' | 'unmapped' | 'cash';

export interface ExposureSource {
  /** Held fund ticker, or 'direct'. */
  via: string;
  value: number;
  /** Fraction of the held fund (product of weights for nested funds); null for direct. */
  weightInFund: number | null;
}

export interface Exposure {
  /** Stable unique key (ticker for companies, e.g. 'tail:VOO:Energy' otherwise). */
  key: string;
  ticker: string | null;
  name: string;
  kind: ExposureKind;
  sector: string | null;
  industry: string | null;
  assetBucket: AssetBucket;
  value: number;
  /** Fraction of LookThroughResult.totalValue. */
  weight: number;
  directValue: number;
  /** Sorted by value desc. */
  sources: ExposureSource[];
  /** Number of distinct funds contributing. */
  fundCount: number;
}

export interface UnresolvedReason {
  ticker: string;
  reason: string;
  value: number;
}

export interface UnresolvedSlice {
  value: number;
  weight: number;
  reasons: UnresolvedReason[];
}

export interface FundPosition {
  ticker: string;
  /** Ticker whose holdings book was used (differs for index-fund equivalents). */
  bookTicker: string;
  value: number;
  weight: number;
  asOf: string;
}

export interface LookThroughResult {
  /** Resolved + unresolved value (unpriced lines excluded). */
  totalValue: number;
  resolvedValue: number;
  /** Oldest market price date used. */
  asOf: string | null;
  /** Oldest fund holdings snapshot used. */
  holdingsAsOf: string | null;
  /** Sorted by value desc. Σ value = resolvedValue. */
  exposures: Exposure[];
  unresolved: UnresolvedSlice;
  /** Σ of all 'tail' exposures. */
  tail: { value: number; weight: number };
  /** Lines with no price and no statement value (excluded from every total). */
  unpriced: string[];
  /** Funds that were looked through. */
  funds: FundPosition[];
}

export type { FundHoldingsMap, LatestPrices, SecurityMap };
