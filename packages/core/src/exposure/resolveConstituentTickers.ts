// N-PORT identifies holdings by CUSIP/ISIN/LEI, rarely by ticker. SEC's free company list has
// ticker + legal name, so filings are matched to tickers by exact *normalised* issuer name.
// Exact-match only: a wrong ticker would silently merge two companies' exposure, while a miss just
// lands in the unresolved slice (spec §11).

const SUFFIXES = new Set([
  'INC',
  'INCORPORATED',
  'CORP',
  'CORPORATION',
  'CO',
  'COMPANY',
  'LTD',
  'LIMITED',
  'PLC',
  'LLC',
  'LP',
  'HOLDINGS',
  'HOLDING',
  'GROUP',
  'NV',
  'SA',
  'AG',
  'SE',
  'THE',
  'CLASS',
  'CL',
  'A',
  'B',
  'C',
  'SHS',
  'COM',
  'NEW',
  'DEL',
]);

/** Upper-case, punctuation-free issuer name without legal suffixes or share-class words. */
export function issuerNameKey(name: string): string {
  return (
    name
      .toUpperCase()
      // SEC titles carry state-of-incorporation tags: "QUALCOMM INC/DE", "CVS HEALTH CORP /DE/".
      .replace(/\s*\/[A-Z]{2}\/?\s*$/, '')
      .replace(/&/g, ' AND ')
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter((w) => w && !SUFFIXES.has(w))
      .join(' ')
  );
}

export type IssuerIndex = ReadonlyMap<string, string>;

/** name key → ticker. Earlier entries win (SEC lists the primary share class first: GOOGL before GOOG). */
export function buildIssuerIndex(
  companies: readonly { ticker: string; name: string }[],
): IssuerIndex {
  const index = new Map<string, string>();
  for (const c of companies) {
    const key = issuerNameKey(c.name);
    if (key && !index.has(key)) index.set(key, c.ticker);
  }
  return index;
}

/**
 * Fills `constituentTicker` where the filing had none; existing tickers are kept. Only equity
 * lines are matched — a company's bonds share its name but are not exposure to its stock.
 */
export function resolveConstituentTickers<
  T extends { constituentTicker: string | null; name: string; assetBucket?: string | null },
>(constituents: readonly T[], index: IssuerIndex): T[] {
  return constituents.map((c) =>
    c.constituentTicker || (c.assetBucket != null && c.assetBucket !== 'stocks')
      ? c
      : { ...c, constituentTicker: index.get(issuerNameKey(c.name)) ?? null },
  );
}
