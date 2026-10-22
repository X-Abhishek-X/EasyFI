import { describe, expect, it } from 'vitest';
import {
  CPI_SERIES,
  PRICE_AS_OF,
  allPriceHistory,
  cpi,
  demoPortfolios,
  dividends,
  fundHoldings,
  latestPrices,
  priceHistory,
  securities,
} from './index';

const FUNDS = ['VOO', 'QQQ', 'QQQM', 'SCHD', 'VGT', 'VTI', 'SCHG', 'SPMO', 'VYM', 'JEPI', 'FXAIX'];

describe('securities', () => {
  it('has metadata for every fund and every constituent', () => {
    for (const f of FUNDS) {
      expect(securities[f], f).toBeDefined();
      expect(securities[f]!.expenseRatio, f).toBeGreaterThan(0);
    }
    for (const snap of Object.values(fundHoldings)) {
      for (const c of snap.constituents) {
        if (c.constituentTicker) expect(securities[c.constituentTicker], c.name).toBeDefined();
      }
    }
  });
});

describe('fundHoldings', () => {
  it('covers all seeded funds with weights summing to at most 1', () => {
    for (const f of FUNDS) {
      const snap = fundHoldings[f];
      expect(snap, f).toBeDefined();
      const sum = snap!.constituents.reduce((s, c) => s + c.weight, 0);
      expect(sum, f).toBeLessThanOrEqual(1.0001);
      expect(sum, f).toBeGreaterThan(0.3);
      for (const c of snap!.constituents) expect(c.fundTicker).toBe(f);
    }
  });

  it('listed sector weights never exceed the full-fund sector weights', () => {
    for (const [f, snap] of Object.entries(fundHoldings)) {
      const listed: Record<string, number> = {};
      for (const c of snap.constituents) {
        if (c.sector) listed[c.sector] = (listed[c.sector] ?? 0) + c.weight;
      }
      for (const [sector, w] of Object.entries(listed)) {
        expect(w, `${f} ${sector}`).toBeLessThanOrEqual((snap.sectorWeights?.[sector] ?? 0) + 1e-6);
      }
    }
  });

  it('includes unmapped lines and BRK.B in dotted form', () => {
    expect(fundHoldings.JEPI!.constituents.some((c) => c.constituentTicker === null)).toBe(true);
    expect(fundHoldings.VOO!.constituents.some((c) => c.constituentTicker === 'BRK.B')).toBe(true);
    expect(fundHoldings.VTI!.constituents.some((c) => c.constituentTicker === 'BRK.B')).toBe(true);
  });
});

describe('prices', () => {
  it('is deterministic, weekday-only and ends at the as-of date', () => {
    const a = priceHistory('VOO');
    const b = priceHistory('VOO');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(480);
    expect(a.at(-1)!.date).toBe(PRICE_AS_OF);
    for (const p of a) {
      const day = new Date(`${p.date}T00:00:00Z`).getUTCDay();
      expect(day).not.toBe(0);
      expect(day).not.toBe(6);
      expect(p.close).toBeGreaterThan(0);
    }
  });

  it('anchors last closes near realistic levels', () => {
    const latest = latestPrices();
    expect(latest.VOO!.close).toBeCloseTo(560, 0);
    expect(latest.QQQ!.close).toBeCloseTo(520, 0);
    expect(latest.NVDA!.close).toBeCloseTo(180, 0);
    expect(latest.VOO!.prevClose).toBeGreaterThan(0);
    expect(latest['SVF-1']).toBeUndefined();
  });

  it('prices every fund and every priced demo holding', () => {
    const all = allPriceHistory();
    for (const f of FUNDS) expect(all[f], f).toBeDefined();
    for (const p of demoPortfolios) {
      for (const h of p.holdings) {
        if (h.statementValue === null) expect(all[h.ticker], h.ticker).toBeDefined();
      }
    }
  });
});

describe('dividends', () => {
  it('has history and upcoming ex-dates through 2026', () => {
    const voo = dividends.filter((d) => d.ticker === 'VOO');
    expect(voo.length).toBeGreaterThanOrEqual(8);
    expect(voo.some((d) => d.exDate > '2026-10-22')).toBe(true);
    const jepi = dividends.filter((d) => d.ticker === 'JEPI');
    expect(jepi.length).toBeGreaterThanOrEqual(24);
    expect(dividends.every((d) => d.amount > 0 && d.exDate <= '2026-12-31')).toBe(true);
  });
});

describe('cpi', () => {
  it('has 36 months for headline and every category series', () => {
    for (const s of Object.keys(CPI_SERIES)) {
      expect(cpi.filter((p) => p.seriesId === s).length, s).toBe(36);
    }
    const head = cpi.filter((p) => p.seriesId === 'CUUR0000SA0');
    const yoy = head.at(-1)!.value / head.at(-13)!.value - 1;
    expect(yoy).toBeGreaterThan(0.015);
    expect(yoy).toBeLessThan(0.045);
  });
});

describe('demoPortfolios', () => {
  it('has three portfolios worth roughly $75k in total', () => {
    const latest = latestPrices();
    let total = 0;
    for (const p of demoPortfolios) {
      total += p.cash;
      for (const h of p.holdings) {
        total += h.shares !== null ? h.shares * latest[h.ticker]!.close : (h.statementValue ?? 0);
      }
    }
    expect(demoPortfolios).toHaveLength(3);
    expect(total).toBeGreaterThan(70000);
    expect(total).toBeLessThan(80000);
    expect(demoPortfolios[1]!.holdings).toHaveLength(14);
  });
});
