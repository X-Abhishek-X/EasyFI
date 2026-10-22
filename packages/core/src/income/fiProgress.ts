import { monthlyRate } from './purchasingPower';

export interface FiProgressInput {
  currentValue: number;
  /** Annual spending in today's dollars. */
  annualExpenses: number;
  /** Safe withdrawal rate as a fraction. Default 0.04. */
  withdrawalRate?: number;
  /** Monthly contribution in today's dollars (assumed to rise with inflation). */
  monthlyContribution: number;
  /** Nominal annual growth rate (fraction). */
  growthRate: number;
  /** Annual inflation rate (fraction). */
  inflationRate: number;
  /** Give up projecting after this many years. Default 100. */
  maxYears?: number;
}

export interface FiProjectionPoint {
  year: number;
  /** Portfolio value in today's dollars. */
  real: number;
  nominal: number;
  /** FI number inflated to that year's dollars. */
  fiNumberNominal: number;
}

export interface FiProgressResult {
  /** Portfolio needed to retire, in today's dollars: annualExpenses / withdrawalRate. */
  fiNumber: number;
  /** currentValue / fiNumber (not capped at 1). */
  progress: number;
  realGrowthRate: number;
  /** Years until the real portfolio value reaches fiNumber (monthly resolution); null if never within maxYears. */
  yearsToFi: number | null;
  /** Yearly points from year 0 through max(ceil(yearsToFi), 10), capped at maxYears. */
  series: FiProjectionPoint[];
}

/**
 * FI progress, computed in real (today's-dollar) terms: growth is deflated by inflation using the
 * Fisher relation, and contributions are held constant in real terms.
 */
export function fiProgress(input: FiProgressInput): FiProgressResult {
  const {
    currentValue,
    annualExpenses,
    withdrawalRate = 0.04,
    monthlyContribution,
    growthRate,
    inflationRate,
    maxYears = 100,
  } = input;
  if (withdrawalRate <= 0) throw new RangeError('withdrawalRate must be > 0');
  if (inflationRate <= -1 || growthRate <= -1) throw new RangeError('rates must be > -100%');

  const fiNumber = annualExpenses / withdrawalRate;
  const progress = fiNumber > 0 ? currentValue / fiNumber : 1;
  const realGrowthRate = (1 + growthRate) / (1 + inflationRate) - 1;
  const r = monthlyRate(realGrowthRate);

  const yearEnd: number[] = [currentValue];
  let value = currentValue;
  let monthsToFi: number | null = value >= fiNumber ? 0 : null;
  for (let month = 1; month <= maxYears * 12; month++) {
    value = value * (1 + r) + monthlyContribution;
    if (monthsToFi === null && value >= fiNumber - 1e-9) monthsToFi = month;
    if (month % 12 === 0) yearEnd.push(value);
  }
  const yearsToFi = monthsToFi === null ? null : monthsToFi / 12;
  const horizon = Math.min(maxYears, Math.max(10, yearsToFi === null ? 0 : Math.ceil(yearsToFi)));

  const series: FiProjectionPoint[] = yearEnd.slice(0, horizon + 1).map((real, year) => {
    const inflator = (1 + inflationRate) ** year;
    return { year, real, nominal: real * inflator, fiNumberNominal: fiNumber * inflator };
  });

  return { fiNumber, progress, realGrowthRate, yearsToFi, series };
}
