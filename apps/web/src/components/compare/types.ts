import type { AllocationSlice } from '@/components/types';

/** One fund in the Compare view. Weights are fractions 0–1. */
export type CompareFund = {
  ticker: string;
  name: string;
  asOf: string | null;
  holdingsCount: number;
  sectors: AllocationSlice[];
  topHoldings: { ticker: string; name: string; weight: number }[];
};

/** A company held by both funds. `weightA`/`weightB` are fractions of each fund. */
export type SharedHolding = {
  ticker: string;
  name: string;
  sector: string | null;
  weightA: number | null;
  weightB: number | null;
};

export type CompareMode = 'sector' | 'holdings';
