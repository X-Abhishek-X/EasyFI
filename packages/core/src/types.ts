// Shared domain types for @easyfi/core. All functions in this package are pure.
// Conventions:
//  - Money is a plain number in USD.
//  - Weights / percentages are fractions (0.091 = 9.1%), never 0–100.
//  - Dates are ISO strings 'YYYY-MM-DD'.

export type SecurityType = 'stock' | 'etf' | 'mutual_fund' | 'mmf' | 'crypto' | 'bond' | 'other';

export type AccountType = 'taxable' | 'trad_ira' | 'roth_ira' | '401k' | 'roth_401k' | 'other';

export type PortfolioType = 'actual' | 'hypothetical' | 'watchlist';

/** Broad asset bucket used by the "Assets" fold. */
export type AssetBucket = 'stocks' | 'bonds' | 'cash' | 'commodities' | 'crypto' | 'other';

export interface Security {
  ticker: string;
  name: string;
  type: SecurityType;
  sector: string | null;
  industry: string | null;
  /** Fraction, e.g. 0.0003 for 0.03%. */
  expenseRatio: number | null;
}

export interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  accountType: AccountType;
  shares: number | null;
  /** Total cost basis in USD for the line (not per share). */
  costBasis: number | null;
  /** For unpriced assets: value from a statement. Used when no market price exists. */
  statementValue: number | null;
  statementDate: string | null;
  tags: string[];
}

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  holdings: Holding[];
  cash: number;
}

/** One constituent of a fund (from N-PORT or issuer file). */
export interface FundConstituent {
  fundTicker: string;
  /** Null when the constituent could not be mapped to a ticker (e.g. CUSIP-only bond). */
  constituentTicker: string | null;
  name: string;
  /** Fraction of fund NAV. */
  weight: number;
  assetBucket: AssetBucket;
  sector: string | null;
  industry: string | null;
}

/** Fund holdings snapshot keyed by fund ticker. */
export interface FundHoldingsSnapshot {
  asOf: string;
  constituents: FundConstituent[];
  /**
   * Optional full-fund sector weights (fractions). When constituents are a partial list
   * (top N), the unlisted remainder (1 - Σ weights) is attributed to sectors using
   * sectorWeights minus the listed constituents' sector weights.
   */
  sectorWeights?: Record<string, number>;
}

export type FundHoldingsMap = Record<string, FundHoldingsSnapshot>;

export interface PricePoint {
  ticker: string;
  date: string;
  close: number;
}

/** Latest known price per ticker. Missing key = unpriced (never treat as 0). */
export type LatestPrices = Record<string, { close: number; date: string; prevClose?: number }>;

/** Security metadata keyed by ticker. */
export type SecurityMap = Record<string, Security>;

export interface DividendEvent {
  ticker: string;
  exDate: string;
  payDate: string | null;
  /** Per-share cash amount. */
  amount: number;
}

export interface CpiPoint {
  seriesId: string;
  /** 'YYYY-MM' */
  period: string;
  value: number;
}
