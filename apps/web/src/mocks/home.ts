// MOCK DATA — Home dashboard. Replace with GET /api/v1/overview (+ /insights, /market-context).
import type {
  AllocationData,
  ExposureInsight,
  MarketQuote,
  PortfolioSummary,
} from '@/components/types';
import { seriesSet } from './series';

export const AS_OF = '2026-09-30';

export const overview = {
  totalValue: 75_306,
  portfolioCount: 3,
  diversificationScore: 47,
  asOf: AS_OF,
  series: seriesSet(75_306, 7, { '1D': -0.0062, '1M': 0.021, '1Y': 0.182 }),
};

export const allocation: AllocationData[] = [
  {
    mode: 'sector',
    slices: [
      { key: 'tech', label: 'Technology', weight: 0.43, changeToday: -0.021 },
      { key: 'fin', label: 'Financials', weight: 0.16, changeToday: 0.008 },
      { key: 'comm', label: 'Communication', weight: 0.14, changeToday: -0.013 },
      { key: 'hc', label: 'Health Care', weight: 0.1, changeToday: 0.004 },
      { key: 'cons', label: 'Consumer', weight: 0.08, changeToday: 0.011 },
      { key: 'other', label: 'Other', weight: 0.09, changeToday: -0.002 },
    ],
  },
  {
    mode: 'holding',
    slices: [
      { key: 'googl', label: 'GOOGL', weight: 0.152, changeToday: -0.018 },
      { key: 'nvda', label: 'NVDA', weight: 0.091, changeToday: -0.034 },
      { key: 'brkb', label: 'BRK.B', weight: 0.074, changeToday: 0.006 },
      { key: 'msft', label: 'MSFT', weight: 0.068, changeToday: -0.011 },
      { key: 'aapl', label: 'AAPL', weight: 0.061, changeToday: -0.007 },
      { key: 'other', label: 'Other', weight: 0.554, changeToday: -0.004 },
    ],
  },
  {
    mode: 'overlap',
    slices: [
      { key: 'voo-qqqm', label: 'VOO ∩ QQQM', weight: 0.21, changeToday: null },
      { key: 'voo-schg', label: 'VOO ∩ SCHG', weight: 0.17, changeToday: null },
      { key: 'qqqm-vgt', label: 'QQQM ∩ VGT', weight: 0.12, changeToday: null },
      { key: 'unique', label: 'Other', weight: 0.5, changeToday: null },
    ],
  },
];

export const portfolios: PortfolioSummary[] = [
  {
    id: 'single-stock-bet',
    name: 'Single Stock Bet',
    type: 'actual',
    totalValue: 12_374,
    holdingsCount: 3,
    topHolding: { ticker: 'GOOGL', weight: 0.649 },
    diversificationScore: 0,
    mix: [
      { key: 'comm', label: 'Communication', weight: 0.65 },
      { key: 'tech', label: 'Technology', weight: 0.2 },
      { key: 'fin', label: 'Financials', weight: 0.1 },
      { key: 'other', label: 'Other', weight: 0.05 },
    ],
    asOf: AS_OF,
  },
  {
    id: 'taxable-core',
    name: 'Taxable Core',
    type: 'actual',
    totalValue: 27_443,
    holdingsCount: 14,
    topHolding: { ticker: 'BRK.B', weight: 0.12 },
    diversificationScore: 33,
    mix: [
      { key: 'tech', label: 'Technology', weight: 0.22 },
      { key: 'fin', label: 'Financials', weight: 0.2 },
      { key: 'comm', label: 'Communication', weight: 0.18 },
      { key: 'hc', label: 'Health Care', weight: 0.14 },
      { key: 'cons', label: 'Consumer', weight: 0.12 },
      { key: 'other', label: 'Other', weight: 0.08 },
    ],
    asOf: AS_OF,
  },
  {
    id: 'growth-tilt',
    name: 'Growth Tilt',
    type: 'hypothetical',
    totalValue: 35_489,
    holdingsCount: 4,
    topHolding: { ticker: 'NVDA', weight: 0.122 },
    diversificationScore: 44,
    mix: [
      { key: 'tech', label: 'Technology', weight: 0.5 },
      { key: 'fin', label: 'Financials', weight: 0.25 },
      { key: 'comm', label: 'Communication', weight: 0.15 },
      { key: 'other', label: 'Other', weight: 0.1 },
    ],
    asOf: AS_OF,
  },
];

export const insights: ExposureInsight[] = [
  {
    id: 'i1',
    severity: 'high',
    text: 'Single Stock Bet: 65% of this portfolio is one company (GOOGL).',
    askQuery: 'Why is Single Stock Bet so concentrated in GOOGL?',
  },
  {
    id: 'i2',
    severity: 'high',
    text: 'NVDA is 9.1% of everything you own, and all of it arrives through 5 ETFs.',
    askQuery: 'Which of my ETFs hold NVDA, and how much does each add?',
  },
  {
    id: 'i3',
    severity: 'medium',
    text: 'VOO sits in 2 portfolios, so the same S&P 500 core is counted twice.',
    askQuery: 'How much of my money is in VOO across all portfolios?',
  },
];

export const marketContext: MarketQuote[] = [
  { ticker: 'SCHD', name: 'Schwab US Dividend', change: 0.017, asOf: AS_OF },
  { ticker: 'VTV', name: 'Vanguard Value', change: 0.0082, asOf: AS_OF },
  { ticker: 'VOO', name: 'Vanguard S&P 500', change: -0.011, asOf: AS_OF },
  { ticker: 'QQQM', name: 'Invesco Nasdaq 100', change: -0.0185, asOf: AS_OF },
];

export const askSuggestions = [
  'Would QQQ overlap with my portfolio?',
  'Why is my tech exposure so high?',
];
