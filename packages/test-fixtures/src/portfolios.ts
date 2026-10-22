// Demo user with three portfolios (~$75k total at the 2026-09-30 closes).
export interface FixtureHolding {
  id: string;
  portfolioId: string;
  ticker: string;
  accountType: 'taxable' | 'trad_ira' | 'roth_ira' | '401k' | 'roth_401k' | 'other';
  shares: number | null;
  costBasis: number | null;
  statementValue: number | null;
  statementDate: string | null;
  tags: string[];
}

export interface FixturePortfolio {
  id: string;
  name: string;
  type: 'actual' | 'hypothetical' | 'watchlist';
  holdings: FixtureHolding[];
  cash: number;
}

export const DEMO_USER_ID = '00000000-0000-4000-8000-00000000d3e0';

type Line = [
  ticker: string,
  shares: number,
  costBasis: number,
  accountType: FixtureHolding['accountType'],
  tags: string[],
];

function portfolio(id: string, name: string, cash: number, lines: Line[]): FixturePortfolio {
  return {
    id,
    name,
    type: 'actual',
    cash,
    holdings: lines.map(([ticker, shares, costBasis, accountType, tags], i) => ({
      id: `${id}-h${String(i + 1).padStart(2, '0')}`,
      portfolioId: id,
      ticker,
      accountType,
      shares,
      costBasis,
      statementValue: null,
      statementDate: null,
      tags,
    })),
  };
}

export const singleStockBet: FixturePortfolio = portfolio('pf-single', 'Single Stock Bet', 0, [
  ['GOOGL', 33, 4950, 'taxable', ['growth', 'conviction']],
  ['VOO', 5, 2310, 'taxable', ['core']],
  ['QQQ', 3, 1290, 'taxable', ['growth']],
]);

const familyLines: Line[] = [
  ['VOO', 6, 2640, 'taxable', ['core']],
  ['QQQM', 10, 1710, 'taxable', ['growth']],
  ['SCHG', 60, 1500, 'taxable', ['growth']],
  ['VGT', 3, 1620, 'taxable', ['growth', 'tech']],
  ['SPMO', 15, 1290, 'taxable', ['momentum']],
  ['SCHD', 100, 2610, 'taxable', ['income']],
  ['BRK.B', 6.5, 2600, 'taxable', ['value']],
  ['MSFT', 3, 1140, 'taxable', ['tech']],
  ['GOOGL', 6, 960, 'taxable', ['growth']],
  ['JNJ', 6, 930, 'taxable', ['income']],
  ['KO', 20, 1180, 'taxable', ['income']],
  ['VYM', 10, 1190, 'taxable', ['income']],
  ['AAPL', 5, 880, 'taxable', ['tech']],
];

const family = portfolio('pf-taxable', 'Family Taxable', 1200, familyLines);

/** A 401k stable value fund: no market price, only a statement value. */
const stableValue: FixtureHolding = {
  id: 'pf-taxable-h14',
  portfolioId: 'pf-taxable',
  ticker: 'SVF-1',
  accountType: '401k',
  shares: null,
  costBasis: 1450,
  statementValue: 1500,
  statementDate: '2026-09-30',
  tags: ['stable'],
};

export const familyTaxable: FixturePortfolio = {
  ...family,
  holdings: [...family.holdings, stableValue],
};

export const growthTechTilt: FixturePortfolio = portfolio('pf-growth', 'Growth / Tech Tilt', 1000, [
  ['QQQ', 25, 9800, 'roth_ira', ['growth']],
  ['VGT', 12, 5400, 'roth_ira', ['growth', 'tech']],
  ['SCHG', 300, 6300, 'roth_ira', ['growth']],
  ['NVDA', 12, 1100, 'roth_ira', ['tech', 'conviction']],
]);

export const demoPortfolios: FixturePortfolio[] = [singleStockBet, familyTaxable, growthTechTilt];
