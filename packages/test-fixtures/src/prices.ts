// Deterministic EOD price generator: a seeded random walk over weekdays, solved backwards so
// the final close (PRICE_AS_OF) lands exactly on a realistic anchor.
import { gaussian, hashSeed, mulberry32, weekdays } from './prng';

export interface FixturePricePoint {
  ticker: string;
  date: string;
  close: number;
}

export type FixtureLatestPrices = Record<
  string,
  { close: number; date: string; prevClose?: number }
>;

export const PRICE_AS_OF = '2026-09-30';
export const PRICE_START = '2024-10-01';

interface Anchor {
  /** Last close on PRICE_AS_OF. */
  close: number;
  /** Daily volatility (stdev of log returns). */
  vol: number;
  /** Expected annual return used as drift. */
  annual: number;
}

const fund = (close: number, vol = 0.011, annual = 0.12): Anchor => ({ close, vol, annual });
const stock = (close: number, vol = 0.018, annual = 0.15): Anchor => ({ close, vol, annual });

export const PRICE_ANCHORS: Record<string, Anchor> = {
  VOO: fund(560),
  VTI: fund(290),
  FXAIX: fund(210),
  QQQ: fund(520, 0.014, 0.16),
  QQQM: fund(214, 0.014, 0.16),
  SCHG: fund(30.2, 0.014, 0.17),
  VGT: fund(650, 0.016, 0.18),
  SPMO: fund(115, 0.013, 0.2),
  SCHD: fund(27.5, 0.008, 0.05),
  VYM: fund(135, 0.008, 0.08),
  JEPI: fund(57.2, 0.006, 0.02),
  GOOGL: stock(245, 0.019, 0.25),
  'BRK.B': stock(490, 0.011, 0.12),
  MSFT: stock(510, 0.015, 0.14),
  NVDA: stock(180, 0.03, 0.4),
  AAPL: stock(245, 0.016, 0.1),
  AMZN: stock(225, 0.02, 0.15),
  META: stock(740, 0.022, 0.25),
  JNJ: stock(175, 0.01, 0.05),
  KO: stock(68, 0.009, 0.06),
  PEP: stock(145, 0.011, -0.02),
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

function generate(ticker: string, anchor: Anchor): FixturePricePoint[] {
  const dates = weekdays(PRICE_START, PRICE_AS_OF);
  const rand = mulberry32(hashSeed(`price:${ticker}`));
  const drift = Math.log(1 + anchor.annual) / 252 - (anchor.vol * anchor.vol) / 2;
  const closes = new Array<number>(dates.length);
  closes[dates.length - 1] = anchor.close;
  for (let i = dates.length - 1; i > 0; i--) {
    const r = drift + anchor.vol * gaussian(rand);
    closes[i - 1] = closes[i]! / Math.exp(r);
  }
  return dates.map((date, i) => ({ ticker, date, close: round2(closes[i]!) }));
}

const cache = new Map<string, FixturePricePoint[]>();

/** Daily closes for a ticker (oldest first). Unknown ticker → empty array (unpriced). */
export function priceHistory(ticker: string): FixturePricePoint[] {
  const anchor = PRICE_ANCHORS[ticker];
  if (!anchor) return [];
  let series = cache.get(ticker);
  if (!series) {
    series = generate(ticker, anchor);
    cache.set(ticker, series);
  }
  return series.map((p) => ({ ...p }));
}

export function pricedTickers(): string[] {
  return Object.keys(PRICE_ANCHORS);
}

export function allPriceHistory(): Record<string, FixturePricePoint[]> {
  const out: Record<string, FixturePricePoint[]> = {};
  for (const t of pricedTickers()) out[t] = priceHistory(t);
  return out;
}

export function latestPrices(): FixtureLatestPrices {
  const out: FixtureLatestPrices = {};
  for (const t of pricedTickers()) {
    const series = priceHistory(t);
    const last = series.at(-1)!;
    const prev = series.at(-2);
    out[t] = { close: last.close, date: last.date, ...(prev ? { prevClose: prev.close } : {}) };
  }
  return out;
}
