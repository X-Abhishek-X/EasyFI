import type { Holding, LatestPrices } from '../types';
import { diversificationScore } from './diversificationScore';
import { foldBy, type FoldGroup } from './foldBy';
import { lookThrough } from './lookThrough';
import { normalizeTicker } from './normalizeTicker';
import { overlap } from './overlap';
import { resolveBook } from './resolveBook';
import type { LookThroughInput, LookThroughResult } from './types';

export interface WhatIfChange {
  ticker: string;
  /** USD to add. */
  amount: number;
}

export interface WhatIfSnapshot {
  totalValue: number;
  score: number;
  sectors: { sector: string; weight: number }[];
}

export interface SectorShift {
  sector: string;
  before: number;
  after: number;
  shift: number;
}

export interface FundOverlapSummary {
  fund: string;
  overlapByWeight: number;
  sharedCount: number;
}

export interface ExposureChange {
  ticker: string;
  name: string;
  beforeValue: number;
  afterValue: number;
  beforeWeight: number;
  afterWeight: number;
  shift: number;
}

export interface WhatIfResult {
  ticker: string;
  amount: number;
  before: WhatIfSnapshot;
  after: WhatIfSnapshot;
  /** Sorted by |shift| desc. */
  sectorShifts: SectorShift[];
  /** Overlap of the added fund with each fund already held (empty for a non-fund). */
  overlaps: FundOverlapSummary[];
  /** Top company exposure changes by |shift|. */
  topChanges: ExposureChange[];
  /** False when the added position landed in the unresolved slice. */
  addedResolved: boolean;
}

export const WHAT_IF_TOP_CHANGES = 10;
const WHAT_IF_HOLDING_ID = 'what-if';

function snapshotOf(result: LookThroughResult): WhatIfSnapshot {
  return {
    totalValue: result.totalValue,
    score: diversificationScore(result),
    sectors: foldBy(result, 'sector').map((g) => ({ sector: g.key, weight: g.weight })),
  };
}

/** Synthetic holding + prices for the proposed purchase (priced at $1 if no quote exists). */
function withAddition(
  input: LookThroughInput,
  ticker: string,
  amount: number,
  asOf: string | null,
) {
  const quote = input.prices[ticker];
  const prices: LatestPrices = quote
    ? input.prices
    : { ...input.prices, [ticker]: { close: 1, date: asOf ?? '1970-01-01' } };
  const added: Holding = {
    id: WHAT_IF_HOLDING_ID,
    portfolioId: WHAT_IF_HOLDING_ID,
    ticker,
    accountType: 'other',
    shares: amount / (quote?.close ?? 1),
    costBasis: amount,
    statementValue: null,
    statementDate: null,
    tags: [],
  };
  return { ...input, holdings: [...input.holdings, added], prices };
}

function sectorShifts(before: WhatIfSnapshot, after: WhatIfSnapshot): SectorShift[] {
  const keys = new Set([...before.sectors, ...after.sectors].map((s) => s.sector));
  const w = (snap: WhatIfSnapshot, k: string) =>
    snap.sectors.find((s) => s.sector === k)?.weight ?? 0;
  return [...keys]
    .map((sector) => ({
      sector,
      before: w(before, sector),
      after: w(after, sector),
      shift: w(after, sector) - w(before, sector),
    }))
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift) || a.sector.localeCompare(b.sector));
}

function companyChanges(before: FoldGroup[], after: FoldGroup[]): ExposureChange[] {
  const keys = new Set([...before, ...after].map((g) => g.key));
  const find = (list: FoldGroup[], k: string) => list.find((g) => g.key === k);
  return [...keys]
    .map((key) => {
      const b = find(before, key);
      const a = find(after, key);
      const beforeWeight = b?.weight ?? 0;
      const afterWeight = a?.weight ?? 0;
      return {
        ticker: key,
        name: (a ?? b)!.label,
        beforeValue: b?.value ?? 0,
        afterValue: a?.value ?? 0,
        beforeWeight,
        afterWeight,
        shift: afterWeight - beforeWeight,
      };
    })
    .sort((x, y) => Math.abs(y.shift) - Math.abs(x.shift) || x.ticker.localeCompare(y.ticker))
    .slice(0, WHAT_IF_TOP_CHANGES);
}

function fundOverlaps(
  input: LookThroughInput,
  ticker: string,
  held: LookThroughResult,
): FundOverlapSummary[] {
  const added = resolveBook(ticker, input.fundHoldings, input.equivalents);
  if (!added) return [];
  return held.funds
    .filter((f) => f.ticker !== ticker)
    .map((f) => {
      const book = resolveBook(f.ticker, input.fundHoldings, input.equivalents)!;
      const o = overlap(added.snapshot, book.snapshot);
      return { fund: f.ticker, overlapByWeight: o.overlapByWeight, sharedCount: o.sharedCount };
    })
    .sort((a, b) => b.overlapByWeight - a.overlapByWeight);
}

/** Simulate buying `amount` of `ticker`: sector shift, new overlap, score and exposure changes. */
export function whatIf(input: LookThroughInput, change: WhatIfChange): WhatIfResult {
  const ticker = normalizeTicker(change.ticker);
  const beforeResult = lookThrough(input);
  const afterResult = lookThrough(withAddition(input, ticker, change.amount, beforeResult.asOf));
  const before = snapshotOf(beforeResult);
  const after = snapshotOf(afterResult);
  const unresolvedOf = (r: LookThroughResult) =>
    r.unresolved.reasons.filter((x) => x.ticker === ticker).reduce((s, x) => s + x.value, 0);

  return {
    ticker,
    amount: change.amount,
    before,
    after,
    sectorShifts: sectorShifts(before, after),
    overlaps: fundOverlaps(input, ticker, beforeResult),
    topChanges: companyChanges(foldBy(beforeResult, 'company'), foldBy(afterResult, 'company')),
    addedResolved: unresolvedOf(afterResult) <= unresolvedOf(beforeResult),
  };
}
