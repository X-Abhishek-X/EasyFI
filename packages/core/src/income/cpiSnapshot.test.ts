import { describe, expect, it } from 'vitest';
import type { CpiPoint } from '../types';
import { cpiSnapshot } from './cpiSnapshot';
import { addMonthKey } from './dates';

/** Builds a series growing at a constant monthly rate ending at 2026-09. */
function series(seriesId: string, months: number, monthly: number, start = 100): CpiPoint[] {
  return Array.from({ length: months }, (_, i) => ({
    seriesId,
    period: addMonthKey('2026-09', i - months + 1),
    value: start * (1 + monthly) ** i,
  }));
}

describe('cpiSnapshot', () => {
  const headline = series('CPIAUCSL', 30, 0.0025);
  const shelter = series('SHELTER', 30, 0.004);
  const energy = series('ENERGY', 30, -0.003);
  const food = series('FOOD', 30, 0.002);

  it('computes headline YoY, MoM, 12-month trend and as-of period', () => {
    const r = cpiSnapshot([...headline, ...shelter], {
      headlineSeriesId: 'CPIAUCSL',
      categories: { SHELTER: 'Shelter' },
    });
    expect(r.asOfPeriod).toBe('2026-09');
    expect(r.headline!.yoy).toBeCloseTo(1.0025 ** 12 - 1, 10);
    expect(r.headline!.mom).toBeCloseTo(0.0025, 10);
    expect(r.trend).toHaveLength(12);
    expect(r.trend[0]!.period).toBe('2025-10');
    expect(r.trend[11]!.period).toBe('2026-09');
    expect(r.trend[11]!.yoy).toBeCloseTo(r.headline!.yoy!, 12);
  });

  it('sorts category drivers by YoY magnitude without weights', () => {
    const r = cpiSnapshot([...headline, ...energy, ...shelter, ...food].reverse(), {
      headlineSeriesId: 'CPIAUCSL',
      categories: { SHELTER: 'Shelter', ENERGY: 'Energy', FOOD: 'Food' },
    });
    expect(r.drivers.map((d) => d.label)).toEqual(['Shelter', 'Energy', 'Food']);
    expect(r.drivers[1]!.yoy).toBeLessThan(0);
    expect(r.drivers[0]!.contribution).toBeNull();
  });

  it('sorts by contribution (weight × YoY) when weights are given', () => {
    const r = cpiSnapshot([...headline, ...energy, ...shelter, ...food], {
      headlineSeriesId: 'CPIAUCSL',
      categories: { SHELTER: 'Shelter', ENERGY: 'Energy', FOOD: 'Food' },
      weights: { SHELTER: 0.35, ENERGY: 0.07, FOOD: 0.13 },
    });
    expect(r.drivers.map((d) => d.label)).toEqual(['Shelter', 'Food', 'Energy']);
    expect(r.drivers[0]!.contribution).toBeCloseTo(0.35 * (1.004 ** 12 - 1), 10);
  });

  it('returns null YoY when a year of history is missing, and handles empty input', () => {
    const r = cpiSnapshot(series('CPIAUCSL', 5, 0.002), {
      headlineSeriesId: 'CPIAUCSL',
      categories: {},
    });
    expect(r.headline!.yoy).toBeNull();
    expect(r.headline!.mom).toBeCloseTo(0.002, 10);
    expect(r.trend).toEqual([]);

    const empty = cpiSnapshot([], { headlineSeriesId: 'CPIAUCSL', categories: { X: 'x' } });
    expect(empty.asOfPeriod).toBeNull();
    expect(empty.headline).toBeNull();
    expect(empty.drivers).toEqual([]);
  });

  it("uses a lagging category's own latest period", () => {
    const lag = series('SHELTER', 30, 0.004).slice(0, -1); // ends 2026-08
    const r = cpiSnapshot([...headline, ...lag], {
      headlineSeriesId: 'CPIAUCSL',
      categories: { SHELTER: 'Shelter' },
    });
    expect(r.drivers[0]!.period).toBe('2026-08');
  });
});
