import type { CpiPoint, CpiSource } from '../types';

/** In-memory CpiSource for tests and demo mode. */
export class FakeCpiSource implements CpiSource {
  constructor(private readonly points: CpiPoint[]) {}

  async series(seriesIds: string[], startYear: number, endYear: number): Promise<CpiPoint[]> {
    const ids = new Set(seriesIds);
    return this.points
      .filter((p) => {
        const y = Number(p.period.slice(0, 4));
        return ids.has(p.seriesId) && y >= startYear && y <= endYear;
      })
      .sort((a, b) => a.seriesId.localeCompare(b.seriesId) || a.period.localeCompare(b.period));
  }
}
