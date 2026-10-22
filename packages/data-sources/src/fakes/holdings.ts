import type { FundHoldings, HoldingsSource } from '../types';

/** In-memory HoldingsSource for tests and demo mode. */
export class FakeHoldingsSource implements HoldingsSource {
  private readonly byFund = new Map<string, FundHoldings>();

  constructor(data: Record<string, FundHoldings> | Map<string, FundHoldings>) {
    const entries = data instanceof Map ? data.entries() : Object.entries(data);
    for (const [k, v] of entries) this.byFund.set(k.toUpperCase(), v);
  }

  async latestHoldings(fundTicker: string): Promise<FundHoldings | null> {
    return this.byFund.get(fundTicker.toUpperCase()) ?? null;
  }
}
