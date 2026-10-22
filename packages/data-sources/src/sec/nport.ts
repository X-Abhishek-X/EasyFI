import { XMLParser } from 'fast-xml-parser';
import type { AssetBucket, FundConstituent, IsoDate } from '../types';

export type CusipLookup = Record<string, string> | ((cusip: string) => string | null | undefined);

export interface ParsedNport {
  seriesId: string | null;
  seriesName: string | null;
  asOf: IsoDate;
  constituents: FundConstituent[];
}

const BUCKETS: Record<string, AssetBucket> = {
  EC: 'stocks',
  EP: 'stocks',
  DBT: 'bonds',
  LON: 'bonds',
  SN: 'bonds',
  STIV: 'cash',
  RA: 'cash',
  COMM: 'commodities',
  DCO: 'commodities',
};

/** Map an N-PORT `assetCat` code to an EasyFI asset bucket. */
export function assetBucketFor(assetCat: string | undefined | null): AssetBucket {
  if (!assetCat) return 'other';
  const code = assetCat.trim().toUpperCase();
  if (code.startsWith('ABS-')) return 'bonds';
  return BUCKETS[code] ?? 'other';
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  // Keep CUSIPs like 037833100 as strings.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => name === 'invstOrSec',
});

type Node = Record<string, unknown>;

function str(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (v && typeof v === 'object' && '#text' in v) return str((v as Node)['#text']);
  return null;
}

function attr(node: unknown, name: string): string | null {
  if (!node || typeof node !== 'object') return null;
  const first = Array.isArray(node) ? node[0] : node;
  return str((first as Node)?.[`@_${name}`]);
}

function validCusip(c: string | null): c is string {
  return !!c && /^[0-9A-Z]{9}$/i.test(c) && !/^0{9}$/.test(c);
}

function lookupCusip(lookup: CusipLookup | undefined, cusip: string): string | null {
  if (!lookup) return null;
  const hit = typeof lookup === 'function' ? lookup(cusip) : lookup[cusip];
  return hit ?? null;
}

/** Parse an N-PORT-P primary_doc.xml into fund constituents (weight = pctVal / 100). */
export function parseNport(
  xml: string,
  opts: { fundTicker: string; cusipToTicker?: CusipLookup },
): ParsedNport {
  const doc = parser.parse(xml) as Node;
  const formData = (doc.edgarSubmission as Node | undefined)?.formData as Node | undefined;
  const genInfo = formData?.genInfo as Node | undefined;
  if (!genInfo) throw new Error('Not an N-PORT document: missing formData/genInfo');

  const rows = ((formData?.invstOrSecs as Node | undefined)?.invstOrSec ?? []) as Node[];
  const constituents: FundConstituent[] = [];
  for (const row of rows) {
    const pct = Number(str(row.pctVal));
    if (!Number.isFinite(pct)) continue;
    const cusip = str(row.cusip)?.toUpperCase() ?? null;
    const ids = row.identifiers as Node | undefined;
    const filingTicker = attr(ids?.ticker, 'value');
    const ticker =
      filingTicker?.toUpperCase() ??
      (validCusip(cusip) ? lookupCusip(opts.cusipToTicker, cusip) : null);
    const assetCat = str(row.assetCat) ?? attr(row.assetConditional, 'assetCat');
    constituents.push({
      fundTicker: opts.fundTicker,
      constituentTicker: ticker,
      name: str(row.name) ?? str(row.title) ?? cusip ?? 'Unknown',
      weight: pct / 100,
      assetBucket: assetBucketFor(assetCat),
      sector: null,
      industry: null,
    });
  }

  return {
    seriesId: str(genInfo.seriesId),
    seriesName: str(genInfo.seriesName),
    asOf: str(genInfo.repPdDate) ?? '',
    constituents,
  };
}
