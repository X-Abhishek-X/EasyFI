import type { Holding, LatestPrices } from '../types';
import { CASH_TICKER } from './constants';
import { normalizeTicker } from './normalizeTicker';
import type { HoldingsValuation, ValuedHolding } from './types';

function gainOf(value: number | null, costBasis: number | null) {
  if (value === null || costBasis === null) return { gain: null, gainPct: null };
  const gain = value - costBasis;
  return { gain, gainPct: costBasis > 0 ? gain / costBasis : null };
}

function marketLine(holding: Holding, ticker: string, shares: number, prices: LatestPrices) {
  const quote = prices[ticker] ?? prices[holding.ticker];
  if (!quote && ticker === CASH_TICKER) {
    // Money-market funds hold a stable $1 NAV.
    return { price: 1, priceDate: null, value: shares, dayChange: 0, dayChangePct: 0 };
  }
  if (!quote) return null;
  const value = shares * quote.close;
  const prev = quote.prevClose;
  const dayChange = prev !== undefined ? shares * (quote.close - prev) : null;
  const dayChangePct = prev !== undefined && prev > 0 ? (quote.close - prev) / prev : null;
  return { price: quote.close, priceDate: quote.date, value, dayChange, dayChangePct };
}

/** Value one holding: shares × close, else statement value, else flagged unpriced. */
export function valueHolding(holding: Holding, prices: LatestPrices): ValuedHolding {
  const ticker = normalizeTicker(holding.ticker);
  const market =
    holding.shares !== null ? marketLine(holding, ticker, holding.shares, prices) : null;
  if (market) {
    return {
      holding,
      ticker,
      valueSource: 'market',
      ...market,
      ...gainOf(market.value, holding.costBasis),
    };
  }
  const empty = { price: null, priceDate: null, dayChange: null, dayChangePct: null };
  if (holding.statementValue !== null) {
    const value = holding.statementValue;
    return {
      holding,
      ticker,
      valueSource: 'statement',
      ...empty,
      value,
      ...gainOf(value, holding.costBasis),
    };
  }
  return {
    holding,
    ticker,
    valueSource: 'unpriced',
    ...empty,
    value: null,
    gain: null,
    gainPct: null,
  };
}

function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

function oldestDate(lines: ValuedHolding[]): string | null {
  const dates = lines.map((l) => l.priceDate).filter((d): d is string => d !== null);
  return dates.length ? dates.reduce((a, b) => (b < a ? b : a)) : null;
}

/**
 * Value every holding and total them. Unpriced lines are excluded from every total (and listed
 * in `unpriced`); day change only counts market-priced lines that have a prevClose.
 */
export function valueHoldings(holdings: Holding[], prices: LatestPrices): HoldingsValuation {
  const lines = holdings.map((h) => valueHolding(h, prices));
  const valued = lines.filter((l) => l.value !== null);
  const market = valued.filter((l) => l.valueSource === 'market');
  const changed = market.filter((l) => l.dayChange !== null);
  const withCost = valued.filter((l) => l.gain !== null);

  const dayChange = sum(changed.map((l) => l.dayChange!));
  const prevValue = sum(changed.map((l) => l.value! - l.dayChange!));
  const costBasis = sum(withCost.map((l) => l.holding.costBasis!));
  const gain = sum(withCost.map((l) => l.gain!));

  return {
    lines,
    totalValue: sum(valued.map((l) => l.value!)),
    marketValue: sum(market.map((l) => l.value!)),
    statementValue: sum(valued.filter((l) => l.valueSource === 'statement').map((l) => l.value!)),
    dayChange,
    dayChangePct: prevValue > 0 ? dayChange / prevValue : null,
    costBasis,
    gain,
    gainPct: costBasis > 0 ? gain / costBasis : null,
    unpriced: lines.filter((l) => l.value === null).map((l) => l.ticker),
    asOf: oldestDate(market),
  };
}
