import type { DividendEvent, Holding, LatestPrices } from '../types';
import { addDays, addMonthKey, addMonths, monthKey } from './dates';
import { detectPayoutFrequency, type PayoutFrequency } from './payoutFrequency';

export interface DividendSummaryInput {
  holdings: Holding[];
  dividends: DividendEvent[];
  prices: LatestPrices;
  asOf: string;
  /** Warn when one holding provides more than this fraction of TTM income. Default 0.4. */
  concentrationThreshold?: number;
}

export type IncomeEventStatus = 'received' | 'announced' | 'projected';

export interface IncomeEvent {
  ticker: string;
  exDate: string;
  payDate: string | null;
  perShare: number;
  shares: number;
  total: number;
  status: IncomeEventStatus;
}

export interface IncomeCalendarMonth {
  /** 'YYYY-MM' */
  month: string;
  received: number;
  projected: number;
  events: IncomeEvent[];
}

export interface DividendHoldingRow {
  ticker: string;
  shares: number;
  price: number | null;
  marketValue: number | null;
  ttmPerShare: number;
  ttmIncome: number;
  /** ttmPerShare / price; null when unpriced. */
  yield: number | null;
  /** TTM income on shares with cost basis / that cost basis; null without cost. */
  yieldOnCost: number | null;
  /** Null when the ticker has no dividend history. */
  frequency: PayoutFrequency | null;
  hasSpecials: boolean;
  nextExDate: string | null;
  nextPayDate: string | null;
  /** True when the next date is projected from cadence rather than announced. */
  nextIsEstimate: boolean;
  projected12m: number;
  /** Share of portfolio TTM income (fraction); 0 when there is no income. */
  pctOfIncome: number;
}

export interface IncomeConcentrationWarning {
  ticker: string;
  pctOfIncome: number;
  message: string;
}

export interface DividendSummary {
  asOf: string;
  ttmIncome: number;
  priorTtmIncome: number;
  ttmChangePct: number | null;
  pricedMarketValue: number;
  portfolioYield: number | null;
  yieldOnCost: number | null;
  next30Days: { total: number; events: IncomeEvent[] };
  /** 24 months: the 12 months ending with asOf's month, then the next 12. */
  calendar: IncomeCalendarMonth[];
  /** Announced + projected income paid in (asOf, asOf + 12 months]. */
  projection12m: number;
  perHolding: DividendHoldingRow[];
  /** Holdings with a positive known yield, highest first. */
  yieldLeaders: DividendHoldingRow[];
  incomeConcentration: IncomeConcentrationWarning[];
  /** Held tickers with no latest price (excluded from yield denominators). */
  unpriced: string[];
}

/** The date income lands: pay date, falling back to ex-date. */
const eventDate = (e: { exDate: string; payDate: string | null }) => e.payDate ?? e.exDate;

interface Position {
  shares: number;
  sharesWithCost: number;
  cost: number;
}

function aggregate(holdings: Holding[]): Map<string, Position> {
  const out = new Map<string, Position>();
  for (const h of holdings) {
    if (h.shares === null || h.shares <= 0) continue;
    const p = out.get(h.ticker) ?? { shares: 0, sharesWithCost: 0, cost: 0 };
    p.shares += h.shares;
    if (h.costBasis !== null && h.costBasis > 0) {
      p.sharesWithCost += h.shares;
      p.cost += h.costBasis;
    }
    out.set(h.ticker, p);
  }
  return out;
}

/**
 * Projects future payments from cadence, starting after the latest known regular event
 * (announced events included). Specials are never projected. Payers whose last regular
 * payment is older than two intervals (+15 days) are treated as stopped.
 */
function project(
  history: DividendEvent[],
  asOf: string,
  until: string,
): { events: DividendEvent[]; frequency: PayoutFrequency | null; hasSpecials: boolean } {
  if (history.length === 0) return { events: [], frequency: null, hasSpecials: false };
  const f = detectPayoutFrequency(history);
  const specials = new Set(f.specials);
  const regular = history
    .filter((e) => !specials.has(e))
    .sort((a, b) => a.exDate.localeCompare(b.exDate));
  const last = regular[regular.length - 1];
  const base = { frequency: f.frequency, hasSpecials: f.hasSpecials };
  if (!last || f.intervalMonths === null || f.regularAmount === null)
    return { events: [], ...base };
  const staleBefore = addDays(addMonths(asOf, -2 * f.intervalMonths), -15);
  if (eventDate(last) < staleBefore) return { events: [], ...base };

  const events: DividendEvent[] = [];
  for (let k = 1; ; k++) {
    const step = k * f.intervalMonths;
    const e: DividendEvent = {
      ticker: last.ticker,
      exDate: addMonths(last.exDate, step),
      payDate: last.payDate ? addMonths(last.payDate, step) : null,
      amount: f.regularAmount,
    };
    if (eventDate(e) > until) break;
    if (eventDate(e) > asOf) events.push(e);
  }
  return { events, ...base };
}

/**
 * Dividend income summary.
 *
 * Assumes CURRENT shares were held constant over the whole history (current-shares replay):
 * past income = today's shares × historical per-share payouts, not actual cash received.
 * Income is dated by pay date (ex-date when no pay date). Yield uses priced market value
 * only (unpriced lines are excluded from both numerator and denominator).
 */
export function dividendSummary(input: DividendSummaryInput): DividendSummary {
  const { holdings, dividends, prices, asOf, concentrationThreshold = 0.4 } = input;
  const positions = aggregate(holdings);

  const ttmStart = addMonths(asOf, -12); // exclusive
  const priorStart = addMonths(asOf, -24); // exclusive
  const horizon12 = addMonths(asOf, 12);
  const firstMonth = addMonthKey(monthKey(asOf), -11);
  const lastMonth = addMonthKey(monthKey(asOf), 12);
  const calendarEnd = addDays(`${addMonthKey(lastMonth, 1)}-01`, -1);

  const byTicker = new Map<string, DividendEvent[]>();
  for (const d of dividends) {
    if (!positions.has(d.ticker)) continue;
    const list = byTicker.get(d.ticker) ?? [];
    list.push(d);
    byTicker.set(d.ticker, list);
  }

  const allEvents: IncomeEvent[] = [];
  const rows: DividendHoldingRow[] = [];
  let ttmIncome = 0;
  let priorTtmIncome = 0;
  let pricedMarketValue = 0;
  let pricedIncome = 0;
  let incomeOnCost = 0;
  let totalCost = 0;
  const unpriced: string[] = [];

  for (const [ticker, pos] of positions) {
    const history = byTicker.get(ticker) ?? [];
    const toIncome = (e: DividendEvent, status: IncomeEventStatus): IncomeEvent => ({
      ticker,
      exDate: e.exDate,
      payDate: e.payDate,
      perShare: e.amount,
      shares: pos.shares,
      total: e.amount * pos.shares,
      status,
    });

    let ttmPerShare = 0;
    const future: IncomeEvent[] = [];
    for (const e of history) {
      const date = eventDate(e);
      if (date > ttmStart && date <= asOf) ttmPerShare += e.amount;
      else if (date > priorStart && date <= ttmStart) priorTtmIncome += e.amount * pos.shares;
      if (date > asOf) future.push(toIncome(e, 'announced'));
      else if (date >= `${firstMonth}-01`) allEvents.push(toIncome(e, 'received'));
    }
    const proj = project(history, asOf, calendarEnd);
    future.push(...proj.events.map((e) => toIncome(e, 'projected')));
    allEvents.push(...future.filter((e) => eventDate(e) <= calendarEnd));

    const ttm = ttmPerShare * pos.shares;
    ttmIncome += ttm;
    const price = prices[ticker]?.close ?? null;
    const marketValue = price === null ? null : price * pos.shares;
    if (marketValue === null) unpriced.push(ticker);
    else {
      pricedMarketValue += marketValue;
      pricedIncome += ttm;
    }
    if (pos.cost > 0) {
      incomeOnCost += ttmPerShare * pos.sharesWithCost;
      totalCost += pos.cost;
    }

    const minBy = (key: (e: IncomeEvent) => string | null) =>
      future
        .filter((e) => (key(e) ?? '') > asOf)
        .sort((a, b) => key(a)!.localeCompare(key(b)!))[0] ?? null;
    const nextPay = minBy((e) => e.payDate);
    const nextEx = minBy((e) => e.exDate);

    rows.push({
      ticker,
      shares: pos.shares,
      price,
      marketValue,
      ttmPerShare,
      ttmIncome: ttm,
      yield: price ? ttmPerShare / price : null,
      yieldOnCost: pos.cost > 0 ? (ttmPerShare * pos.sharesWithCost) / pos.cost : null,
      frequency: proj.frequency,
      hasSpecials: proj.hasSpecials,
      nextExDate: nextEx?.exDate ?? null,
      nextPayDate: nextPay?.payDate ?? null,
      nextIsEstimate: (nextPay ?? nextEx)?.status === 'projected',
      projected12m: future
        .filter((e) => eventDate(e) <= horizon12)
        .reduce((s, e) => s + e.total, 0),
      pctOfIncome: 0,
    });
  }

  for (const row of rows) row.pctOfIncome = ttmIncome > 0 ? row.ttmIncome / ttmIncome : 0;
  rows.sort((a, b) => b.ttmIncome - a.ttmIncome || a.ticker.localeCompare(b.ticker));

  allEvents.sort(
    (a, b) => eventDate(a).localeCompare(eventDate(b)) || a.ticker.localeCompare(b.ticker),
  );
  const calendar: IncomeCalendarMonth[] = [];
  for (let i = 0; i < 24; i++) {
    const month = addMonthKey(firstMonth, i);
    const events = allEvents.filter((e) => monthKey(eventDate(e)) === month);
    const sum = (pred: (e: IncomeEvent) => boolean) =>
      events.filter(pred).reduce((s, e) => s + e.total, 0);
    calendar.push({
      month,
      received: sum((e) => e.status === 'received'),
      projected: sum((e) => e.status !== 'received'),
      events,
    });
  }

  const upcoming = allEvents.filter((e) => e.status !== 'received');
  const next30 = upcoming.filter((e) => eventDate(e) <= addDays(asOf, 30));

  return {
    asOf,
    ttmIncome,
    priorTtmIncome,
    ttmChangePct: priorTtmIncome > 0 ? ttmIncome / priorTtmIncome - 1 : null,
    pricedMarketValue,
    portfolioYield: pricedMarketValue > 0 ? pricedIncome / pricedMarketValue : null,
    yieldOnCost: totalCost > 0 ? incomeOnCost / totalCost : null,
    next30Days: { total: next30.reduce((s, e) => s + e.total, 0), events: next30 },
    calendar,
    projection12m: upcoming
      .filter((e) => eventDate(e) <= horizon12)
      .reduce((s, e) => s + e.total, 0),
    perHolding: rows,
    yieldLeaders: rows
      .filter((r) => r.yield !== null && r.yield > 0)
      .sort((a, b) => b.yield! - a.yield!),
    incomeConcentration: rows
      .filter((r) => r.pctOfIncome > concentrationThreshold)
      .map((r) => ({
        ticker: r.ticker,
        pctOfIncome: r.pctOfIncome,
        message: `${r.ticker} provides ${Math.round(r.pctOfIncome * 100)}% of your dividend income.`,
      })),
    unpriced: unpriced.sort(),
  };
}
