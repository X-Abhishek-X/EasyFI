import type { FundConstituent, FundHoldingsSnapshot } from '../types';
import { WEIGHT_EPSILON } from './constants';
import { normalizeTicker } from './normalizeTicker';
import type { Exposure } from './types';

/** A fund snapshot, its constituent list, or a set of look-through exposures. */
export type OverlapInput = FundHoldingsSnapshot | readonly FundConstituent[] | readonly Exposure[];

export interface SharedHolding {
  ticker: string;
  name: string;
  sector: string | null;
  weightA: number;
  weightB: number;
}

export interface OverlapResult {
  /** Sorted by weightA + weightB desc. */
  shared: SharedHolding[];
  sharedCount: number;
  countA: number;
  countB: number;
  /** Σ min(wA, wB) over shared tickers (0–1). */
  overlapByWeight: number;
}

interface Line {
  name: string;
  sector: string | null;
  weight: number;
}

function isExposure(x: FundConstituent | Exposure): x is Exposure {
  return 'kind' in x;
}

function toLines(input: OverlapInput): Map<string, Line> {
  const rows: readonly (FundConstituent | Exposure)[] = Array.isArray(input)
    ? input
    : (input as FundHoldingsSnapshot).constituents;
  const out = new Map<string, Line>();
  for (const row of rows) {
    const raw = isExposure(row)
      ? row.kind === 'company'
        ? row.ticker
        : null
      : row.constituentTicker;
    if (!raw) continue;
    const ticker = normalizeTicker(raw);
    const prev = out.get(ticker);
    out.set(ticker, {
      name: row.name,
      sector: row.sector,
      weight: (prev?.weight ?? 0) + row.weight,
    });
  }
  return out;
}

/** Shared holdings of two funds (or exposure sets) and overlap by weight Σ min(wA, wB). */
export function overlap(a: OverlapInput, b: OverlapInput): OverlapResult {
  const left = toLines(a);
  const right = toLines(b);
  const shared: SharedHolding[] = [];
  for (const [ticker, l] of left) {
    const r = right.get(ticker);
    if (r)
      shared.push({
        ticker,
        name: l.name,
        sector: l.sector ?? r.sector,
        weightA: l.weight,
        weightB: r.weight,
      });
  }
  shared.sort(
    (x, y) => y.weightA + y.weightB - (x.weightA + x.weightB) || x.ticker.localeCompare(y.ticker),
  );
  return {
    shared,
    sharedCount: shared.length,
    countA: left.size,
    countB: right.size,
    overlapByWeight: shared.reduce((s, x) => s + Math.min(x.weightA, x.weightB), 0),
  };
}

export interface SectorWeight {
  sector: string;
  weight: number;
}

const OTHER = 'Other';

/**
 * Full-fund sector weights for compare donuts: the snapshot's sectorWeights when present,
 * else summed from constituents (no sector → 'Other'). Any uncovered remainder → 'Other'.
 */
export function sectorWeights(snapshot: FundHoldingsSnapshot): SectorWeight[] {
  const acc = new Map<string, number>();
  const bump = (sector: string, w: number) => acc.set(sector, (acc.get(sector) ?? 0) + w);
  if (snapshot.sectorWeights) {
    for (const [sector, w] of Object.entries(snapshot.sectorWeights)) bump(sector, w);
  } else {
    for (const c of snapshot.constituents) bump(c.sector ?? OTHER, c.weight);
  }
  const covered = [...acc.values()].reduce((s, w) => s + w, 0);
  if (1 - covered > WEIGHT_EPSILON * 1000) bump(OTHER, 1 - covered);
  return [...acc.entries()]
    .map(([sector, weight]) => ({ sector, weight }))
    .filter((x) => x.weight > WEIGHT_EPSILON)
    .sort((x, y) => y.weight - x.weight || x.sector.localeCompare(y.sector));
}
