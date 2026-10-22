/**
 * View-model types consumed by presentational components.
 * Shapes mirror what the /api/v1 client is expected to return:
 * camelCase, weights/percent changes as fractions (0–1), money as numbers (USD),
 * dates as ISO strings, and `asOf` on every market-derived number.
 * A `null` money/price means "unknown" and must render as "—", never $0.
 */

export type IsoDate = string;

/** One point on a value-over-time chart. */
export type ValuePoint = { date: IsoDate; value: number };

/** One slice of an allocation donut / legend row. */
export type AllocationSlice = {
  key: string;
  label: string;
  /** Fraction of total, 0–1. */
  weight: number;
  /** Today's change of this slice, fraction (e.g. -0.021). null = unknown. */
  changeToday?: number | null;
};

export type AllocationMode = 'sector' | 'holding' | 'overlap';

export type AllocationData = {
  mode: AllocationMode;
  slices: AllocationSlice[];
};

export type PortfolioType = 'actual' | 'hypothetical' | 'watchlist';

export type PortfolioSummary = {
  id: string;
  name: string;
  type: PortfolioType;
  /** null when any holding is unpriced and no value can be computed. */
  totalValue: number | null;
  holdingsCount: number;
  topHolding: { ticker: string; weight: number } | null;
  /** Diversification score 0–100. */
  diversificationScore: number | null;
  /** Sector (or holding) mix used for the colored strip. */
  mix: AllocationSlice[];
  asOf: IsoDate | null;
};

export type Severity = 'high' | 'medium' | 'low';

export type ExposureInsight = {
  id: string;
  severity: Severity;
  text: string;
  /** Question pre-filled into the Explorer when the user taps "Ask why". */
  askQuery: string;
};

export type MarketQuote = {
  ticker: string;
  name: string;
  /** Daily change, fraction. */
  change: number | null;
  asOf: IsoDate | null;
};

export type Concentration = 'high' | 'medium' | 'low';

/** One fund's (or direct) contribution to an underlying company. */
export type ExposureSource = {
  /** Fund ticker, or "DIRECT" for a directly held position. */
  sourceTicker: string;
  sourceName: string;
  /** Company weight inside that fund, fraction. null for direct holdings. */
  weightInFund: number | null;
  /** Contribution to the whole portfolio, fraction. */
  contribution: number;
};

/** One row of the look-through ("Stack") list, folded by company/sector/industry. */
export type ExposureRow = {
  key: string;
  /** Ticker for company fold; null for sector/industry fold. */
  ticker: string | null;
  name: string;
  sector: string | null;
  industry: string | null;
  /** Effective weight across the portfolio, fraction. */
  weight: number;
  /** Effective dollar exposure; null when unpriced. */
  value: number | null;
  concentration: Concentration;
  sources: ExposureSource[];
};

export type FoldBy = 'company' | 'sector' | 'industry';
export type LookThroughView = 'stack' | 'constellation';

/** Fund metadata used for consistent colors and legends. */
export type FundRef = { ticker: string; name: string };
