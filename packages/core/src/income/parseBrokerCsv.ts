import type { AccountType } from '../types';
import { parseMoney } from './parseMoney';

export type BrokerCsvFormat = 'generic' | 'fidelity' | 'schwab' | 'vanguard';

export interface ParsedHolding {
  /** Upper-cased symbol; money-market / cash rows become 'CASH'. CUSIP-only lines keep the CUSIP. */
  ticker: string;
  /** Null for cash, CUSIP-only and quantity-less lines (use statementValue). */
  shares: number | null;
  /** Total cost basis for the line. */
  costBasis: number | null;
  /** Market value reported by the broker (fallback when no market price exists). */
  statementValue: number | null;
  accountType: AccountType;
  accountName: string | null;
}

export interface CsvWarning {
  /** 1-based physical line in the input. */
  line: number;
  message: string;
}

export interface ParsedBrokerCsv {
  format: BrokerCsvFormat;
  holdings: ParsedHolding[];
  warnings: CsvWarning[];
}

export interface CsvRow {
  /** 1-based physical line where the row starts. */
  line: number;
  cells: string[];
}

/** RFC-4180-ish tokenizer: quoted fields, "" escapes, embedded commas/newlines, CRLF/CR/LF, BOM. */
export function parseCsvRows(text: string): CsvRow[] {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = '';
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  let i = 0;
  const endRow = () => {
    cells.push(cell);
    rows.push({ line: rowLine, cells });
    cells = [];
    cell = '';
  };
  while (i < s.length) {
    const ch = s[i]!;
    if (inQuotes) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      if (ch === '"') inQuotes = false;
      else {
        if (ch === '\n' || (ch === '\r' && s[i + 1] !== '\n')) line++;
        cell += ch;
      }
      i++;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      cells.push(cell);
      cell = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      endRow();
      line++;
      rowLine = line;
    } else cell += ch;
    i++;
  }
  if (cell !== '' || cells.length > 0) endRow();
  return rows;
}

/** Infers account type from a free-text account name or type label. */
export function inferAccountType(name: string | null | undefined): AccountType {
  if (!name) return 'taxable';
  const n = name.toLowerCase();
  const employer = /\b(401\s*\(?k\)?|403\s*\(?b\)?|457\s*\(?b\)?)/.test(n);
  const roth = /\broth\b/.test(n);
  if (employer) return roth ? 'roth_401k' : '401k';
  if (roth) return 'roth_ira';
  if (/\bira\b|\brollover\b|\bcontributory\b/.test(n)) return 'trad_ira';
  if (/\bhsa\b/.test(n)) return 'other';
  return 'taxable';
}

type Role =
  | 'symbol'
  | 'shares'
  | 'cost'
  | 'value'
  | 'accountName'
  | 'accountNumber'
  | 'description'
  | 'securityType';

const ALIASES: Record<Role, string[]> = {
  symbol: ['symbol', 'ticker', 'tickersymbol', 'securitysymbol', 'symbolcusip'],
  shares: ['quantity', 'qty', 'qtyquantity', 'shares', 'units', 'sharecount'],
  cost: ['costbasistotal', 'costbasis', 'totalcost', 'totalcostbasis', 'cost'],
  value: [
    'currentvalue',
    'marketvalue',
    'mktvalmarketvalue',
    'mktval',
    'totalvalue',
    'value',
    'balance',
  ],
  accountName: ['accountname', 'account', 'accountnickname', 'accounttype'],
  accountNumber: ['accountnumber', 'accountno', 'acctnumber'],
  description: ['description', 'investmentname', 'name', 'securityname', 'securitydescription'],
  securityType: ['securitytype'],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

type ColumnMap = Partial<Record<Role, number>>;

function mapHeader(cells: string[]): ColumnMap | null {
  const map: ColumnMap = {};
  cells.forEach((c, idx) => {
    const n = norm(c);
    for (const role of Object.keys(ALIASES) as Role[]) {
      if (map[role] === undefined && ALIASES[role].includes(n)) map[role] = idx;
    }
  });
  if (map.symbol === undefined || (map.shares === undefined && map.value === undefined))
    return null;
  return map;
}

function detectFormat(header: string[], preamble: CsvRow[]): BrokerCsvFormat {
  const h = new Set(header.map(norm));
  if (preamble.some((r) => /^positions for/i.test(r.cells[0]?.trim() ?? ''))) return 'schwab';
  if (h.has('qtyquantity') || h.has('mktvalmarketvalue')) return 'schwab';
  if (h.has('accountname') && h.has('currentvalue')) return 'fidelity';
  if (h.has('investmentname') && h.has('totalvalue')) return 'vanguard';
  return 'generic';
}

const KNOWN_MMF = new Set([
  'SPAXX',
  'FDRXX',
  'FZFXX',
  'SPRXX',
  'FZDXX',
  'FCASH',
  'CORE',
  'SWVXX',
  'SNVXX',
  'SNSXX',
  'SNOXX',
  'SWTXX',
  'VMFXX',
  'VMRXX',
  'VUSXX',
  'VCTXX',
]);
const NULL_TOKEN = /^(|-{1,3}|n\/?a|none)$/i;
const CUSIP = /^(?=.*\d)[0-9A-Z]{9}$/;

function nonEmpty(cells: string[]): string[] {
  return cells.map((c) => c.trim()).filter((c) => c !== '');
}

function sectionTitleAccount(text: string): string | null {
  const m = /^positions for account (.+?) as of\b/i.exec(text);
  if (m) return m[1]!.trim();
  if (/^positions for/i.test(text)) return null;
  return text;
}

/**
 * Parses a broker positions export into holdings. Pure; never throws on bad rows — they are
 * reported in `warnings`. Totals, pending activity and transaction sections are skipped;
 * money-market / cash rows become ticker 'CASH' with statementValue = value.
 */
export function parseBrokerCsv(
  text: string,
  format: 'auto' | BrokerCsvFormat = 'auto',
): ParsedBrokerCsv {
  const rows = parseCsvRows(text);
  const warnings: CsvWarning[] = [];
  const holdings: ParsedHolding[] = [];

  const headerIdx = rows.findIndex((r) => mapHeader(r.cells) !== null);
  if (headerIdx === -1) {
    warnings.push({ line: 1, message: 'Could not find a header row with a symbol/ticker column.' });
    return { format: format === 'auto' ? 'generic' : format, holdings, warnings };
  }
  const preamble = rows.slice(0, headerIdx);
  const used: BrokerCsvFormat =
    format === 'auto' ? detectFormat(rows[headerIdx]!.cells, preamble) : format;

  let section: string | null = null;
  const onTitle = (cell: string) => {
    if (used !== 'schwab') return; // other brokers' single-cell lines are disclaimers/notes
    const name = sectionTitleAccount(cell);
    if (name !== null) section = name;
  };
  for (const r of preamble) {
    const ne = nonEmpty(r.cells);
    if (ne.length === 1 && r.cells[0]?.trim()) onTitle(ne[0]!);
  }

  let cols = mapHeader(rows[headerIdx]!.cells)!;
  for (const row of rows.slice(headerIdx + 1)) {
    const ne = nonEmpty(row.cells);
    if (ne.length === 0) continue;
    const normed = row.cells.map(norm);
    if (normed.includes('tradedate') || normed.includes('transactiontype')) break; // Vanguard transactions
    const header = mapHeader(row.cells);
    if (header) {
      cols = header;
      continue;
    }
    // Single-cell lines are section titles (Schwab) or disclaimers — except a lone symbol in a
    // generic file, which falls through and is reported as missing quantity/value.
    if (ne.length === 1 && row.cells[0]?.trim() && (used !== 'generic' || cols.symbol !== 0)) {
      onTitle(ne[0]!);
      continue;
    }

    const get = (role: Role): string =>
      cols[role] === undefined ? '' : (row.cells[cols[role]!] ?? '').trim();
    const rawSymbol = get('symbol');
    const sharesRaw = get('shares');
    const value = parseMoney(get('value'));
    const cost = parseMoney(get('cost'));
    const lower = norm(rawSymbol);
    const shares = parseMoney(sharesRaw);

    if (lower === 'accounttotal' || lower.startsWith('total') || lower === 'grandtotal') continue;
    if (lower === 'pendingactivity') {
      warnings.push({
        line: row.line,
        message: `Pending activity${value !== null ? ` of ${value.toFixed(2)}` : ''} was not imported.`,
      });
      continue;
    }
    if (!rawSymbol) {
      if (shares !== null || value !== null) {
        warnings.push({ line: row.line, message: 'Row has no symbol/ticker; skipped.' });
      }
      continue;
    }

    const accountName =
      (cols.accountName !== undefined ? get('accountName') || null : null) ??
      (cols.accountNumber !== undefined ? get('accountNumber') || null : null) ??
      section;
    const accountType = inferAccountType(accountName);
    const ticker = rawSymbol.toUpperCase().replace(/\*+$/, '').replace(/\//g, '.').trim();
    const description = `${get('description')} ${get('securityType')}`;

    const isCash =
      rawSymbol.endsWith('**') ||
      KNOWN_MMF.has(ticker) ||
      /^cash\b/i.test(rawSymbol) ||
      /money market/i.test(description);
    if (isCash) {
      if (value === null) {
        warnings.push({
          line: row.line,
          message: `Cash row "${rawSymbol}" has no value; skipped.`,
        });
        continue;
      }
      holdings.push({
        ticker: 'CASH',
        shares: null,
        costBasis: null,
        statementValue: value,
        accountType,
        accountName,
      });
      continue;
    }

    if (shares === null && !NULL_TOKEN.test(sharesRaw)) {
      warnings.push({
        line: row.line,
        message: `Could not parse quantity "${sharesRaw}" for ${ticker}; skipped.`,
      });
      continue;
    }
    if (shares === null && value === null) {
      warnings.push({ line: row.line, message: `${ticker} has no quantity or value; skipped.` });
      continue;
    }
    if (shares !== null && shares < 0) {
      warnings.push({
        line: row.line,
        message: `${ticker} has a negative quantity (short position).`,
      });
    }
    const cusipOnly = CUSIP.test(ticker);
    holdings.push({
      ticker,
      shares: cusipOnly ? null : shares,
      costBasis: cost,
      statementValue: value,
      accountType,
      accountName,
    });
  }

  return { format: used, holdings, warnings };
}
