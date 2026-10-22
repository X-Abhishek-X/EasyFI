import { CONCENTRATION_HIGH_WEIGHT, CONCENTRATION_MEDIUM_FUND_COUNT } from './constants';
import type { Exposure } from './types';

export type ConcentrationLevel = 'high' | 'medium' | 'low';

/**
 * high   – an operating company (kind 'company') ≥ CONCENTRATION_HIGH_WEIGHT of the total
 * medium – reached through ≥ CONCENTRATION_MEDIUM_FUND_COUNT funds (overlap)
 * low    – everything else; tails, unmapped lines and cash are never flagged
 */
export function concentration(
  exposure: Pick<Exposure, 'kind' | 'weight' | 'fundCount'>,
): ConcentrationLevel {
  if (exposure.kind === 'tail' || exposure.kind === 'unmapped' || exposure.kind === 'cash')
    return 'low';
  if (exposure.kind === 'company' && exposure.weight >= CONCENTRATION_HIGH_WEIGHT) return 'high';
  if (exposure.fundCount >= CONCENTRATION_MEDIUM_FUND_COUNT) return 'medium';
  return 'low';
}
