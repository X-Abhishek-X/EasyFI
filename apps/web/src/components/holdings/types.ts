/** View-model types for the holdings table and editors (mirrors /api/v1 holdings DTOs). */

export type HoldingType = 'etf' | 'mutual_fund' | 'stock' | 'cash' | 'bond' | 'crypto';

export type AccountType =
  'taxable' | 'traditional_ira' | 'roth_ira' | '401k' | 'roth_401k' | 'other';

export const HOLDING_TYPE_LABEL: Record<HoldingType, string> = {
  etf: 'ETF',
  mutual_fund: 'Mutual fund',
  stock: 'Stock',
  cash: 'Cash',
  bond: 'Bonds',
  crypto: 'Crypto',
};

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  taxable: 'Taxable',
  traditional_ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  roth_401k: 'Roth 401(k)',
  other: 'Other',
};

export type HoldingRow = {
  id: string;
  ticker: string;
  name: string;
  type: HoldingType;
  accountType: AccountType;
  shares: number | null;
  /** Last close; null = unpriced (statement-value line). */
  price: number | null;
  /** Market value; null when unpriced and no statement value. */
  value: number | null;
  costBasis: number | null;
  /** Today's change, fraction. */
  dayChange: number | null;
  /** Total return since cost basis, fraction. */
  totalReturn: number | null;
  /** Trailing yield, fraction. */
  yield: number | null;
  annualIncome: number | null;
  tags: string[];
  /** Share of this holding whose underlying constituents are known, fraction 0–1. */
  lookThroughCoverage: number | null;
  asOf: string | null;
};

export type AddHoldingInput = {
  ticker: string;
  accountType: AccountType;
  mode: 'shares' | 'dollars';
  amount: number | null;
  costBasis: number | null;
  tags: string[];
};

export type CsvBroker = 'auto' | 'fidelity' | 'schwab' | 'vanguard' | 'generic';

export type CsvImportInput = {
  broker: CsvBroker;
  /** Raw CSV text (pasted or read from the uploaded file). */
  csv: string;
};

export type TickerSuggestion = { ticker: string; name: string; type: HoldingType };
