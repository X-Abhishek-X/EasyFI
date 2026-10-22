export interface PurchasingPowerInput {
  /** Starting amount in today's USD. */
  amount: number;
  /** Contribution added at the end of every month (nominal USD). */
  monthlyContribution: number;
  /** Annual inflation rate as a fraction (0.03 = 3%). */
  inflationRate: number;
  /** Annual nominal growth rate as a fraction; compounded monthly at the equivalent rate. */
  growthRate: number;
  /** Whole number of years to project. */
  years: number;
}

export interface PurchasingPowerRow {
  year: number;
  /** Starting amount plus all contributions to date (nominal). */
  contributed: number;
  nominal: number;
  /** Nominal deflated to today's dollars. */
  real: number;
}

export interface PurchasingPowerResult {
  rows: PurchasingPowerRow[];
  finalNominal: number;
  finalReal: number;
  /** What `amount` buys after `years` if left uninvested (today's dollars). */
  purchasingPowerOfAmount: number;
  /** Nominal dollars needed after `years` to buy what `amount` buys today. */
  amountNeededToMatch: number;
}

export function monthlyRate(annual: number): number {
  return (1 + annual) ** (1 / 12) - 1;
}

export function purchasingPower(input: PurchasingPowerInput): PurchasingPowerResult {
  const { amount, monthlyContribution, inflationRate, growthRate, years } = input;
  if (!Number.isInteger(years) || years < 0) throw new RangeError('years must be an integer ≥ 0');
  if (inflationRate <= -1 || growthRate <= -1) throw new RangeError('rates must be > -100%');

  const g = monthlyRate(growthRate);
  const rows: PurchasingPowerRow[] = [
    { year: 0, contributed: amount, nominal: amount, real: amount },
  ];
  let nominal = amount;
  let contributed = amount;
  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      nominal = nominal * (1 + g) + monthlyContribution;
      contributed += monthlyContribution;
    }
    rows.push({ year, contributed, nominal, real: nominal / (1 + inflationRate) ** year });
  }
  const last = rows[rows.length - 1]!;
  return {
    rows,
    finalNominal: last.nominal,
    finalReal: last.real,
    purchasingPowerOfAmount: amount / (1 + inflationRate) ** years,
    amountNeededToMatch: amount * (1 + inflationRate) ** years,
  };
}
