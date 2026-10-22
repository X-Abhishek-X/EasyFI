export type PayoutFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type AccountType =
  'taxable' | 'traditional_ira' | 'roth_ira' | '401k' | 'roth_401k' | 'other';

/** One distribution, received or projected. Money in USD. */
export type DividendPayment = {
  id: string;
  ticker: string;
  name: string;
  /** ISO pay date. */
  payDate: string;
  perShare: number | null;
  /** Total amount; null if the per-share amount is not yet announced and shares unknown. */
  amount: number | null;
  account: AccountType;
  status: 'received' | 'projected';
};

export type IncomeMonth = {
  /** ISO month "2026-08". */
  month: string;
  received: number | null;
  projected: number | null;
  payments: DividendPayment[];
};

export type DividendKpis = {
  trailing12m: number | null;
  /** Change vs the prior 12 months, fraction. */
  trailing12mChange: number | null;
  /** Portfolio yield on market value, fraction. */
  portfolioYield: number | null;
  next30Days: number | null;
  asOf: string | null;
};

export type YieldLeader = {
  ticker: string;
  name: string;
  /** Trailing yield, fraction. */
  yield: number | null;
  frequency: PayoutFrequency;
};

export type HoldingIncomeRow = {
  ticker: string;
  name: string;
  annualIncome: number | null;
  /** Fractions. */
  yield: number | null;
  yieldOnCost: number | null;
  shareOfIncome: number | null;
  frequency: PayoutFrequency;
};

export const FREQUENCY_LABEL: Record<PayoutFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semiannual',
  annual: 'Annual',
};

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  taxable: 'Taxable',
  traditional_ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  roth_401k: 'Roth 401(k)',
  other: 'Other',
};
