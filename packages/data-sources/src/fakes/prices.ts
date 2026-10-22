import type { IsoDate, LatestQuote, PricePoint, PriceSource, Security } from '../types';

export interface FakePriceData {
  prices: PricePoint[];
  meta?: Record<string, Partial<Security>>;
}

/** In-memory PriceSource for tests and demo mode. */
export class FakePriceSource implements PriceSource {
  private readonly byTicker = new Map<string, PricePoint[]>();

  constructor(private readonly data: FakePriceData) {
    for (const p of data.prices) {
      const key = p.ticker.toUpperCase();
      const list = this.byTicker.get(key) ?? [];
      list.push(p);
      this.byTicker.set(key, list);
    }
    for (const list of this.byTicker.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  }

  async eodHistory(ticker: string, from: IsoDate, to: IsoDate): Promise<PricePoint[]> {
    return (this.byTicker.get(ticker.toUpperCase()) ?? [])
      .filter((p) => p.date >= from && p.date <= to)
      .map((p) => ({ ...p, ticker }));
  }

  async latest(tickers: string[]): Promise<Record<string, LatestQuote>> {
    const out: Record<string, LatestQuote> = {};
    for (const t of tickers) {
      const list = this.byTicker.get(t.toUpperCase());
      const last = list?.at(-1);
      if (!list || !last) continue;
      const q: LatestQuote = { close: last.close, date: last.date };
      const prev = list.at(-2);
      if (prev) q.prevClose = prev.close;
      out[t] = q;
    }
    return out;
  }

  async meta(ticker: string): Promise<Partial<Security> | null> {
    const m = this.data.meta?.[ticker.toUpperCase()];
    return m ? { ticker, ...m } : null;
  }
}
