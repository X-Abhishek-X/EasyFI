// MOCK DATA — Dividends. Replace with GET /api/v1/income (kpis, calendar, leaders, holdings).
import type {
  AccountType,
  DividendKpis,
  DividendPayment,
  HoldingIncomeRow,
  IncomeMonth,
  YieldLeader,
} from '@/components/dividends/types';

export const DIVIDENDS_AS_OF = '2026-09-30';

type Payer = {
  ticker: string;
  name: string;
  shares: number;
  perShare: number;
  months: number[]; // 1-12
  day: number;
  account: AccountType;
};

const payers: Payer[] = [
  {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity',
    shares: 200,
    perShare: 0.74,
    months: [3, 6, 9, 12],
    day: 26,
    account: 'taxable',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    shares: 75,
    perShare: 1.76,
    months: [3, 6, 9, 12],
    day: 29,
    account: 'roth_ira',
  },
  {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield',
    shares: 101,
    perShare: 0.85,
    months: [3, 6, 9, 12],
    day: 24,
    account: 'taxable',
  },
  {
    ticker: 'QQQM',
    name: 'Invesco Nasdaq 100',
    shares: 95,
    perShare: 0.47,
    months: [3, 6, 9, 12],
    day: 30,
    account: 'taxable',
  },
  {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income',
    shares: 136,
    perShare: 0.33,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    day: 5,
    account: 'traditional_ira',
  },
];

function monthsFrom(startIso: string, count: number) {
  const [y, m] = startIso.split('-').map(Number) as [number, number];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return {
      iso: d.toISOString().slice(0, 7),
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
    };
  });
}

/** Oct 2025 – Sep 2026 received, Oct 2026 – Mar 2027 projected. */
export const incomeCalendar: IncomeMonth[] = monthsFrom('2025-10', 18).map(
  ({ iso, month }, idx) => {
    const status: DividendPayment['status'] = idx < 12 ? 'received' : 'projected';
    const payments: DividendPayment[] = payers
      .filter((p) => p.months.includes(month))
      .map((p) => {
        // small quarter-to-quarter variation so bars aren't identical
        const wiggle = 1 + (((idx * 7 + p.ticker.length * 3) % 5) - 2) * 0.012;
        const perShare = Math.round(p.perShare * wiggle * 100) / 100;
        return {
          id: `${p.ticker}-${iso}`,
          ticker: p.ticker,
          name: p.name,
          payDate: `${iso}-${String(p.day).padStart(2, '0')}`,
          perShare,
          amount: Math.round(perShare * p.shares * 100) / 100,
          account: p.account,
          status,
        };
      })
      .sort((a, b) => a.payDate.localeCompare(b.payDate));
    const total = Math.round(payments.reduce((s, p) => s + (p.amount ?? 0), 0));
    return {
      month: iso,
      received: status === 'received' ? total : null,
      projected: status === 'projected' ? total : null,
      payments,
    };
  },
);

export const yieldLeaders: YieldLeader[] = [
  { ticker: 'QYLD', name: 'Global X Nasdaq 100 Covered Call', yield: 0.112, frequency: 'monthly' },
  { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income', yield: 0.071, frequency: 'monthly' },
  { ticker: 'SCHD', name: 'Schwab US Dividend Equity', yield: 0.036, frequency: 'quarterly' },
  { ticker: 'DVY', name: 'iShares Select Dividend', yield: 0.034, frequency: 'quarterly' },
  { ticker: 'VYM', name: 'Vanguard High Dividend Yield', yield: 0.029, frequency: 'quarterly' },
];

export const holdingsIncome: HoldingIncomeRow[] = [
  {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity',
    annualIncome: 592,
    yield: 0.036,
    yieldOnCost: 0.041,
    shareOfIncome: 0.271,
    frequency: 'quarterly',
  },
  {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income',
    annualIncome: 539,
    yield: 0.071,
    yieldOnCost: 0.074,
    shareOfIncome: 0.247,
    frequency: 'monthly',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    annualIncome: 528,
    yield: 0.0124,
    yieldOnCost: 0.0178,
    shareOfIncome: 0.242,
    frequency: 'quarterly',
  },
  {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield',
    annualIncome: 343,
    yield: 0.029,
    yieldOnCost: 0.033,
    shareOfIncome: 0.157,
    frequency: 'quarterly',
  },
  {
    ticker: 'QQQM',
    name: 'Invesco Nasdaq 100',
    annualIncome: 179,
    yield: 0.0058,
    yieldOnCost: 0.0081,
    shareOfIncome: 0.082,
    frequency: 'quarterly',
  },
];

export const dividendKpis: DividendKpis = {
  // Sum of the 12 received months above (≈ $2,184) so the KPI and calendar agree.
  trailing12m: incomeCalendar.reduce((s, m) => s + (m.received ?? 0), 0),
  trailing12mChange: 0.082,
  portfolioYield: 0.029,
  next30Days: 186,
  asOf: DIVIDENDS_AS_OF,
};
