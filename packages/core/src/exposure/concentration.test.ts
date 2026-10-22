import { describe, expect, it } from 'vitest';
import { concentration } from './concentration';
import { CONCENTRATION_HIGH_WEIGHT } from './constants';

describe('concentration', () => {
  it('is high for an operating company at or above the threshold', () => {
    expect(
      concentration({ kind: 'company', weight: CONCENTRATION_HIGH_WEIGHT, fundCount: 0 }),
    ).toBe('high');
    expect(concentration({ kind: 'company', weight: 0.12, fundCount: 3 })).toBe('high');
  });

  it('is never high for funds, cash, tails or unmapped lines', () => {
    for (const kind of ['fund', 'cash', 'tail', 'unmapped', 'asset'] as const) {
      expect(concentration({ kind, weight: 0.5, fundCount: 0 })).toBe('low');
    }
    expect(concentration({ kind: 'tail', weight: 0.5, fundCount: 2 })).toBe('low');
  });

  it('is medium when held through two or more funds', () => {
    expect(concentration({ kind: 'company', weight: 0.01, fundCount: 2 })).toBe('medium');
    expect(concentration({ kind: 'fund', weight: 0.01, fundCount: 2 })).toBe('medium');
  });

  it('is low otherwise', () => {
    expect(concentration({ kind: 'company', weight: 0.049, fundCount: 1 })).toBe('low');
  });
});
