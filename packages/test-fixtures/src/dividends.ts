// Dividend history (2 years back) plus projected/declared ex-dates through 2026-12-31.
import { addDays, hashSeed, isWeekday, mulberry32 } from './prng';

export interface FixtureDividendEvent {
  ticker: string;
  exDate: string;
  payDate: string | null;
  amount: number;
}

export const DIVIDENDS_START = '2024-10-01';
export const DIVIDENDS_END = '2026-12-31';

interface Schedule {
  ticker: string;
  /** Calendar months (1–12) with an ex-date. */
  months: number[];
  /** Day of month for the ex-date (moved back to the previous weekday if needed). */
  day: number;
  /** Per-share amount for 2026 payments. */
  amount2026: number;
  /** Annual dividend growth; earlier years are discounted by it. */
  growth: number;
  /** Relative per-payment noise (ETF distributions vary; stocks are flat within a year). */
  jitter: number;
  payLag: number;
}

const Q_MAR = [3, 6, 9, 12];
const Q_FEB = [2, 5, 8, 11];
const MONTHLY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const SCHEDULES: Schedule[] = [
  {
    ticker: 'VOO',
    months: Q_MAR,
    day: 26,
    amount2026: 1.74,
    growth: 0.04,
    jitter: 0.06,
    payLag: 4,
  },
  {
    ticker: 'VTI',
    months: Q_MAR,
    day: 26,
    amount2026: 0.95,
    growth: 0.04,
    jitter: 0.06,
    payLag: 4,
  },
  {
    ticker: 'VYM',
    months: Q_MAR,
    day: 20,
    amount2026: 0.86,
    growth: 0.05,
    jitter: 0.07,
    payLag: 5,
  },
  { ticker: 'VGT', months: Q_MAR, day: 26, amount2026: 0.8, growth: 0.06, jitter: 0.1, payLag: 4 },
  {
    ticker: 'SCHD',
    months: Q_MAR,
    day: 24,
    amount2026: 0.26,
    growth: 0.07,
    jitter: 0.06,
    payLag: 5,
  },
  {
    ticker: 'SCHG',
    months: Q_MAR,
    day: 24,
    amount2026: 0.03,
    growth: 0.05,
    jitter: 0.1,
    payLag: 5,
  },
  {
    ticker: 'QQQ',
    months: Q_MAR,
    day: 22,
    amount2026: 0.72,
    growth: 0.08,
    jitter: 0.08,
    payLag: 9,
  },
  {
    ticker: 'QQQM',
    months: Q_MAR,
    day: 22,
    amount2026: 0.3,
    growth: 0.08,
    jitter: 0.08,
    payLag: 9,
  },
  {
    ticker: 'SPMO',
    months: Q_MAR,
    day: 22,
    amount2026: 0.15,
    growth: 0.05,
    jitter: 0.12,
    payLag: 4,
  },
  {
    ticker: 'FXAIX',
    months: [4, 7, 10, 12],
    day: 8,
    amount2026: 0.7,
    growth: 0.04,
    jitter: 0.06,
    payLag: 0,
  },
  { ticker: 'JEPI', months: MONTHLY, day: 1, amount2026: 0.4, growth: 0, jitter: 0.12, payLag: 4 },
  { ticker: 'AAPL', months: Q_FEB, day: 11, amount2026: 0.27, growth: 0.04, jitter: 0, payLag: 3 },
  { ticker: 'MSFT', months: Q_FEB, day: 20, amount2026: 0.91, growth: 0.1, jitter: 0, payLag: 21 },
  { ticker: 'JNJ', months: Q_FEB, day: 25, amount2026: 1.3, growth: 0.05, jitter: 0, payLag: 14 },
  {
    ticker: 'KO',
    months: [3, 6, 9, 11],
    day: 14,
    amount2026: 0.53,
    growth: 0.05,
    jitter: 0,
    payLag: 18,
  },
  { ticker: 'PEP', months: Q_MAR, day: 5, amount2026: 1.42, growth: 0.05, jitter: 0, payLag: 26 },
  { ticker: 'GOOGL', months: Q_MAR, day: 9, amount2026: 0.21, growth: 0.05, jitter: 0, payLag: 6 },
  { ticker: 'NVDA', months: Q_MAR, day: 5, amount2026: 0.01, growth: 0, jitter: 0, payLag: 27 },
];

const pad = (n: number): string => String(n).padStart(2, '0');

function previousWeekday(date: string): string {
  let d = date;
  while (!isWeekday(d)) d = addDays(d, -1);
  return d;
}

function nextWeekday(date: string): string {
  let d = date;
  while (!isWeekday(d)) d = addDays(d, 1);
  return d;
}

function eventsFor(s: Schedule): FixtureDividendEvent[] {
  const rand = mulberry32(hashSeed(`div:${s.ticker}`));
  const out: FixtureDividendEvent[] = [];
  for (let year = 2024; year <= 2026; year++) {
    const base = s.amount2026 / Math.pow(1 + s.growth, 2026 - year);
    for (const month of s.months) {
      const exDate = previousWeekday(`${year}-${pad(month)}-${pad(s.day)}`);
      const noise = 1 + (rand() * 2 - 1) * s.jitter;
      if (exDate < DIVIDENDS_START || exDate > DIVIDENDS_END) continue;
      const payDate = nextWeekday(addDays(exDate, s.payLag));
      const amount = Math.round(base * noise * 10000) / 10000;
      out.push({ ticker: s.ticker, exDate, payDate, amount });
    }
  }
  return out;
}

export const dividends: FixtureDividendEvent[] = SCHEDULES.flatMap(eventsFor).sort(
  (a, b) => a.exDate.localeCompare(b.exDate) || a.ticker.localeCompare(b.ticker),
);

export function dividendsFor(ticker: string): FixtureDividendEvent[] {
  return dividends.filter((d) => d.ticker === ticker);
}
