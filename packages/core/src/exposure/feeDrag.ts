import type { FundHoldingsMap, Security, SecurityMap } from '../types';
import { normalizeTicker } from './normalizeTicker';
import { resolveBook } from './resolveBook';
import type { HoldingsValuation } from './types';

export interface FeeContribution {
  ticker: string;
  value: number;
  expenseRatio: number;
  annualCost: number;
  /** Fraction of the portfolio's total annual fee cost. */
  shareOfCost: number;
}

export interface FeeDragResult {
  /** Value-weighted expense ratio over lines with a known ratio; null when none. */
  blendedExpenseRatio: number | null;
  /** $ per year at current values. */
  annualCost: number;
  /** Value of lines included in the blend. */
  coveredValue: number;
  /** Funds with value but no known expense ratio (excluded from the blend). */
  unknown: string[];
  /** Funds with a non-zero cost, sorted by annualCost desc. */
  contributions: FeeContribution[];
  overlapWaste: { annualCost: number; overlappingValue: number };
}

const ZERO_FEE_TYPES = new Set<Security['type']>(['stock', 'crypto', 'bond']);

function expenseRatioOf(sec: Security | undefined): number | null {
  if (!sec) return null;
  if (ZERO_FEE_TYPES.has(sec.type)) return 0;
  return sec.expenseRatio;
}

function sumByTicker(valuation: HoldingsValuation): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of valuation.lines) {
    if (l.value !== null && l.value > 0) out.set(l.ticker, (out.get(l.ticker) ?? 0) + l.value);
  }
  return out;
}

/**
 * Fee overlap waste: for each company held by ≥2 of your funds, the extra fees paid versus
 * holding all of that overlapping exposure through the cheapest of those funds:
 *   waste = Σ_company Σ_fund v(fund, company) × (ER_fund − min ER over funds holding company)
 * where v(fund, company) = fund line value × constituent weight (top-level books only).
 * overlappingValue = Σ v(fund, company) over those companies.
 */
function overlapWaste(
  values: Map<string, number>,
  ratios: Map<string, number>,
  fundHoldings: FundHoldingsMap,
): FeeDragResult['overlapWaste'] {
  const byCompany = new Map<string, { value: number; er: number }[]>();
  for (const [fund, value] of values) {
    const er = ratios.get(fund);
    const book = resolveBook(fund, fundHoldings);
    if (er === undefined || !book) continue;
    for (const c of book.snapshot.constituents) {
      if (!c.constituentTicker || c.weight <= 0) continue;
      const t = normalizeTicker(c.constituentTicker);
      const list = byCompany.get(t) ?? [];
      list.push({ value: value * c.weight, er });
      byCompany.set(t, list);
    }
  }
  let annualCost = 0;
  let overlappingValue = 0;
  for (const list of byCompany.values()) {
    if (list.length < 2) continue;
    const minEr = Math.min(...list.map((x) => x.er));
    for (const x of list) {
      annualCost += x.value * (x.er - minEr);
      overlappingValue += x.value;
    }
  }
  return { annualCost, overlappingValue };
}

/**
 * Blended expense ratio = Σ(value × ER) / Σ value over lines with a known ER (stocks, crypto and
 * bonds count as 0). annualCost = Σ(value × ER). Pass `fundHoldings` to estimate fee overlap
 * waste (see overlapWaste).
 */
export function feeDrag(
  valuation: HoldingsValuation,
  securities: SecurityMap,
  fundHoldings: FundHoldingsMap = {},
): FeeDragResult {
  const values = sumByTicker(valuation);
  const ratios = new Map<string, number>();
  const unknown: string[] = [];
  for (const ticker of values.keys()) {
    const er = expenseRatioOf(securities[ticker]);
    if (er === null) unknown.push(ticker);
    else ratios.set(ticker, er);
  }
  let coveredValue = 0;
  let annualCost = 0;
  for (const [ticker, er] of ratios) {
    coveredValue += values.get(ticker)!;
    annualCost += values.get(ticker)! * er;
  }
  const contributions = [...ratios]
    .filter(([, er]) => er > 0)
    .map(([ticker, er]) => {
      const value = values.get(ticker)!;
      const cost = value * er;
      return {
        ticker,
        value,
        expenseRatio: er,
        annualCost: cost,
        shareOfCost: annualCost > 0 ? cost / annualCost : 0,
      };
    })
    .sort((a, b) => b.annualCost - a.annualCost);

  return {
    blendedExpenseRatio: coveredValue > 0 ? annualCost / coveredValue : null,
    annualCost,
    coveredValue,
    unknown,
    contributions,
    overlapWaste: overlapWaste(values, ratios, fundHoldings),
  };
}
