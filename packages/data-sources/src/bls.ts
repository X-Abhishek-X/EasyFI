import { fetchWithRetry } from './http';
import type { CpiPoint, CpiSource, FetchLike, SleepFn } from './types';

const URL_V2 = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

/** CPI-U, U.S. city average, not seasonally adjusted. */
export const CPI_SERIES = {
  headline: 'CUUR0000SA0',
  food: 'CUUR0000SAF1',
  energy: 'CUUR0000SA0E',
  shelter: 'CUUR0000SAH1',
  medical: 'CUUR0000SAM',
  apparel: 'CUUR0000SAA',
  transportation: 'CUUR0000SAT',
  usedCars: 'CUUR0000SETA02',
  core: 'CUUR0000SA0L1E',
} as const;

export const DEFAULT_CPI_SERIES_IDS: string[] = Object.values(CPI_SERIES);

export class BlsError extends Error {
  override readonly name = 'BlsError';
}

export interface BlsOptions {
  registrationKey?: string;
  fetch?: FetchLike;
  sleep?: SleepFn;
}

interface BlsResponse {
  status: string;
  message?: string[];
  Results?: {
    series: { seriesID: string; data: { year: string; period: string; value: string }[] }[];
  };
}

export class BlsClient implements CpiSource {
  private readonly fetch: FetchLike;
  private readonly maxSeries: number;
  private readonly maxYears: number;

  constructor(private readonly opts: BlsOptions = {}) {
    this.fetch = opts.fetch ?? ((url, init) => globalThis.fetch(url, init));
    // v2 limits: 50 series / 20 years with a key, 25 / 10 without.
    this.maxSeries = opts.registrationKey ? 50 : 25;
    this.maxYears = opts.registrationKey ? 20 : 10;
  }

  async series(seriesIds: string[], startYear: number, endYear: number): Promise<CpiPoint[]> {
    if (seriesIds.length === 0 || endYear < startYear) return [];
    const out: CpiPoint[] = [];
    for (let i = 0; i < seriesIds.length; i += this.maxSeries) {
      const ids = seriesIds.slice(i, i + this.maxSeries);
      for (let y = startYear; y <= endYear; y += this.maxYears) {
        out.push(...(await this.request(ids, y, Math.min(endYear, y + this.maxYears - 1))));
      }
    }
    return out.sort((a, b) =>
      a.seriesId === b.seriesId
        ? a.period.localeCompare(b.period)
        : seriesIds.indexOf(a.seriesId) - seriesIds.indexOf(b.seriesId),
    );
  }

  private async request(ids: string[], start: number, end: number): Promise<CpiPoint[]> {
    const payload: Record<string, unknown> = {
      seriesid: ids,
      startyear: String(start),
      endyear: String(end),
    };
    if (this.opts.registrationKey) payload.registrationkey = this.opts.registrationKey;
    const res = await fetchWithRetry(
      this.fetch,
      URL_V2,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      this.opts.sleep ? { sleep: this.opts.sleep } : {},
    );
    const body = (await res.json()) as BlsResponse;
    if (body.status !== 'REQUEST_SUCCEEDED') {
      throw new BlsError(`BLS ${body.status}: ${(body.message ?? []).join('; ')}`);
    }
    const points: CpiPoint[] = [];
    for (const s of body.Results?.series ?? []) {
      for (const d of s.data) {
        const m = /^M(0[1-9]|1[0-2])$/.exec(d.period);
        const value = Number(d.value);
        if (!m || d.value.trim() === '' || !Number.isFinite(value)) continue;
        points.push({ seriesId: s.seriesID, period: `${d.year}-${m[1]}`, value });
      }
    }
    return points;
  }
}
