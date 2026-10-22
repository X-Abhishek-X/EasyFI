import { demoPortfolios, fundHoldings, latestPrices, securities } from '@easyfi/test-fixtures';
import { describe, expect, it } from 'vitest';
import type { FundHoldingsMap, LatestPrices, SecurityMap } from '../types';
import { constellationGraph } from './constellationGraph';
import { lookThrough } from './lookThrough';
import { etf, holding, px, snapshot, stock } from './testHelpers';

const secs: SecurityMap = {
  AAA: stock('AAA'),
  BBB: stock('BBB'),
  CCC: stock('CCC'),
  F1: etf('F1'),
  F2: etf('F2'),
};
const books: FundHoldingsMap = {
  F1: snapshot('F1', [
    ['AAA', 0.5],
    ['BBB', 0.3],
  ]),
  F2: snapshot('F2', [
    ['AAA', 0.6],
    ['CCC', 0.1],
  ]),
};
const prices: LatestPrices = { AAA: px(100), F1: px(10), F2: px(10) };
const lt = (holdings = [holding('F1', 100), holding('F2', 100)]) =>
  lookThrough({ holdings, fundHoldings: books, prices, securities: secs });

describe('constellationGraph', () => {
  it('makes funds hubs and links each holding to every fund containing it', () => {
    const g = constellationGraph(lt());
    const ids = g.nodes.map((n) => n.id);
    expect(ids).toEqual(['fund:F1', 'fund:F2', 'holding:AAA', 'holding:BBB', 'holding:CCC']);
    const aaa = g.nodes.find((n) => n.id === 'holding:AAA')!;
    expect(aaa).toMatchObject({
      kind: 'holding',
      ticker: 'AAA',
      label: 'AAA Inc',
      value: 1100,
      concentration: 'high',
    });
    expect(
      g.edges
        .filter((e) => e.target === 'holding:AAA')
        .map((e) => e.source)
        .sort(),
    ).toEqual(['fund:F1', 'fund:F2']);
    const edge = g.edges.find((e) => e.source === 'fund:F2' && e.target === 'holding:AAA')!;
    expect(edge.weightInFund).toBeCloseTo(0.6);
    expect(edge.weight).toBeCloseTo(600 / 2000);
    expect(g.nodes.find((n) => n.id === 'fund:F1')).toMatchObject({
      kind: 'fund',
      ticker: 'F1',
      value: 1000,
      weight: 0.5,
    });
  });

  it('keeps only the top N holdings and the hubs they need', () => {
    const g = constellationGraph(lt([holding('F1', 100)]), { maxNodes: 1 });
    expect(g.nodes.map((n) => n.id)).toEqual(['fund:F1', 'holding:AAA']);
    expect(g.edges).toHaveLength(1);
  });

  it('adds a direct hub only when a shown holding is held directly', () => {
    expect(constellationGraph(lt()).nodes.some((n) => n.kind === 'direct')).toBe(false);
    const g = constellationGraph(lt([holding('AAA', 1), holding('F1', 100)]));
    expect(g.nodes[0]).toMatchObject({ id: 'direct', kind: 'direct', ticker: null, value: 100 });
    expect(g.edges.find((e) => e.source === 'direct')).toMatchObject({
      target: 'holding:AAA',
      weightInFund: null,
    });
  });

  it('never includes tails, unmapped lines or cash as holding nodes', () => {
    const family = demoPortfolios[1]!;
    const r = lookThrough({
      holdings: family.holdings,
      cash: family.cash,
      fundHoldings,
      prices: latestPrices(),
      securities,
    });
    const g = constellationGraph(r, { maxNodes: 25 });
    const holdings = g.nodes.filter((n) => n.kind === 'holding');
    expect(holdings).toHaveLength(25);
    expect(holdings.every((n) => n.ticker !== null && n.ticker !== 'CASH')).toBe(true);
    expect(holdings[0]!.ticker).toBe('BRK.B');
    for (const e of g.edges) expect(g.nodes.some((n) => n.id === e.source)).toBe(true);
  });
});
