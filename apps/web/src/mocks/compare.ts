// MOCK DATA — Compare. Replace with GET /api/v1/compare?a=…&b=… (fund sector weights + shared holdings).
import type { CompareFund, SharedHolding } from '@/components/compare/types';

export const COMPARE_AS_OF = '2026-09-05';

export const compareFunds: CompareFund[] = [
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500',
    asOf: COMPARE_AS_OF,
    holdingsCount: 504,
    sectors: [
      { key: 'tech', label: 'Technology', weight: 0.31 },
      { key: 'fin', label: 'Financials', weight: 0.13 },
      { key: 'hc', label: 'Health Care', weight: 0.12 },
      { key: 'cd', label: 'Consumer Disc.', weight: 0.1 },
      { key: 'comm', label: 'Communication', weight: 0.09 },
      { key: 'other', label: 'Other', weight: 0.25 },
    ],
    topHoldings: [
      { ticker: 'AAPL', name: 'Apple Inc', weight: 0.071 },
      { ticker: 'MSFT', name: 'Microsoft Corp', weight: 0.064 },
      { ticker: 'NVDA', name: 'NVIDIA Corp', weight: 0.059 },
      { ticker: 'AMZN', name: 'Amazon.com Inc', weight: 0.038 },
      { ticker: 'META', name: 'Meta Platforms Inc', weight: 0.024 },
      { ticker: 'AVGO', name: 'Broadcom Inc', weight: 0.021 },
      { ticker: 'GOOGL', name: 'Alphabet Inc Class A', weight: 0.02 },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc', weight: 0.018 },
      { ticker: 'TSLA', name: 'Tesla Inc', weight: 0.017 },
      { ticker: 'JPM', name: 'JPMorgan Chase & Co', weight: 0.014 },
    ],
  },
  {
    ticker: 'QQQ',
    name: 'Invesco Nasdaq 100',
    asOf: COMPARE_AS_OF,
    holdingsCount: 101,
    sectors: [
      { key: 'tech', label: 'Technology', weight: 0.51 },
      { key: 'comm', label: 'Communication', weight: 0.16 },
      { key: 'cd', label: 'Consumer Disc.', weight: 0.13 },
      { key: 'hc', label: 'Health Care', weight: 0.06 },
      { key: 'fin', label: 'Financials', weight: 0.01 },
      { key: 'other', label: 'Other', weight: 0.13 },
    ],
    topHoldings: [
      { ticker: 'AAPL', name: 'Apple Inc', weight: 0.124 },
      { ticker: 'MSFT', name: 'Microsoft Corp', weight: 0.108 },
      { ticker: 'NVDA', name: 'NVIDIA Corp', weight: 0.082 },
      { ticker: 'AMZN', name: 'Amazon.com Inc', weight: 0.051 },
      { ticker: 'META', name: 'Meta Platforms Inc', weight: 0.049 },
      { ticker: 'AVGO', name: 'Broadcom Inc', weight: 0.043 },
      { ticker: 'GOOGL', name: 'Alphabet Inc Class A', weight: 0.026 },
      { ticker: 'TSLA', name: 'Tesla Inc', weight: 0.025 },
      { ticker: 'COST', name: 'Costco Wholesale Corp', weight: 0.024 },
      { ticker: 'NFLX', name: 'Netflix Inc', weight: 0.02 },
    ],
  },
  {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity',
    asOf: COMPARE_AS_OF,
    holdingsCount: 103,
    sectors: [
      { key: 'staples', label: 'Consumer Staples', weight: 0.19 },
      { key: 'energy', label: 'Energy', weight: 0.2 },
      { key: 'hc', label: 'Health Care', weight: 0.16 },
      { key: 'ind', label: 'Industrials', weight: 0.13 },
      { key: 'fin', label: 'Financials', weight: 0.09 },
      { key: 'other', label: 'Other', weight: 0.23 },
    ],
    topHoldings: [
      { ticker: 'CVX', name: 'Chevron Corp', weight: 0.043 },
      { ticker: 'KO', name: 'Coca-Cola Co', weight: 0.042 },
      { ticker: 'ABBV', name: 'AbbVie Inc', weight: 0.041 },
      { ticker: 'PEP', name: 'PepsiCo Inc', weight: 0.04 },
      { ticker: 'HD', name: 'Home Depot Inc', weight: 0.04 },
      { ticker: 'CSCO', name: 'Cisco Systems Inc', weight: 0.039 },
      { ticker: 'AMGN', name: 'Amgen Inc', weight: 0.039 },
      { ticker: 'VZ', name: 'Verizon Communications', weight: 0.038 },
      { ticker: 'MO', name: 'Altria Group Inc', weight: 0.037 },
      { ticker: 'TXN', name: 'Texas Instruments Inc', weight: 0.036 },
    ],
  },
  {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market',
    asOf: COMPARE_AS_OF,
    holdingsCount: 3627,
    sectors: [
      { key: 'tech', label: 'Technology', weight: 0.3 },
      { key: 'fin', label: 'Financials', weight: 0.13 },
      { key: 'hc', label: 'Health Care', weight: 0.12 },
      { key: 'cd', label: 'Consumer Disc.', weight: 0.11 },
      { key: 'ind', label: 'Industrials', weight: 0.1 },
      { key: 'other', label: 'Other', weight: 0.24 },
    ],
    topHoldings: [
      { ticker: 'AAPL', name: 'Apple Inc', weight: 0.061 },
      { ticker: 'MSFT', name: 'Microsoft Corp', weight: 0.055 },
      { ticker: 'NVDA', name: 'NVIDIA Corp', weight: 0.051 },
      { ticker: 'AMZN', name: 'Amazon.com Inc', weight: 0.033 },
      { ticker: 'META', name: 'Meta Platforms Inc', weight: 0.021 },
    ],
  },
];

/** Shared holdings for the default VOO vs QQQ pair. */
export const sharedHoldings: SharedHolding[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc',
    sector: 'Information Technology',
    weightA: 0.071,
    weightB: 0.124,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp',
    sector: 'Information Technology',
    weightA: 0.064,
    weightB: 0.108,
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp',
    sector: 'Information Technology',
    weightA: 0.059,
    weightB: 0.082,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc',
    sector: 'Consumer Discretionary',
    weightA: 0.038,
    weightB: 0.051,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc',
    sector: 'Communication Services',
    weightA: 0.024,
    weightB: 0.049,
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom Inc',
    sector: 'Information Technology',
    weightA: 0.021,
    weightB: 0.043,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc',
    sector: 'Communication Services',
    weightA: 0.02,
    weightB: 0.026,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc',
    sector: 'Consumer Discretionary',
    weightA: 0.017,
    weightB: 0.025,
  },
  {
    ticker: 'COST',
    name: 'Costco Wholesale Corp',
    sector: 'Consumer Staples',
    weightA: 0.008,
    weightB: 0.024,
  },
  {
    ticker: 'NFLX',
    name: 'Netflix Inc',
    sector: 'Communication Services',
    weightA: 0.007,
    weightB: 0.02,
  },
];

export const overlapSummary = { sharedCount: 78, overlapByWeight: 0.43 };

/** MOCK resolver: the API will compute this server-side. */
export function getMockComparison(a: string, b: string) {
  const fundA = compareFunds.find((f) => f.ticker === a) ?? compareFunds[0]!;
  const fundB =
    compareFunds.find((f) => f.ticker === b && f.ticker !== fundA.ticker) ??
    compareFunds.find((f) => f.ticker !== fundA.ticker)!;
  if (fundA.ticker === 'VOO' && fundB.ticker === 'QQQ') {
    return { fundA, fundB, shared: sharedHoldings, ...overlapSummary };
  }
  if (fundA.ticker === 'QQQ' && fundB.ticker === 'VOO') {
    return {
      fundA,
      fundB,
      shared: sharedHoldings.map((h) => ({ ...h, weightA: h.weightB, weightB: h.weightA })),
      ...overlapSummary,
    };
  }
  const bByTicker = new Map(fundB.topHoldings.map((h) => [h.ticker, h]));
  const shared: SharedHolding[] = fundA.topHoldings
    .filter((h) => bByTicker.has(h.ticker))
    .map((h) => ({
      ticker: h.ticker,
      name: h.name,
      sector: null,
      weightA: h.weight,
      weightB: bByTicker.get(h.ticker)?.weight ?? null,
    }));
  const overlapByWeight = shared.reduce((s, h) => s + Math.min(h.weightA ?? 0, h.weightB ?? 0), 0);
  return { fundA, fundB, shared, sharedCount: shared.length, overlapByWeight };
}
