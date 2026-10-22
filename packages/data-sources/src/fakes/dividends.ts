import type { DividendEvent, DividendSource, IsoDate } from '../types';

/** In-memory DividendSource for tests and demo mode. */
export class FakeDividendSource implements DividendSource {
  constructor(private readonly events: DividendEvent[]) {}

  async dividends(ticker: string, from: IsoDate): Promise<DividendEvent[]> {
    const t = ticker.toUpperCase();
    return this.events
      .filter((e) => e.ticker.toUpperCase() === t && e.exDate >= from)
      .sort((a, b) => a.exDate.localeCompare(b.exDate));
  }
}
