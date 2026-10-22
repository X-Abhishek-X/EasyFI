// Tunable thresholds and reference tables for the exposure module.

/** Canonical ticker for every cash / money-market line. */
export const CASH_TICKER = 'CASH';

/** Money-market funds treated as cash (sweep vehicles at major brokers). */
export const MONEY_MARKET_TICKERS: readonly string[] = [
  'SPAXX',
  'SPRXX',
  'FDRXX',
  'FZFXX',
  'FZDXX',
  'FTEXX',
  'FDLXX',
  'FCASH',
  'CORE',
  'VMFXX',
  'VMRXX',
  'VUSXX',
  'VCTXX',
  'SWVXX',
  'SNVXX',
  'SNOXX',
  'SNSXX',
  'SWGXX',
  'TTTXX',
  'JPMXX',
  'GOFXX',
  'MMDA',
  'MMDA1',
];

/** Literal cash aliases seen in broker exports. */
export const CASH_ALIASES: readonly string[] = ['CASH', 'USD', 'CASH&EQUIV', 'CASH EQUIVALENTS'];

/** Crypto bases recognised in un-prefixed pairs such as BTCUSD. */
export const CRYPTO_SYMBOLS: readonly string[] = [
  'BTC',
  'ETH',
  'SOL',
  'XRP',
  'ADA',
  'DOGE',
  'LTC',
  'AVAX',
  'DOT',
  'LINK',
  'BCH',
  'XLM',
  'USDC',
];

/** Share-class aliases that cannot be inferred from punctuation. */
export const SHARE_CLASS_ALIASES: Readonly<Record<string, string>> = {
  BRKB: 'BRK.B',
  BRKA: 'BRK.A',
  BFB: 'BF.B',
  BFA: 'BF.A',
};

/**
 * Funds that track the same index. A fund without its own holdings book is looked through
 * using the first group member that has one (e.g. FXAIX → IVV/VOO book). The first member of
 * each group is its canonical ticker (used to spot "the same fund held twice").
 */
export const EQUIVALENT_FUND_GROUPS: Readonly<Record<string, readonly string[]>> = {
  'S&P 500': ['VOO', 'IVV', 'SPY', 'SPLG', 'FXAIX', 'VFIAX', 'SWPPX'],
  'Nasdaq-100': ['QQQ', 'QQQM'],
  'US total market': ['VTI', 'ITOT', 'SCHB', 'VTSAX', 'FSKAX', 'SWTSX', 'FZROX'],
  'US large-cap growth': ['SCHG', 'VUG', 'IWF'],
  'US high dividend': ['VYM', 'VHYAX'],
};

/** ticker → other tickers whose book can stand in for it, in preference order. */
export const FUND_EQUIVALENTS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.values(EQUIVALENT_FUND_GROUPS).flatMap((group) =>
    group.map((t) => [t, group.filter((o) => o !== t)] as const),
  ),
);

/** Max fund-of-funds recursion depth (1 = expand a held fund's own constituents only). */
export const DEFAULT_LOOK_THROUGH_DEPTH = 3;

/** Weight sums below this are treated as zero. */
export const WEIGHT_EPSILON = 1e-9;

/** concentration(): an operating company at or above this weight is 'high'. */
export const CONCENTRATION_HIGH_WEIGHT = 0.05;
/** concentration(): a holding reached through at least this many funds is 'medium'. */
export const CONCENTRATION_MEDIUM_FUND_COUNT = 2;

/**
 * diversificationScore(): effective number of positions (1/HHI) mapped linearly onto 0–100.
 * N_eff ≤ FLOOR scores 0; N_eff ≥ CEIL scores 100.
 */
export const DIVERSIFICATION_N_FLOOR = 3;
export const DIVERSIFICATION_N_CEIL = 60;

/** exposureInsights() thresholds. */
export const INSIGHT_THRESHOLDS = {
  singleStockHigh: 0.25,
  singleStockMedium: 0.1,
  multiFundHighWeight: 0.05,
  multiFundHighFunds: 2,
  multiFundMediumWeight: 0.03,
  multiFundMediumFunds: 3,
  sectorMedium: 0.4,
  sectorHigh: 0.6,
  overlapLow: 0.3,
  overlapMedium: 0.5,
  overlapHigh: 0.7,
  unresolvedMedium: 0.1,
} as const;
