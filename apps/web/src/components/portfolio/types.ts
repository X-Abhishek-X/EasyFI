import type { Concentration } from '@/components/types';

/** A company node in the constellation graph and a card in the holdings side panel. */
export type ConstellationHolding = {
  key: string;
  ticker: string;
  name: string;
  sector: string | null;
  concentration: Concentration;
  /** Effective weight across the portfolio, fraction 0–1. */
  weight: number;
  /** Effective dollar exposure; null when unpriced. */
  value: number | null;
  /** Fund tickers that hold it (edges to hubs). Excludes direct holdings. */
  funds: string[];
  /** True if also held directly. */
  direct: boolean;
  /** Draw a text label next to the node (top holdings). */
  labeled: boolean;
};
