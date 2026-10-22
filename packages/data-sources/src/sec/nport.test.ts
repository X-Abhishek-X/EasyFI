import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assetBucketFor, parseNport } from './nport';

const xml = readFileSync(new URL('./__fixtures__/primary_doc.xml', import.meta.url), 'utf8');

describe('assetBucketFor', () => {
  it.each([
    ['EC', 'stocks'],
    ['EP', 'stocks'],
    ['DBT', 'bonds'],
    ['LON', 'bonds'],
    ['ABS-MBS', 'bonds'],
    ['STIV', 'cash'],
    ['RA', 'cash'],
    ['COMM', 'commodities'],
    ['DCO', 'commodities'],
    ['DE', 'other'],
    ['RE', 'other'],
    [undefined, 'other'],
  ] as const)('%s → %s', (cat, bucket) => {
    expect(assetBucketFor(cat)).toBe(bucket);
  });
});

describe('parseNport', () => {
  const doc = parseNport(xml, { fundTicker: 'VOO', cusipToTicker: { '084670702': 'BRK.B' } });

  it('reads genInfo', () => {
    expect(doc.seriesId).toBe('S000002277');
    expect(doc.seriesName).toBe('Vanguard 500 Index Fund');
    expect(doc.asOf).toBe('2026-06-30');
  });

  it('maps invstOrSec rows to FundConstituents', () => {
    expect(doc.constituents).toHaveLength(6);
    expect(doc.constituents[0]).toEqual({
      fundTicker: 'VOO',
      constituentTicker: 'AAPL',
      name: 'Apple Inc',
      weight: 0.07012345678,
      assetBucket: 'stocks',
      sector: null,
      industry: null,
    });
  });

  it('uses the CUSIP map when the filing has no ticker, else null', () => {
    const byName = Object.fromEntries(doc.constituents.map((c) => [c.name, c]));
    expect(byName['Berkshire Hathaway Inc']!.constituentTicker).toBe('BRK.B');
    expect(byName['NVIDIA Corp']!.constituentTicker).toBeNull();
  });

  it('accepts a CUSIP lookup function', () => {
    const d = parseNport(xml, {
      fundTicker: 'VOO',
      cusipToTicker: (c) => (c === '67066G104' ? 'NVDA' : null),
    });
    expect(d.constituents.find((c) => c.name === 'NVIDIA Corp')!.constituentTicker).toBe('NVDA');
  });

  it('buckets bonds, cash and derivatives (assetConditional)', () => {
    const buckets = doc.constituents.map((c) => c.assetBucket);
    expect(buckets).toEqual(['stocks', 'stocks', 'stocks', 'bonds', 'cash', 'other']);
    expect(doc.constituents[5]!.weight).toBeCloseTo(-0.000001);
  });

  it('handles prefixed namespaces and a single holding', () => {
    const prefixed = `<?xml version="1.0"?>
<nport:edgarSubmission xmlns:nport="http://www.sec.gov/edgar/nport">
  <nport:formData>
    <nport:genInfo><nport:seriesId>S000000001</nport:seriesId><nport:repPdDate>2026-03-31</nport:repPdDate></nport:genInfo>
    <nport:invstOrSecs>
      <nport:invstOrSec>
        <nport:name>Microsoft Corp</nport:name><nport:title>Microsoft Corp</nport:title>
        <nport:cusip>594918104</nport:cusip>
        <nport:identifiers><nport:ticker value="MSFT"/></nport:identifiers>
        <nport:pctVal>50</nport:pctVal><nport:assetCat>EC</nport:assetCat>
      </nport:invstOrSec>
    </nport:invstOrSecs>
  </nport:formData>
</nport:edgarSubmission>`;
    const d = parseNport(prefixed, { fundTicker: 'X' });
    expect(d.seriesId).toBe('S000000001');
    expect(d.constituents).toEqual([
      expect.objectContaining({ constituentTicker: 'MSFT', weight: 0.5, assetBucket: 'stocks' }),
    ]);
  });

  it('throws on documents without genInfo', () => {
    expect(() => parseNport('<foo/>', { fundTicker: 'X' })).toThrow(/N-PORT/);
  });
});
