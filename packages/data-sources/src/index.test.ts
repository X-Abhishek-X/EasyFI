import { describe, expect, it } from 'vitest';
import {
  BlsClient,
  createSources,
  OpenRouterProvider,
  SecEdgarClient,
  TiingoClient,
} from './index';

describe('createSources', () => {
  it('returns null for keyed sources when no keys are configured (BLS works keyless)', () => {
    const s = createSources({});
    expect(s).toMatchObject({ prices: null, dividends: null, holdings: null, llm: null });
    expect(s.cpi).toBeInstanceOf(BlsClient);
  });

  it('builds real clients when keys are present', () => {
    const s = createSources({
      TIINGO_TOKEN: 't',
      SEC_USER_AGENT: 'EasyFI admin@example.com',
      OPENROUTER_API_KEY: 'k',
      OPENROUTER_MODEL: 'some/model',
    });
    expect(s.prices).toBeInstanceOf(TiingoClient);
    expect(s.dividends).toBe(s.prices);
    expect(s.holdings).toBeInstanceOf(SecEdgarClient);
    expect(s.cpi).toBeInstanceOf(BlsClient); // BLS works without a key (lower limits)
    expect(s.llm).toBeInstanceOf(OpenRouterProvider);
  });

  it('treats blank values as missing', () => {
    const s = createSources({ TIINGO_TOKEN: '  ', SEC_USER_AGENT: '', OPENROUTER_API_KEY: '' });
    expect(s.prices).toBeNull();
    expect(s.holdings).toBeNull();
    expect(s.llm).toBeNull();
  });

  it('can disable BLS when requested', () => {
    expect(createSources({ BLS_DISABLED: '1' }).cpi).toBeNull();
  });
});
