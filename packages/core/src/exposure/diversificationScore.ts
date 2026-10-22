import { DIVERSIFICATION_N_CEIL, DIVERSIFICATION_N_FLOOR } from './constants';
import type { Exposure, LookThroughResult } from './types';

/** Exposure kinds that count as a single concentrated position. */
const POSITION_KINDS = new Set<Exposure['kind']>(['company', 'fund', 'asset', 'unmapped']);

/**
 * Herfindahl–Hirschman index over the resolved exposures:
 *   HHI = Σ_i (v_i / V)²  for i ∈ companies, un-expanded funds, direct assets, unmapped lines
 * where V = Σ value of all resolved exposures (tails and cash included in V). Tails (a fund's
 * unlisted remainder: hundreds of small names) and cash are treated as fully diversified, so
 * they add to V but contribute ≈0 to the sum.
 */
export function herfindahl(exposures: readonly Exposure[]): number {
  const total = exposures.reduce((s, e) => s + e.value, 0);
  if (total <= 0) return 0;
  return exposures
    .filter((e) => POSITION_KINDS.has(e.kind))
    .reduce((s, e) => s + (e.value / total) ** 2, 0);
}

/**
 * Diversification score 0–100 (integer). The unresolved slice is excluded (it is not in
 * `exposures`).
 *   N_eff = 1 / HHI   (effective number of equally-sized positions)
 *   score = round(100 × clamp((N_eff − N_FLOOR) / (N_CEIL − N_FLOOR), 0, 1))
 * with N_FLOOR = 3, N_CEIL = 60. One 65% stock → N_eff ≈ 2 → 0; an S&P 500 fund → ≈77;
 * a total-market fund → 100. No exposures → 0; only tails/cash (HHI = 0) → 100.
 */
export function diversificationScore(input: readonly Exposure[] | LookThroughResult): number {
  const exposures = Array.isArray(input) ? input : (input as LookThroughResult).exposures;
  if (exposures.length === 0) return 0;
  const hhi = herfindahl(exposures);
  if (hhi <= 0) return 100;
  const nEff = 1 / hhi;
  const scaled =
    (nEff - DIVERSIFICATION_N_FLOOR) / (DIVERSIFICATION_N_CEIL - DIVERSIFICATION_N_FLOOR);
  return Math.round(100 * Math.min(1, Math.max(0, scaled)));
}
