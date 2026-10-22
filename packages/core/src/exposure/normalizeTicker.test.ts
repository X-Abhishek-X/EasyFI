import { describe, expect, it } from 'vitest';
import { isCashTicker, normalizeTicker } from './normalizeTicker';

describe('normalizeTicker', () => {
  it('uppercases and trims', () => {
    expect(normalizeTicker('  voo ')).toBe('VOO');
    expect(normalizeTicker('$aapl')).toBe('AAPL');
    expect(normalizeTicker('')).toBe('');
  });

  it.each(['BRK-B', 'BRK/B', 'BRK B', 'brk.b', 'BRKB', 'BRK.B'])('maps %s to BRK.B', (raw) => {
    expect(normalizeTicker(raw)).toBe('BRK.B');
  });

  it('normalises other share classes', () => {
    expect(normalizeTicker('BF-B')).toBe('BF.B');
    expect(normalizeTicker('brk-a')).toBe('BRK.A');
  });

  it.each(['SPAXX', 'spaxx**', 'VMFXX', 'SWVXX', 'FDRXX', 'FZFXX', 'CORE**', 'Cash', 'USD'])(
    'maps money-market / cash %s to CASH',
    (raw) => {
      expect(normalizeTicker(raw)).toBe('CASH');
    },
  );

  it.each([
    ['BTC-USD', 'BTC'],
    ['X:BTCUSD', 'BTC'],
    ['ETH/USD', 'ETH'],
    ['BTCUSD', 'BTC'],
    ['sol-usdt', 'SOL'],
  ])('maps crypto pair %s to %s', (raw, expected) => {
    expect(normalizeTicker(raw)).toBe(expected);
  });

  it('leaves ordinary tickers alone', () => {
    expect(normalizeTicker('QQQM')).toBe('QQQM');
    expect(normalizeTicker('SVF-1')).toBe('SVF-1');
    expect(normalizeTicker('T')).toBe('T');
  });
});

describe('isCashTicker', () => {
  it('detects cash equivalents only', () => {
    expect(isCashTicker('SPAXX')).toBe(true);
    expect(isCashTicker('CASH')).toBe(true);
    expect(isCashTicker('VOO')).toBe(false);
  });
});
