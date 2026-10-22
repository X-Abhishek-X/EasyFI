import { describe, expect, it } from 'vitest';
import { purchasingPower } from './purchasingPower';

describe('purchasingPower', () => {
  it('with no contributions or growth, nominal is flat and real shrinks by inflation', () => {
    const r = purchasingPower({
      amount: 10_000,
      monthlyContribution: 0,
      inflationRate: 0.03,
      growthRate: 0,
      years: 10,
    });
    expect(r.rows).toHaveLength(11);
    expect(r.rows[0]).toEqual({ year: 0, contributed: 10_000, nominal: 10_000, real: 10_000 });
    expect(r.finalNominal).toBeCloseTo(10_000, 6);
    expect(r.finalReal).toBeCloseTo(10_000 / 1.03 ** 10, 6);
    expect(r.purchasingPowerOfAmount).toBeCloseTo(7440.94, 2);
    expect(r.amountNeededToMatch).toBeCloseTo(13_439.16, 2);
  });

  it('compounds growth annually-equivalent and adds monthly contributions', () => {
    const r = purchasingPower({
      amount: 1000,
      monthlyContribution: 100,
      inflationRate: 0,
      growthRate: 0.12,
      years: 1,
    });
    // 1000 grows to 1120; 12 end-of-month contributions at (1.12)^(1/12)-1 monthly.
    const m = 1.12 ** (1 / 12) - 1;
    const fv = 100 * (((1 + m) ** 12 - 1) / m);
    expect(r.rows[1]!.contributed).toBe(2200);
    expect(r.finalNominal).toBeCloseTo(1120 + fv, 6);
    expect(r.finalReal).toBeCloseTo(r.finalNominal, 6);
  });

  it('zero growth sums contributions exactly', () => {
    const r = purchasingPower({
      amount: 0,
      monthlyContribution: 50,
      inflationRate: 0.02,
      growthRate: 0,
      years: 2,
    });
    expect(r.finalNominal).toBeCloseTo(1200, 8);
    expect(r.finalReal).toBeCloseTo(1200 / 1.02 ** 2, 8);
  });

  it('rejects invalid inputs', () => {
    expect(() =>
      purchasingPower({
        amount: 1,
        monthlyContribution: 0,
        inflationRate: 0,
        growthRate: 0,
        years: -1,
      }),
    ).toThrow(RangeError);
    expect(() =>
      purchasingPower({
        amount: 1,
        monthlyContribution: 0,
        inflationRate: -1,
        growthRate: 0,
        years: 1,
      }),
    ).toThrow(RangeError);
  });
});
