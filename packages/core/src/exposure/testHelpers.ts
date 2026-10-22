// Shared builders for exposure tests (not exported from the package index).
import type { FundConstituent, FundHoldingsSnapshot, Holding, Security } from '../types';

export function holding(
  ticker: string,
  shares: number | null,
  over: Partial<Holding> = {},
): Holding {
  return {
    id: `h-${ticker}`,
    portfolioId: 'p1',
    ticker,
    accountType: 'taxable',
    shares,
    costBasis: null,
    statementValue: null,
    statementDate: null,
    tags: [],
    ...over,
  };
}

export function stock(ticker: string, sector: string | null = 'Information Technology'): Security {
  return {
    ticker,
    name: `${ticker} Inc`,
    type: 'stock',
    sector,
    industry: sector ? `${sector} industry` : null,
    expenseRatio: null,
  };
}

export function etf(ticker: string, expenseRatio = 0.001): Security {
  return {
    ticker,
    name: `${ticker} Fund`,
    type: 'etf',
    sector: null,
    industry: null,
    expenseRatio,
  };
}

export function snapshot(
  fund: string,
  rows: [
    ticker: string | null,
    weight: number,
    sector?: string | null,
    bucket?: FundConstituent['assetBucket'],
  ][],
  sectorWeights?: Record<string, number>,
  asOf = '2026-06-30',
): FundHoldingsSnapshot {
  return {
    asOf,
    sectorWeights,
    constituents: rows.map(([t, weight, sector = 'Information Technology', bucket = 'stocks']) => ({
      fundTicker: fund,
      constituentTicker: t,
      name: t ? `${t} Inc` : 'Unmapped line',
      weight,
      assetBucket: bucket,
      sector,
      industry: sector ? `${sector} industry` : null,
    })),
  };
}

export const px = (close: number, date = '2026-09-30') => ({ close, date });
