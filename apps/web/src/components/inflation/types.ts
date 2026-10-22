export type CpiPoint = { period: string; yoy: number };

/** Headline CPI. `period` is "YYYY-MM"; rates are fractions. */
export type CpiSnapshot = {
  period: string;
  yoy: number | null;
  mom: number | null;
  coreYoy: number | null;
  asOf: string | null;
  history: CpiPoint[];
};

/** One CPI component: year-over-year change and relative weight in the basket (fractions). */
export type CpiCategory = { key: string; label: string; yoy: number | null; weight: number };

export type PurchasingPowerInput = {
  amount: number;
  monthlyContribution: number;
  inflationRate: number;
  growthRate: number;
  years: number;
};

export type PurchasingPowerPoint = {
  year: number;
  nominal: number;
  real: number;
  contributed: number;
};
