import { describe, expect, it } from 'vitest';
import { parseMoney } from './parseMoney';

describe('parseMoney', () => {
  it.each([
    ['1234.5', 1234.5],
    ['$1,234.50', 1234.5],
    [' $ 1,234.50 ', 1234.5],
    ['+$12.34', 12.34],
    ['-$5.00', -5],
    ['$-5.00', -5],
    ['(123.45)', -123.45],
    ['($5)', -5],
    ['(5)', -5],
    ['1.2k', 1200],
    ['2.5M', 2_500_000],
    ['1b', 1_000_000_000],
    ['−3', -3],
    ['.5', 0.5],
    ['100 USD', 100],
  ])('parses %s', (input, expected) => {
    expect(parseMoney(input)).toBeCloseTo(expected, 10);
  });

  it.each(['', '  ', '--', '-', 'n/a', 'N/A', 'NA', 'abc', '1.2.3', '$', '()', '12%'])(
    'returns null for %j',
    (input) => {
      expect(parseMoney(input)).toBeNull();
    },
  );

  it('returns null for null/undefined', () => {
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney(undefined)).toBeNull();
  });

  it('passes finite numbers through', () => {
    expect(parseMoney(42)).toBe(42);
    expect(parseMoney(Number.NaN)).toBeNull();
  });
});
