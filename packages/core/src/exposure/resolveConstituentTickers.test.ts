import { describe, expect, it } from 'vitest';
import {
  buildIssuerIndex,
  issuerNameKey,
  resolveConstituentTickers,
} from './resolveConstituentTickers';

describe('issuerNameKey', () => {
  it('normalises legal suffixes, punctuation, share classes and "The"', () => {
    expect(issuerNameKey('NVIDIA Corp.')).toBe(issuerNameKey('NVIDIA CORP'));
    expect(issuerNameKey('Apple, Inc.')).toBe(issuerNameKey('Apple Inc.'));
    expect(issuerNameKey('Alphabet Inc. Class C')).toBe(issuerNameKey('Alphabet Inc.'));
    expect(issuerNameKey('Home Depot, Inc. (The)')).toBe(issuerNameKey('HOME DEPOT, INC.'));
    expect(issuerNameKey('Coca-Cola Co/The')).toBe(issuerNameKey('COCA COLA CO'));
    expect(issuerNameKey('Exxon Mobil Corporation')).toBe('EXXON MOBIL');
    expect(issuerNameKey('QUALCOMM INC/DE')).toBe(issuerNameKey('QUALCOMM Inc'));
    expect(issuerNameKey('CVS HEALTH CORP /DE/')).toBe(issuerNameKey('CVS Health Corp'));
  });

  it('keeps distinct companies distinct', () => {
    expect(issuerNameKey('Meta Platforms Inc')).not.toBe(issuerNameKey('Meta Materials Inc'));
  });
});

describe('resolveConstituentTickers', () => {
  const index = buildIssuerIndex([
    { ticker: 'NVDA', name: 'NVIDIA CORP' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.' },
    { ticker: 'GOOG', name: 'Alphabet Inc.' },
    { ticker: 'KO', name: 'COCA COLA CO' },
  ]);

  it('fills missing tickers by exact normalised name; first listing wins for multi-class issuers', () => {
    const out = resolveConstituentTickers(
      [
        { constituentTicker: null, name: 'NVIDIA Corp.' },
        { constituentTicker: null, name: 'Alphabet Inc. Class C' },
        { constituentTicker: null, name: 'Coca-Cola Co/The' },
        { constituentTicker: null, name: 'Toyota Motor Corp' },
        { constituentTicker: 'AAPL', name: 'Something else' },
      ],
      index,
    );
    expect(out.map((c) => c.constituentTicker)).toEqual(['NVDA', 'GOOGL', 'KO', null, 'AAPL']);
  });

  it('only resolves equity lines: a Comcast bond must not become CMCSA stock exposure', () => {
    const idx = buildIssuerIndex([{ ticker: 'CMCSA', name: 'COMCAST CORP' }]);
    const out = resolveConstituentTickers(
      [
        { constituentTicker: null, name: 'COMCAST CORP', assetBucket: 'bonds' },
        { constituentTicker: null, name: 'Comcast Corp', assetBucket: 'stocks' },
      ],
      idx,
    );
    expect(out.map((c) => c.constituentTicker)).toEqual([null, 'CMCSA']);
  });

  it('never overwrites a ticker the filing already had', () => {
    const [c] = resolveConstituentTickers(
      [{ constituentTicker: 'BRK.B', name: 'NVIDIA Corp' }],
      index,
    );
    expect(c!.constituentTicker).toBe('BRK.B');
  });
});
