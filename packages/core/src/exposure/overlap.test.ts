import { fundHoldings } from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import { overlap, sectorWeights } from './overlap';
import { snapshot } from './testHelpers';
import type { Exposure } from './types';

const IT = 'Information Technology';
const A = snapshot('A', [
  ['AAA', 0.5],
  ['BBB', 0.3],
  ['CCC', 0.2],
]);
const B = snapshot('B', [
  ['BBB', 0.6],
  ['AAA', 0.1],
  ['brk-b', 0.1],
  [null, 0.2, null, 'other'],
]);

describe('overlap', () => {
  it('lists shared holdings sorted by combined weight with overlap-by-weight Σmin', () => {
    const r = overlap(A, B);
    expect(r.shared.map((s) => s.ticker)).toEqual(['BBB', 'AAA']);
    expect(r.shared[0]).toMatchObject({
      ticker: 'BBB',
      name: 'BBB Inc',
      sector: IT,
      weightA: 0.3,
      weightB: 0.6,
    });
    expect(r.sharedCount).toBe(2);
    expect(r.countA).toBe(3);
    expect(r.countB).toBe(3);
    expect(r.overlapByWeight).toBeCloseTo(0.3 + 0.1);
  });

  it('accepts raw constituent lists and normalises tickers', () => {
    const left = snapshot('L', [['BRK.B', 0.4]]).constituents;
    expect(overlap(left, B).shared[0]).toMatchObject({
      ticker: 'BRK.B',
      weightA: 0.4,
      weightB: 0.1,
    });
  });

  it('accepts exposure sets (company kinds only)', () => {
    const exposures = [
      { key: 'AAA', ticker: 'AAA', name: 'AAA Inc', kind: 'company', sector: IT, weight: 0.7 },
      { key: 'tail:X:IT', ticker: null, name: 'Other', kind: 'tail', sector: IT, weight: 0.3 },
    ] as Exposure[];
    const r = overlap(exposures, A);
    expect(r.countA).toBe(1);
    expect(r.overlapByWeight).toBeCloseTo(0.5);
  });

  it('is symmetric and 1 for identical books', () => {
    expect(overlap(A, A).overlapByWeight).toBeCloseTo(1);
    expect(overlap(A, B).overlapByWeight).toBeCloseTo(overlap(B, A).overlapByWeight);
  });

  it('finds heavy overlap between VOO and QQQ fixtures', () => {
    const r = overlap(fundHoldings.VOO!, fundHoldings.QQQ!);
    expect(r.shared[0]!.ticker).toBe('NVDA');
    expect(r.overlapByWeight).toBeGreaterThan(0.35);
    expect(overlap(fundHoldings.QQQ!, fundHoldings.QQQM!).overlapByWeight).toBeCloseTo(0.855, 2);
  });
});

describe('sectorWeights', () => {
  it('uses full-fund sector weights when present, sorted desc', () => {
    const r = sectorWeights(fundHoldings.VOO!);
    expect(r[0]).toEqual({ sector: IT, weight: 0.34 });
    expect(r.reduce((s, x) => s + x.weight, 0)).toBeCloseTo(1);
  });

  it('adds an Other slice when sector weights do not cover the whole fund', () => {
    const r = sectorWeights(fundHoldings.JEPI!);
    expect(r.find((x) => x.sector === 'Other')!.weight).toBeCloseTo(0.125);
  });

  it('derives weights from constituents when no sectorWeights exist', () => {
    const r = sectorWeights(
      snapshot('S', [
        ['AAA', 0.5],
        ['BBB', 0.2, 'Energy'],
      ]),
    );
    expect(r.map((x) => x.sector)).toEqual([IT, 'Other', 'Energy']);
    expect(r.map((x) => x.weight)).toEqual([0.5, expect.closeTo(0.3), 0.2]);
  });
});
