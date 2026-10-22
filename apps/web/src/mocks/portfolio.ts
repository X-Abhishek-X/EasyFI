// MOCK DATA — portfolio detail / look-through. Replace with
// GET /api/v1/portfolios/{id}, /portfolios/{id}/exposure?fold=…, /portfolios/{id}/constellation.
import type { ConstellationHolding } from '@/components/portfolio/types';
import type {
  AllocationData,
  Concentration,
  ExposureRow,
  ExposureSource,
  FoldBy,
  FundRef,
} from '@/components/types';
import { seriesSet } from './series';

export const PORTFOLIO_AS_OF = '2026-09-30';
const TOTAL = 27_443;

export const funds: FundRef[] = [
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { ticker: 'QQQM', name: 'Invesco Nasdaq 100 ETF' },
  { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF' },
  { ticker: 'SPMO', name: 'Invesco S&P 500 Momentum ETF' },
  { ticker: 'VGT', name: 'Vanguard Information Technology ETF' },
];

/** Color order for sources: index → chart palette slot. DIRECT is always pink (slot 5). */
export const sourceOrder = ['VOO', 'QQQM', 'SCHD', 'SPMO', 'DIRECT', 'VGT'] as const;

const FUND_NAME = Object.fromEntries(funds.map((f) => [f.ticker, f.name])) as Record<
  string,
  string
>;

type Src = [ticker: string, contribution: number, weightInFund: number | null];

function sources(list: Src[]): ExposureSource[] {
  return list
    .map(([t, contribution, weightInFund]) => ({
      sourceTicker: t,
      sourceName: t === 'DIRECT' ? 'Held directly' : (FUND_NAME[t] ?? t),
      weightInFund,
      contribution,
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

function level(weight: number, high: number, medium: number): Concentration {
  return weight >= high ? 'high' : weight >= medium ? 'medium' : 'low';
}

function row(
  key: string,
  ticker: string | null,
  name: string,
  sector: string | null,
  industry: string | null,
  list: Src[],
  thresholds: [number, number],
): ExposureRow {
  const s = sources(list);
  const weight = Math.round(s.reduce((a, x) => a + x.contribution, 0) * 10_000) / 10_000;
  return {
    key,
    ticker,
    name,
    sector,
    industry,
    weight,
    value: Math.round(weight * TOTAL),
    concentration: level(weight, thresholds[0], thresholds[1]),
    sources: s,
  };
}

const CO: [number, number] = [0.08, 0.02];

export const companyRows: ExposureRow[] = [
  row(
    'BRK.B',
    'BRK.B',
    'Berkshire Hathaway Inc',
    'Financials',
    'Multi-Sector Holdings',
    [
      ['DIRECT', 0.0785, null],
      ['VOO', 0.0262, 0.017],
      ['SPMO', 0.015, 0.031],
    ],
    CO,
  ),
  row(
    'MSFT',
    'MSFT',
    'Microsoft Corp',
    'Information Technology',
    'Software',
    [
      ['DIRECT', 0.03, null],
      ['VOO', 0.0218, 0.064],
      ['QQQM', 0.0184, 0.081],
      ['VGT', 0.0129, 0.128],
      ['SPMO', 0.0079, 0.058],
    ],
    CO,
  ),
  row(
    'NVDA',
    'NVDA',
    'NVIDIA Corp',
    'Information Technology',
    'Semiconductors',
    [
      ['VOO', 0.0184, 0.069],
      ['QQQM', 0.0138, 0.086],
      ['SPMO', 0.0103, 0.112],
      ['VGT', 0.0086, 0.151],
      ['SCHD', 0.0063, 0.097],
    ],
    CO,
  ),
  row(
    'GOOGL',
    'GOOGL',
    'Alphabet Inc',
    'Communication Services',
    'Interactive Media',
    [
      ['DIRECT', 0.025, null],
      ['VOO', 0.0124, 0.039],
      ['QQQM', 0.0096, 0.059],
      ['SPMO', 0.006, 0.041],
    ],
    CO,
  ),
  row(
    'AAPL',
    'AAPL',
    'Apple Inc',
    'Information Technology',
    'Technology Hardware',
    [
      ['VOO', 0.022, 0.071],
      ['QQQM', 0.0142, 0.088],
      ['VGT', 0.0105, 0.155],
    ],
    CO,
  ),
  row(
    'AVGO',
    'AVGO',
    'Broadcom Inc',
    'Information Technology',
    'Semiconductors',
    [
      ['VOO', 0.0071, 0.023],
      ['QQQM', 0.0079, 0.049],
      ['VGT', 0.0047, 0.069],
      ['SPMO', 0.004, 0.044],
    ],
    CO,
  ),
  row(
    'AMZN',
    'AMZN',
    'Amazon.com Inc',
    'Consumer Discretionary',
    'Broadline Retail',
    [
      ['VOO', 0.0118, 0.038],
      ['QQQM', 0.0087, 0.054],
    ],
    CO,
  ),
  row(
    'META',
    'META',
    'Meta Platforms Inc',
    'Communication Services',
    'Interactive Media',
    [
      ['VOO', 0.0083, 0.027],
      ['QQQM', 0.0059, 0.037],
      ['SPMO', 0.0055, 0.06],
    ],
    CO,
  ),
  row(
    'PEP',
    'PEP',
    'PepsiCo Inc',
    'Consumer Staples',
    'Beverages',
    [
      ['SCHD', 0.0097, 0.041],
      ['VOO', 0.0022, 0.007],
      ['QQQM', 0.0021, 0.013],
    ],
    CO,
  ),
  row(
    'CSCO',
    'CSCO',
    'Cisco Systems Inc',
    'Information Technology',
    'Communications Equipment',
    [
      ['SCHD', 0.0093, 0.04],
      ['VGT', 0.0036, 0.042],
      ['QQQM', 0.0024, 0.015],
      ['VOO', 0.0018, 0.006],
    ],
    CO,
  ),
  row(
    'HD',
    'HD',
    'Home Depot Inc',
    'Consumer Discretionary',
    'Home Improvement Retail',
    [
      ['SCHD', 0.0096, 0.041],
      ['VOO', 0.0035, 0.011],
    ],
    CO,
  ),
  row(
    'KO',
    'KO',
    'Coca-Cola Co',
    'Consumer Staples',
    'Beverages',
    [
      ['SCHD', 0.0098, 0.042],
      ['VOO', 0.0019, 0.006],
    ],
    CO,
  ),
  row(
    'ABBV',
    'ABBV',
    'AbbVie Inc',
    'Health Care',
    'Biotechnology',
    [
      ['SCHD', 0.0101, 0.043],
      ['VOO', 0.0023, 0.007],
    ],
    CO,
  ),
  row(
    'JPM',
    'JPM',
    'JPMorgan Chase & Co',
    'Financials',
    'Banks',
    [
      ['SPMO', 0.0052, 0.054],
      ['VOO', 0.0046, 0.015],
    ],
    CO,
  ),
].sort((a, b) => b.weight - a.weight);

const SEC: [number, number] = [0.25, 0.1];
export const sectorRows: ExposureRow[] = [
  row(
    'it',
    null,
    'Information Technology',
    null,
    null,
    [
      ['VOO', 0.112, 0.31],
      ['QQQM', 0.098, 0.51],
      ['VGT', 0.081, 0.99],
      ['DIRECT', 0.03, null],
      ['SPMO', 0.041, 0.27],
      ['SCHD', 0.028, 0.09],
    ],
    SEC,
  ),
  row(
    'fin',
    null,
    'Financials',
    null,
    null,
    [
      ['DIRECT', 0.0785, null],
      ['VOO', 0.047, 0.13],
      ['SPMO', 0.033, 0.19],
      ['SCHD', 0.021, 0.09],
    ],
    SEC,
  ),
  row(
    'comm',
    null,
    'Communication Services',
    null,
    null,
    [
      ['DIRECT', 0.025, null],
      ['VOO', 0.033, 0.09],
      ['QQQM', 0.052, 0.16],
      ['SPMO', 0.04, 0.11],
    ],
    SEC,
  ),
  row(
    'hc',
    null,
    'Health Care',
    null,
    null,
    [
      ['VOO', 0.043, 0.12],
      ['SCHD', 0.036, 0.16],
      ['QQQM', 0.021, 0.06],
    ],
    SEC,
  ),
  row(
    'cd',
    null,
    'Consumer Discretionary',
    null,
    null,
    [
      ['VOO', 0.036, 0.1],
      ['QQQM', 0.031, 0.13],
      ['SCHD', 0.023, 0.08],
    ],
    SEC,
  ),
  row(
    'cs',
    null,
    'Consumer Staples',
    null,
    null,
    [
      ['SCHD', 0.031, 0.19],
      ['VOO', 0.013, 0.06],
      ['QQQM', 0.006, 0.05],
    ],
    SEC,
  ),
  row(
    'ind',
    null,
    'Industrials',
    null,
    null,
    [
      ['VOO', 0.022, 0.08],
      ['SCHD', 0.012, 0.12],
      ['SPMO', 0.006, 0.07],
    ],
    SEC,
  ),
].sort((a, b) => b.weight - a.weight);

const IND: [number, number] = [0.08, 0.03];
export const industryRows: ExposureRow[] = [
  row(
    'semis',
    null,
    'Semiconductors',
    'Information Technology',
    null,
    [
      ['VOO', 0.031, 0.1],
      ['QQQM', 0.029, 0.15],
      ['VGT', 0.026, 0.31],
      ['SPMO', 0.018, 0.16],
    ],
    IND,
  ),
  row(
    'software',
    null,
    'Software',
    'Information Technology',
    null,
    [
      ['DIRECT', 0.03, null],
      ['VOO', 0.029, 0.1],
      ['QQQM', 0.021, 0.12],
      ['VGT', 0.019, 0.22],
    ],
    IND,
  ),
  row(
    'msh',
    null,
    'Multi-Sector Holdings',
    'Financials',
    null,
    [
      ['DIRECT', 0.0785, null],
      ['VOO', 0.0262, 0.017],
      ['SPMO', 0.015, 0.031],
    ],
    IND,
  ),
  row(
    'im',
    null,
    'Interactive Media',
    'Communication Services',
    null,
    [
      ['DIRECT', 0.025, null],
      ['VOO', 0.021, 0.066],
      ['QQQM', 0.016, 0.096],
      ['SPMO', 0.012, 0.1],
    ],
    IND,
  ),
  row(
    'hw',
    null,
    'Technology Hardware',
    'Information Technology',
    null,
    [
      ['VOO', 0.024, 0.08],
      ['QQQM', 0.016, 0.1],
      ['VGT', 0.012, 0.17],
    ],
    IND,
  ),
  row(
    'banks',
    null,
    'Banks',
    'Financials',
    null,
    [
      ['VOO', 0.014, 0.04],
      ['SPMO', 0.011, 0.07],
      ['SCHD', 0.008, 0.05],
    ],
    IND,
  ),
  row(
    'bev',
    null,
    'Beverages',
    'Consumer Staples',
    null,
    [
      ['SCHD', 0.0195, 0.083],
      ['VOO', 0.0041, 0.013],
      ['QQQM', 0.0021, 0.013],
    ],
    IND,
  ),
  row(
    'retail',
    null,
    'Broadline Retail',
    'Consumer Discretionary',
    null,
    [
      ['VOO', 0.0118, 0.038],
      ['QQQM', 0.0087, 0.054],
    ],
    IND,
  ),
].sort((a, b) => b.weight - a.weight);

export const rowsByFold: Record<FoldBy, ExposureRow[]> = {
  company: companyRows,
  sector: sectorRows,
  industry: industryRows,
};

// Smaller constituents shown as unlabeled dots in the constellation.
const SMALL: [ticker: string, name: string, sector: string, funds: string[]][] = [
  ['COST', 'Costco Wholesale Corp', 'Consumer Staples', ['QQQM']],
  ['WMT', 'Walmart Inc', 'Consumer Staples', ['VOO', 'SPMO']],
  ['XOM', 'Exxon Mobil Corp', 'Energy', ['VOO']],
  ['CVX', 'Chevron Corp', 'Energy', ['SCHD']],
  ['MRK', 'Merck & Co Inc', 'Health Care', ['SCHD']],
  ['PG', 'Procter & Gamble Co', 'Consumer Staples', ['VOO']],
  ['UNH', 'UnitedHealth Group Inc', 'Health Care', ['VOO']],
  ['V', 'Visa Inc', 'Financials', ['VOO']],
  ['MA', 'Mastercard Inc', 'Financials', ['VOO']],
  ['ORCL', 'Oracle Corp', 'Information Technology', ['VGT', 'SPMO']],
  ['CRM', 'Salesforce Inc', 'Information Technology', ['VGT']],
  ['ADBE', 'Adobe Inc', 'Information Technology', ['QQQM', 'VGT']],
  ['AMD', 'Advanced Micro Devices Inc', 'Information Technology', ['QQQM']],
  ['QCOM', 'Qualcomm Inc', 'Information Technology', ['QQQM']],
  ['INTC', 'Intel Corp', 'Information Technology', ['VGT']],
  ['NFLX', 'Netflix Inc', 'Communication Services', ['QQQM', 'SPMO']],
  ['TMO', 'Thermo Fisher Scientific Inc', 'Health Care', ['VOO']],
  ['LIN', 'Linde plc', 'Materials', ['QQQM']],
  ['MCD', "McDonald's Corp", 'Consumer Discretionary', ['VOO']],
  ['IBM', 'International Business Machines', 'Information Technology', ['VGT']],
  ['GE', 'GE Aerospace', 'Industrials', ['SPMO']],
  ['CAT', 'Caterpillar Inc', 'Industrials', ['VOO']],
  ['AMGN', 'Amgen Inc', 'Health Care', ['SCHD']],
  ['HON', 'Honeywell International Inc', 'Industrials', ['QQQM']],
  ['LOW', "Lowe's Companies Inc", 'Consumer Discretionary', ['SCHD']],
  ['SBUX', 'Starbucks Corp', 'Consumer Discretionary', ['QQQM']],
  ['BLK', 'BlackRock Inc', 'Financials', ['SCHD']],
  ['GS', 'Goldman Sachs Group Inc', 'Financials', ['SPMO']],
  ['MS', 'Morgan Stanley', 'Financials', ['SPMO']],
  ['SPGI', 'S&P Global Inc', 'Financials', ['VOO']],
  ['PFE', 'Pfizer Inc', 'Health Care', ['SCHD']],
  ['BMY', 'Bristol-Myers Squibb Co', 'Health Care', ['SCHD']],
  ['UPS', 'United Parcel Service Inc', 'Industrials', ['SCHD']],
  ['DE', 'Deere & Co', 'Industrials', ['VOO']],
  ['LMT', 'Lockheed Martin Corp', 'Industrials', ['SCHD']],
  ['TXN', 'Texas Instruments Inc', 'Information Technology', ['SCHD', 'QQQM']],
];

export const constellationHoldings: ConstellationHolding[] = [
  ...companyRows.map((r) => ({
    key: r.key,
    ticker: r.ticker ?? r.key,
    name: r.name,
    sector: r.sector,
    concentration: r.concentration,
    weight: r.weight,
    value: r.value,
    funds: r.sources.filter((s) => s.sourceTicker !== 'DIRECT').map((s) => s.sourceTicker),
    direct: r.sources.some((s) => s.sourceTicker === 'DIRECT'),
    labeled: true,
  })),
  ...SMALL.map(([ticker, name, sector, f], i) => {
    const weight = Math.round((0.0062 - i * 0.00012) * 10_000) / 10_000;
    return {
      key: ticker,
      ticker,
      name,
      sector,
      concentration: (i % 3 === 0 ? 'medium' : 'low') as Concentration,
      weight,
      value: Math.round(weight * TOTAL),
      funds: f,
      direct: false,
      labeled: false,
    };
  }),
];

export const portfolioAllocation: AllocationData[] = [
  {
    mode: 'sector',
    slices: [
      { key: 'tech', label: 'Technology', weight: 0.39, changeToday: -0.021 },
      { key: 'fin', label: 'Financials', weight: 0.18, changeToday: 0.008 },
      { key: 'comm', label: 'Communication', weight: 0.15, changeToday: -0.013 },
      { key: 'hc', label: 'Health Care', weight: 0.1, changeToday: 0.004 },
      { key: 'cons', label: 'Consumer', weight: 0.09, changeToday: 0.011 },
      { key: 'other', label: 'Other', weight: 0.09, changeToday: -0.002 },
    ],
  },
  {
    mode: 'holding',
    slices: [
      { key: 'brkb', label: 'BRK.B', weight: 0.12, changeToday: 0.006 },
      { key: 'msft', label: 'MSFT', weight: 0.091, changeToday: -0.011 },
      { key: 'nvda', label: 'NVDA', weight: 0.057, changeToday: -0.034 },
      { key: 'googl', label: 'GOOGL', weight: 0.053, changeToday: -0.018 },
      { key: 'aapl', label: 'AAPL', weight: 0.047, changeToday: -0.007 },
      { key: 'other', label: 'Other', weight: 0.632, changeToday: -0.004 },
    ],
  },
];

export type PortfolioDetail = {
  id: string;
  name: string;
  holdingsCount: number;
  currency: 'USD';
  totalValue: number | null;
  changeToday: number | null;
  diversificationScore: number | null;
  asOf: string;
};

const DETAILS: Record<string, Omit<PortfolioDetail, 'id' | 'currency' | 'asOf'>> = {
  'taxable-core': {
    name: 'Taxable Core',
    holdingsCount: 14,
    totalValue: TOTAL,
    changeToday: -0.024,
    diversificationScore: 33,
  },
  'single-stock-bet': {
    name: 'Single Stock Bet',
    holdingsCount: 3,
    totalValue: 12_374,
    changeToday: -0.018,
    diversificationScore: 0,
  },
  'growth-tilt': {
    name: 'Growth Tilt',
    holdingsCount: 4,
    totalValue: 35_489,
    changeToday: -0.027,
    diversificationScore: 44,
  },
};

/** Returns null for unknown ids. Every mock portfolio reuses the Taxable Core look-through. */
export function getPortfolioDetail(id: string): PortfolioDetail | null {
  const d = DETAILS[id];
  return d ? { id, currency: 'USD', asOf: PORTFOLIO_AS_OF, ...d } : null;
}

export const portfolioSeries = seriesSet(TOTAL, 13, {
  '7D': -0.011,
  '1M': 0.048,
  '3M': 0.071,
  YTD: 0.124,
  '1Y': 0.163,
  MAX: 0.412,
});
