import { describe, expect, it } from 'vitest';
import { fiProgress } from './fiProgress';

describe('fiProgress', () => {
  it('computes FI number with default 4% withdrawal rate and progress', () => {
    const r = fiProgress({
      currentValue: 250_000,
      annualExpenses: 40_000,
      monthlyContribution: 0,
      growthRate: 0,
      inflationRate: 0,
    });
    expect(r.fiNumber).toBe(1_000_000);
    expect(r.progress).toBe(0.25);
    expect(r.yearsToFi).toBeNull();
  });

  it('is already FI when value exceeds FI number', () => {
    const r = fiProgress({
      currentValue: 2_000_000,
      annualExpenses: 40_000,
      withdrawalRate: 0.04,
      monthlyContribution: 0,
      growthRate: 0.07,
      inflationRate: 0.03,
    });
    expect(r.progress).toBe(2);
    expect(r.yearsToFi).toBe(0);
  });

  it('projects years to FI in real terms using contributions only', () => {
    const r = fiProgress({
      currentValue: 0,
      annualExpenses: 12_000,
      withdrawalRate: 0.04,
      monthlyContribution: 1000,
      growthRate: 0.03,
      inflationRate: 0.03,
    });
    // real return 0 => 300k / 1k per month = 300 months = 25 years
    expect(r.fiNumber).toBe(300_000);
    expect(r.realGrowthRate).toBeCloseTo(0, 12);
    expect(r.yearsToFi).toBeCloseTo(25, 6);
    const last = r.series[r.series.length - 1]!;
    expect(last.year).toBeGreaterThanOrEqual(25);
    const y25 = r.series.find((p) => p.year === 25)!;
    expect(y25.real).toBeCloseTo(300_000, 4);
    expect(y25.nominal).toBeCloseTo(300_000 * 1.03 ** 25, 2);
    expect(y25.fiNumberNominal).toBeCloseTo(300_000 * 1.03 ** 25, 2);
  });

  it('with real growth reaches FI sooner than contributions alone', () => {
    const r = fiProgress({
      currentValue: 100_000,
      annualExpenses: 40_000,
      monthlyContribution: 2000,
      growthRate: 0.07,
      inflationRate: 0.03,
    });
    expect(r.yearsToFi).not.toBeNull();
    expect(r.yearsToFi!).toBeGreaterThan(10);
    expect(r.yearsToFi!).toBeLessThan(25);
    expect(r.series[0]).toMatchObject({ year: 0, real: 100_000, nominal: 100_000 });
  });

  it('rejects non-positive withdrawal rate', () => {
    expect(() =>
      fiProgress({
        currentValue: 1,
        annualExpenses: 1,
        withdrawalRate: 0,
        monthlyContribution: 0,
        growthRate: 0,
        inflationRate: 0,
      }),
    ).toThrow(RangeError);
  });
});
