import { concentration, type ConcentrationLevel } from './concentration';
import { DIRECT } from './lookThrough';
import type { Exposure, LookThroughResult } from './types';

export interface ConstellationNode {
  /** 'fund:VOO', 'holding:NVDA' or 'direct'. */
  id: string;
  kind: 'fund' | 'holding' | 'direct';
  ticker: string | null;
  label: string;
  value: number;
  weight: number;
  /** Null for hubs. */
  concentration: ConcentrationLevel | null;
  sector: string | null;
  fundCount: number;
}

export interface ConstellationEdge {
  /** Hub node id ('fund:VOO' or 'direct'). */
  source: string;
  /** Holding node id. */
  target: string;
  /** Contribution as a fraction of the portfolio total. */
  weight: number;
  /** Constituent weight inside the fund; null for the direct hub. */
  weightInFund: number | null;
}

export interface ConstellationGraph {
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
}

export const DEFAULT_CONSTELLATION_NODES = 40;
export const DIRECT_HUB_ID = 'direct';

const HOLDING_KINDS = new Set<Exposure['kind']>(['company', 'fund', 'asset']);

const fundId = (ticker: string) => `fund:${ticker}`;
const holdingId = (ticker: string) => `holding:${ticker}`;

function holdingNode(e: Exposure): ConstellationNode {
  return {
    id: holdingId(e.ticker!),
    kind: 'holding',
    ticker: e.ticker,
    label: e.name,
    value: e.value,
    weight: e.weight,
    concentration: concentration(e),
    sector: e.sector,
    fundCount: e.fundCount,
  };
}

function hubNode(
  id: string,
  kind: 'fund' | 'direct',
  ticker: string | null,
  value: number,
  total: number,
): ConstellationNode {
  return {
    id,
    kind,
    ticker,
    label: ticker ?? 'Held directly',
    value,
    weight: total > 0 ? value / total : 0,
    concentration: null,
    sector: null,
    fundCount: 0,
  };
}

/**
 * Force-graph data: the top `maxNodes` holdings (companies / un-expanded funds / direct assets,
 * never tails, unmapped lines or cash) plus a hub per fund they are reached through. A
 * 'direct' hub is added only when a shown holding is also held directly.
 */
export function constellationGraph(
  result: LookThroughResult,
  options: { maxNodes?: number } = {},
): ConstellationGraph {
  const maxNodes = options.maxNodes ?? DEFAULT_CONSTELLATION_NODES;
  const total = result.totalValue;
  const shown = result.exposures
    .filter((e) => HOLDING_KINDS.has(e.kind) && e.ticker !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxNodes);

  const edges: ConstellationEdge[] = [];
  const hubTickers = new Set<string>();
  let directValue = 0;
  for (const e of shown) {
    for (const s of e.sources) {
      const isDirect = s.via === DIRECT;
      if (isDirect) directValue += s.value;
      else hubTickers.add(s.via);
      edges.push({
        source: isDirect ? DIRECT_HUB_ID : fundId(s.via),
        target: holdingId(e.ticker!),
        weight: total > 0 ? s.value / total : 0,
        weightInFund: s.weightInFund,
      });
    }
  }

  const fundValue = (t: string) => result.funds.find((f) => f.ticker === t)?.value ?? 0;
  const hubs = [...hubTickers]
    .map((t) => hubNode(fundId(t), 'fund', t, fundValue(t), total))
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  const direct =
    directValue > 0 ? [hubNode(DIRECT_HUB_ID, 'direct', null, directValue, total)] : [];

  return { nodes: [...direct, ...hubs, ...shown.map(holdingNode)], edges };
}
