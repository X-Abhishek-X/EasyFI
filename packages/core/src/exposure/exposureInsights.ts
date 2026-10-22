import type { FundHoldingsMap, Holding } from '../types';
import { INSIGHT_THRESHOLDS as T } from './constants';
import { foldBy, CASH_KEY, OTHER_KEY, UNRESOLVED_KEY } from './foldBy';
import { DIRECT } from './lookThrough';
import { overlap } from './overlap';
import { canonicalFund, resolveBook } from './resolveBook';
import type { LookThroughResult } from './types';

export type InsightSeverity = 'high' | 'medium' | 'low';
export type InsightKind =
  | 'single-stock'
  | 'multi-fund-company'
  | 'duplicate-fund'
  | 'sector-heavy'
  | 'fund-overlap'
  | 'unresolved';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  kind: InsightKind;
  title: string;
  detail: string;
  tickers: string[];
  portfolioIds: string[];
  /** Suggested question for the AI explorer ("Ask why"). */
  askPrompt: string;
  /** Magnitude used to rank insights of equal severity (usually a weight). */
  score: number;
}

export interface InsightPortfolio {
  id: string;
  name: string;
  result: LookThroughResult;
  holdings: Holding[];
}

export interface ExposureInsightsInput {
  portfolios: InsightPortfolio[];
  /** Look-through of every portfolio combined. */
  combined: LookThroughResult;
  /** Needed for fund-overlap insights. */
  fundHoldings?: FundHoldingsMap;
}

const EVERYTHING = 'everything you own';
const SEVERITY_RANK: Record<InsightSeverity, number> = { high: 0, medium: 1, low: 2 };

const pct0 = (w: number) => `${Math.round(w * 100)}%`;
const pct1 = (w: number) => `${(w * 100).toFixed(1)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function singleStock(p: InsightPortfolio): Insight[] {
  return p.result.exposures
    .filter((e) => e.kind === 'company' && e.weight >= T.singleStockMedium)
    .map((e) => ({
      id: `single-stock:${p.id}:${e.key}`,
      severity: e.weight >= T.singleStockHigh ? 'high' : 'medium',
      kind: 'single-stock',
      title: `${p.name}: ${pct0(e.weight)} sits in one stock (${e.ticker})`,
      detail: `${e.name} is ${pct1(e.weight)} of ${p.name} after looking through funds.`,
      tickers: [e.ticker!],
      portfolioIds: [p.id],
      askPrompt: `Why is ${e.ticker} ${pct1(e.weight)} of my ${p.name} portfolio, and what are ways to reduce that concentration?`,
      score: e.weight,
    }));
}

function multiFundCompany(input: ExposureInsightsInput): Insight[] {
  const out: Insight[] = [];
  for (const e of input.combined.exposures) {
    if (e.kind !== 'company') continue;
    const high = e.fundCount >= T.multiFundHighFunds && e.weight >= T.multiFundHighWeight;
    const medium = e.fundCount >= T.multiFundMediumFunds && e.weight >= T.multiFundMediumWeight;
    if (!high && !medium) continue;
    const funds = e.sources.filter((s) => s.via !== DIRECT).map((s) => s.via);
    const how =
      e.directValue > 0
        ? `direct + ${plural(funds.length, 'fund')}`
        : `all through ${plural(funds.length, 'fund')}`;
    out.push({
      id: `multi-fund:${e.key}`,
      severity: high ? 'high' : 'medium',
      kind: 'multi-fund-company',
      title: `${e.ticker} is ${pct1(e.weight)} of ${EVERYTHING} — ${how}`,
      detail: `${e.name} reaches you through ${funds.join(', ')}${e.directValue > 0 ? ' and a direct position' : ''}.`,
      tickers: [e.ticker!],
      portfolioIds: input.portfolios
        .filter((p) => p.result.exposures.some((x) => x.key === e.key))
        .map((p) => p.id),
      askPrompt: `Which of my funds drive my ${e.ticker} exposure, and how much do they overlap?`,
      score: e.weight,
    });
  }
  return out;
}

function duplicateFunds(input: ExposureInsightsInput): Insight[] {
  const groups = new Map<string, { tickers: Set<string>; portfolios: Set<string> }>();
  for (const p of input.portfolios) {
    for (const f of p.result.funds) {
      const key = canonicalFund(f.ticker);
      const g = groups.get(key) ?? { tickers: new Set(), portfolios: new Set() };
      g.tickers.add(f.ticker);
      g.portfolios.add(p.id);
      groups.set(key, g);
    }
  }
  const out: Insight[] = [];
  for (const [key, g] of groups) {
    const n = g.portfolios.size;
    if (n < 2) continue;
    const tickers = [...g.tickers].sort();
    const label = tickers.join(' / ');
    const verb = tickers.length === 1 ? 'appears' : 'appear';
    const times = n === 2 ? 'twice' : `${n} times`;
    out.push({
      id: `duplicate-fund:${key}`,
      severity: 'medium',
      kind: 'duplicate-fund',
      title: `${label} ${verb} in ${n} portfolios — the same holdings counted ${times}`,
      detail: `Holding the same index in several portfolios adds no diversification; it stacks the same companies.`,
      tickers,
      portfolioIds: [...g.portfolios],
      askPrompt: `Does holding ${label} in ${n} portfolios add any diversification?`,
      score: input.combined.funds
        .filter((f) => g.tickers.has(f.ticker))
        .reduce((s, f) => s + f.weight, 0),
    });
  }
  return out;
}

const NON_SECTORS = new Set([UNRESOLVED_KEY, CASH_KEY, OTHER_KEY]);

function sectorHeavy(
  scopeId: string,
  scopeName: string,
  result: LookThroughResult,
  portfolioIds: string[],
): Insight[] {
  return foldBy(result, 'sector')
    .filter((g) => !NON_SECTORS.has(g.key) && g.weight > T.sectorMedium)
    .map((g) => ({
      id: `sector:${scopeId}:${g.key}`,
      severity: g.weight > T.sectorHigh ? 'high' : 'medium',
      kind: 'sector-heavy',
      title: `${g.label} is ${pct0(g.weight)} of ${scopeName}`,
      detail: `${g.label} makes up ${pct1(g.weight)} of ${scopeName} once funds are looked through.`,
      tickers: [],
      portfolioIds,
      askPrompt: `Why is my ${g.label} exposure so high in ${scopeName}, and what would balance it?`,
      score: g.weight,
    }));
}

function fundOverlaps(input: ExposureInsightsInput): Insight[] {
  const books = input.fundHoldings;
  if (!books) return [];
  const funds = input.combined.funds;
  const out: Insight[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const a = funds[i]!.ticker;
      const b = funds[j]!.ticker;
      const pair = [canonicalFund(a), canonicalFund(b)].sort().join('|');
      // Same index (covered by duplicate-fund) or a pair already reported via an equivalent.
      if (canonicalFund(a) === canonicalFund(b) || seen.has(pair)) continue;
      seen.add(pair);
      const ba = resolveBook(a, books);
      const bb = resolveBook(b, books);
      if (!ba || !bb) continue;
      const o = overlap(ba.snapshot, bb.snapshot).overlapByWeight;
      if (o < T.overlapLow) continue;
      const severity: InsightSeverity =
        o >= T.overlapHigh ? 'high' : o >= T.overlapMedium ? 'medium' : 'low';
      out.push({
        id: `fund-overlap:${a}:${b}`,
        severity,
        kind: 'fund-overlap',
        title: `${a} and ${b} overlap ${pct0(o)} by weight`,
        detail: `${pct0(o)} of ${a} and ${b} is the same companies at the same weights (Σ min weight).`,
        tickers: [a, b],
        portfolioIds: input.portfolios
          .filter((p) => p.result.funds.some((f) => f.ticker === a || f.ticker === b))
          .map((p) => p.id),
        askPrompt: `How much do ${a} and ${b} overlap, and do I need both?`,
        score: o,
      });
    }
  }
  return out;
}

function unresolved(
  scopeId: string,
  scopeName: string,
  result: LookThroughResult,
  portfolioIds: string[],
): Insight[] {
  const w = result.unresolved.weight;
  if (w <= T.unresolvedMedium) return [];
  const tickers = [...new Set(result.unresolved.reasons.map((r) => r.ticker))];
  return [
    {
      id: `unresolved:${scopeId}`,
      severity: 'medium',
      kind: 'unresolved',
      title: `${pct0(w)} of ${scopeName} has no look-through data`,
      detail: `${tickers.join(', ')} cannot be looked through, so scores exclude that slice.`,
      tickers,
      portfolioIds,
      askPrompt: `Which holdings in ${scopeName} can't be looked through, and how does that affect my numbers?`,
      score: w,
    },
  ];
}

/**
 * Ranked exposure insights (high → medium → low, then by magnitude):
 * single-stock concentration per portfolio, a company concentrated via several funds across
 * everything, the same (or an equivalent) fund in several portfolios, a sector above 40%,
 * heavy overlap between two funds held, and an unresolved slice above 10%.
 */
export function exposureInsights(input: ExposureInsightsInput): Insight[] {
  const all = input.portfolios.map((p) => p.id);
  const multi = input.portfolios.length > 1;
  const insights: Insight[] = [
    ...input.portfolios.flatMap(singleStock),
    ...multiFundCompany(input),
    ...duplicateFunds(input),
    ...input.portfolios.flatMap((p) => sectorHeavy(p.id, p.name, p.result, [p.id])),
    ...(multi ? sectorHeavy('all', EVERYTHING, input.combined, all) : []),
    ...fundOverlaps(input),
    ...input.portfolios.flatMap((p) => unresolved(p.id, p.name, p.result, [p.id])),
    ...(multi ? unresolved('all', EVERYTHING, input.combined, all) : []),
  ];
  return insights.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      b.score - a.score ||
      a.id.localeCompare(b.id),
  );
}
