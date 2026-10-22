import type {
  AssetBucket,
  FundConstituent,
  FundHoldingsSnapshot,
  Security,
  SecurityType,
} from '../types';
import {
  CASH_TICKER,
  DEFAULT_LOOK_THROUGH_DEPTH,
  FUND_EQUIVALENTS,
  WEIGHT_EPSILON,
} from './constants';
import { normalizeTicker } from './normalizeTicker';
import { isFundSecurity, resolveBook } from './resolveBook';
import type {
  Exposure,
  ExposureKind,
  ExposureSource,
  FundPosition,
  LookThroughInput,
  LookThroughResult,
  UnresolvedReason,
  ValuedHolding,
} from './types';
import { valueHoldings } from './valueHoldings';

export const DIRECT = 'direct';
export const NO_LOOK_THROUGH = 'no look-through data';
export const STATEMENT_ONLY = 'statement value only';

type Identity = Pick<
  Exposure,
  'key' | 'ticker' | 'name' | 'kind' | 'sector' | 'industry' | 'assetBucket'
>;

interface Builder extends Identity {
  value: number;
  sources: Map<string, ExposureSource>;
}

interface Context {
  input: LookThroughInput;
  equivalents: Readonly<Record<string, readonly string[]>>;
  maxDepth: number;
  builders: Map<string, Builder>;
  unresolved: UnresolvedReason[];
  snapshotDates: string[];
}

const BUCKET_BY_TYPE: Record<SecurityType, AssetBucket> = {
  stock: 'stocks',
  etf: 'stocks',
  mutual_fund: 'stocks',
  mmf: 'cash',
  crypto: 'crypto',
  bond: 'bonds',
  other: 'other',
};

const CASH_IDENTITY: Identity = {
  key: CASH_TICKER,
  ticker: CASH_TICKER,
  name: 'Cash',
  kind: 'cash',
  sector: null,
  industry: null,
  assetBucket: 'cash',
};

function add(ctx: Context, id: Identity, via: string, value: number, weightInFund: number | null) {
  if (value === 0) return;
  let b = ctx.builders.get(id.key);
  if (!b) {
    b = { ...id, value: 0, sources: new Map() };
    ctx.builders.set(id.key, b);
  }
  b.value += value;
  const prev = b.sources.get(via);
  const w = weightInFund === null ? null : (prev?.weightInFund ?? 0) + weightInFund;
  b.sources.set(via, { via, value: (prev?.value ?? 0) + value, weightInFund: w });
}

function addUnresolved(ctx: Context, ticker: string, reason: string, value: number) {
  const prev = ctx.unresolved.find((r) => r.ticker === ticker && r.reason === reason);
  if (prev) prev.value += value;
  else ctx.unresolved.push({ ticker, reason, value });
}

// ---------- fund expansion ----------

interface Expansion {
  via: string;
  /** Ticker whose book is being expanded (labels its tail, e.g. "Other VOO holdings"). */
  label: string;
  snapshot: FundHoldingsSnapshot;
  value: number;
  chainWeight: number;
  depth: number;
  visited: ReadonlySet<string>;
}

function constituentIdentity(
  ctx: Context,
  c: FundConstituent,
  ticker: string,
  kind: ExposureKind,
): Identity {
  const sec: Security | undefined = ctx.input.securities[ticker];
  return {
    key: ticker,
    ticker,
    name: sec?.name ?? c.name,
    kind,
    sector: c.sector ?? sec?.sector ?? null,
    industry: c.industry ?? sec?.industry ?? null,
    assetBucket: c.assetBucket,
  };
}

function addConstituent(ctx: Context, e: Expansion, c: FundConstituent, w: number) {
  const value = e.value * w;
  const chain = e.chainWeight * w;
  const ticker = c.constituentTicker ? normalizeTicker(c.constituentTicker) : null;
  if (ticker === CASH_TICKER || (ticker === null && c.assetBucket === 'cash')) {
    return add(ctx, CASH_IDENTITY, e.via, value, chain);
  }
  if (ticker === null) {
    const id: Identity = {
      key: `unmapped:${e.label}:${c.name}`,
      ticker: null,
      name: c.name,
      kind: 'unmapped',
      sector: c.sector,
      industry: c.industry,
      assetBucket: c.assetBucket,
    };
    return add(ctx, id, e.via, value, chain);
  }
  const nested = resolveBook(ticker, ctx.input.fundHoldings, ctx.equivalents);
  const canRecurse =
    nested && e.depth < ctx.maxDepth && !e.visited.has(ticker) && !e.visited.has(nested.bookTicker);
  if (nested && canRecurse) {
    ctx.snapshotDates.push(nested.snapshot.asOf);
    return expandFund(ctx, {
      ...e,
      label: ticker,
      snapshot: nested.snapshot,
      value,
      chainWeight: chain,
      depth: e.depth + 1,
      visited: new Set([...e.visited, ticker, nested.bookTicker]),
    });
  }
  const isFund = nested !== null || isFundSecurity(ctx.input.securities[ticker]);
  const kind: ExposureKind = isFund ? 'fund' : c.assetBucket === 'stocks' ? 'company' : 'asset';
  add(ctx, constituentIdentity(ctx, c, ticker, kind), e.via, value, chain);
}

/**
 * Split the unlisted remainder across sectors: residual_s = max(0, sectorWeight_s − listed_s),
 * scaled so Σ residual = remainder. Without sectorWeights (or no residual) → one unclassified tail.
 */
export function tailSlices(
  snapshot: FundHoldingsSnapshot,
  remainder: number,
  scale = 1,
): { sector: string | null; weight: number }[] {
  const listed: Record<string, number> = {};
  for (const c of snapshot.constituents) {
    if (c.sector && c.weight > 0) listed[c.sector] = (listed[c.sector] ?? 0) + c.weight * scale;
  }
  const residual = Object.entries(snapshot.sectorWeights ?? {})
    .map(([sector, w]) => ({ sector, w: Math.max(0, w - (listed[sector] ?? 0)) }))
    .filter((r) => r.w > WEIGHT_EPSILON);
  const total = residual.reduce((s, r) => s + r.w, 0);
  if (total <= WEIGHT_EPSILON) return [{ sector: null, weight: remainder }];
  return residual.map((r) => ({ sector: r.sector, weight: (remainder * r.w) / total }));
}

function addTail(ctx: Context, e: Expansion, remainder: number, scale: number) {
  for (const slice of tailSlices(e.snapshot, remainder, scale)) {
    const id: Identity = {
      key: `tail:${e.label}:${slice.sector ?? 'Unclassified'}`,
      ticker: null,
      name: `Other ${e.label} holdings`,
      kind: 'tail',
      sector: slice.sector,
      industry: null,
      assetBucket: 'stocks',
    };
    add(ctx, id, e.via, e.value * slice.weight, e.chainWeight * slice.weight);
  }
}

function expandFund(ctx: Context, e: Expansion) {
  const rows = e.snapshot.constituents.filter((c) => c.weight > 0);
  const listed = rows.reduce((s, c) => s + c.weight, 0);
  const scale = listed > 1 ? 1 / listed : 1;
  for (const c of rows) addConstituent(ctx, e, c, c.weight * scale);
  const remainder = 1 - Math.min(listed, 1);
  if (remainder > WEIGHT_EPSILON) addTail(ctx, e, remainder, scale);
}

// ---------- direct lines ----------

function directIdentity(ticker: string, sec: Security | undefined): Identity {
  const type = sec?.type ?? 'stock';
  return {
    key: ticker,
    ticker,
    name: sec?.name ?? ticker,
    kind: type === 'stock' ? 'company' : 'asset',
    sector: sec?.sector ?? null,
    industry: sec?.industry ?? null,
    assetBucket: BUCKET_BY_TYPE[type],
  };
}

/** Route one valued line: cash, unresolved, fund (collected for expansion) or direct asset. */
function routeLine(ctx: Context, line: ValuedHolding, funds: Map<string, number>) {
  const value = line.value!;
  const sec = ctx.input.securities[line.ticker];
  if (line.ticker === CASH_TICKER || sec?.type === 'mmf') {
    return add(ctx, CASH_IDENTITY, DIRECT, value, null);
  }
  if (line.valueSource === 'statement')
    return addUnresolved(ctx, line.ticker, STATEMENT_ONLY, value);
  if (resolveBook(line.ticker, ctx.input.fundHoldings, ctx.equivalents)) {
    funds.set(line.ticker, (funds.get(line.ticker) ?? 0) + value);
    return;
  }
  if (isFundSecurity(sec)) return addUnresolved(ctx, line.ticker, NO_LOOK_THROUGH, value);
  add(ctx, directIdentity(line.ticker, sec), DIRECT, value, null);
}

function expandHeldFunds(ctx: Context, funds: Map<string, number>, total: number): FundPosition[] {
  const positions: FundPosition[] = [];
  for (const [ticker, value] of funds) {
    const book = resolveBook(ticker, ctx.input.fundHoldings, ctx.equivalents)!;
    ctx.snapshotDates.push(book.snapshot.asOf);
    expandFund(ctx, {
      via: ticker,
      label: ticker,
      snapshot: book.snapshot,
      value,
      chainWeight: 1,
      depth: 1,
      visited: new Set([ticker, book.bookTicker]),
    });
    const weight = total > 0 ? value / total : 0;
    positions.push({
      ticker,
      bookTicker: book.bookTicker,
      value,
      weight,
      asOf: book.snapshot.asOf,
    });
  }
  return positions.sort((a, b) => b.value - a.value);
}

function finalize(b: Builder, total: number): Exposure {
  const sources = [...b.sources.values()].sort((x, y) => y.value - x.value);
  return {
    key: b.key,
    ticker: b.ticker,
    name: b.name,
    kind: b.kind,
    sector: b.sector,
    industry: b.industry,
    assetBucket: b.assetBucket,
    value: b.value,
    weight: total > 0 ? b.value / total : 0,
    directValue: b.sources.get(DIRECT)?.value ?? 0,
    sources,
    fundCount: sources.filter((s) => s.via !== DIRECT).length,
  };
}

const minDate = (dates: string[]): string | null =>
  dates.length ? dates.reduce((a, b) => (b < a ? b : a)) : null;

/**
 * Effective exposure per company = direct value + Σ(fund line value × constituent weight),
 * recursing into fund-of-funds up to `maxDepth`. Each fund's unlisted remainder becomes
 * sector-attributed 'tail' exposures. Funds without a book and statement-only lines form the
 * unresolved slice. Weights are fractions of totalValue (resolved + unresolved); unpriced lines
 * are excluded entirely and listed in `unpriced`.
 */
export function lookThrough(input: LookThroughInput): LookThroughResult {
  const ctx: Context = {
    input,
    equivalents: input.equivalents ?? FUND_EQUIVALENTS,
    maxDepth: input.maxDepth ?? DEFAULT_LOOK_THROUGH_DEPTH,
    builders: new Map(),
    unresolved: [],
    snapshotDates: [],
  };
  const valuation = valueHoldings(input.holdings, input.prices);
  const cash = input.cash ?? 0;
  const totalValue = valuation.totalValue + cash;

  if (cash !== 0) add(ctx, CASH_IDENTITY, DIRECT, cash, null);
  const funds = new Map<string, number>();
  for (const line of valuation.lines) if (line.value !== null) routeLine(ctx, line, funds);
  const fundPositions = expandHeldFunds(ctx, funds, totalValue);

  const exposures = [...ctx.builders.values()]
    .map((b) => finalize(b, totalValue))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key));
  const unresolvedValue = ctx.unresolved.reduce((s, r) => s + r.value, 0);
  const tailValue = exposures.filter((e) => e.kind === 'tail').reduce((s, e) => s + e.value, 0);
  const weightOf = (v: number) => (totalValue > 0 ? v / totalValue : 0);

  return {
    totalValue,
    resolvedValue: totalValue - unresolvedValue,
    asOf: valuation.asOf,
    holdingsAsOf: minDate(ctx.snapshotDates),
    exposures,
    unresolved: {
      value: unresolvedValue,
      weight: weightOf(unresolvedValue),
      reasons: ctx.unresolved,
    },
    tail: { value: tailValue, weight: weightOf(tailValue) },
    unpriced: valuation.unpriced,
    funds: fundPositions,
  };
}
