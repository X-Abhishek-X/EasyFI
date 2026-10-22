import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/bls/cpi.json';
import { BlsClient, BlsError, CPI_SERIES } from './bls';
import { fakeFetch, jsonResponse } from './testing';

const noSleep = async () => {};

describe('CPI_SERIES', () => {
  it('exports default series ids', () => {
    expect(CPI_SERIES.headline).toBe('CUUR0000SA0');
    expect(CPI_SERIES.core).toBe('CUUR0000SA0L1E');
    expect(CPI_SERIES.usedCars).toBe('CUUR0000SETA02');
    expect(Object.keys(CPI_SERIES)).toHaveLength(9);
  });
});

describe('BlsClient.series', () => {
  it('POSTs the v2 payload and parses monthly points, skipping M13 and missing values', async () => {
    const fetch = fakeFetch(() => jsonResponse(fixture));
    const c = new BlsClient({ registrationKey: 'k', fetch, sleep: noSleep });
    const out = await c.series(['CUUR0000SA0', 'CUUR0000SAF1'], 2025, 2026);

    const call = fetch.calls[0]!;
    expect(call.url).toBe('https://api.bls.gov/publicAPI/v2/timeseries/data/');
    expect(call.init?.method).toBe('POST');
    expect(JSON.parse(call.init!.body as string)).toEqual({
      seriesid: ['CUUR0000SA0', 'CUUR0000SAF1'],
      startyear: '2025',
      endyear: '2026',
      registrationkey: 'k',
    });

    expect(out).toEqual([
      { seriesId: 'CUUR0000SA0', period: '2025-12', value: 321.004 },
      { seriesId: 'CUUR0000SA0', period: '2026-08', value: 325.977 },
      { seriesId: 'CUUR0000SA0', period: '2026-09', value: 326.512 },
      { seriesId: 'CUUR0000SAF1', period: '2026-09', value: 345.21 },
    ]);
  });

  it('omits registrationkey when none configured', async () => {
    const fetch = fakeFetch(() => jsonResponse(fixture));
    await new BlsClient({ fetch, sleep: noSleep }).series(['CUUR0000SA0'], 2026, 2026);
    expect(JSON.parse(fetch.calls[0]!.init!.body as string)).not.toHaveProperty('registrationkey');
  });

  it('splits long year ranges into API-sized windows (10 years without key)', async () => {
    const fetch = fakeFetch(() =>
      jsonResponse({ status: 'REQUEST_SUCCEEDED', Results: { series: [] } }),
    );
    await new BlsClient({ fetch, sleep: noSleep }).series(['CUUR0000SA0'], 2001, 2025);
    const bodies = fetch.calls.map((c) => JSON.parse(c.init!.body as string));
    expect(bodies.map((b) => [b.startyear, b.endyear])).toEqual([
      ['2001', '2010'],
      ['2011', '2020'],
      ['2021', '2025'],
    ]);
  });

  it('throws BlsError when the API reports REQUEST_NOT_PROCESSED', async () => {
    const fetch = fakeFetch(() =>
      jsonResponse({ status: 'REQUEST_NOT_PROCESSED', message: ['daily threshold reached'] }),
    );
    const err = await new BlsClient({ fetch, sleep: noSleep })
      .series(['CUUR0000SA0'], 2026, 2026)
      .catch((e) => e);
    expect(err).toBeInstanceOf(BlsError);
    expect((err as Error).message).toContain('daily threshold');
  });

  it('returns [] for no series without calling the API', async () => {
    const fetch = fakeFetch([]);
    expect(await new BlsClient({ fetch }).series([], 2020, 2021)).toEqual([]);
  });
});
