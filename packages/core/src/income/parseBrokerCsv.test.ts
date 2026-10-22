import { describe, expect, it } from 'vitest';
import fidelity from './__fixtures__/fidelity.csv?raw';
import generic from './__fixtures__/generic.csv?raw';
import schwabAll from './__fixtures__/schwab-all-accounts.csv?raw';
import schwab from './__fixtures__/schwab.csv?raw';
import vanguard from './__fixtures__/vanguard.csv?raw';
import { inferAccountType, parseBrokerCsv, parseCsvRows } from './parseBrokerCsv';

describe('parseCsvRows', () => {
  it('handles quotes, escaped quotes, embedded commas/newlines, CRLF and BOM', () => {
    const rows = parseCsvRows('﻿a,"b, c","say ""hi"""\r\n"multi\nline",x\r\n\r\nlast');
    expect(rows).toEqual([
      { line: 1, cells: ['a', 'b, c', 'say "hi"'] },
      { line: 2, cells: ['multi\nline', 'x'] },
      { line: 4, cells: [''] },
      { line: 5, cells: ['last'] },
    ]);
  });
});

describe('inferAccountType', () => {
  it.each([
    ['Roth Contributory IRA ...123', 'roth_ira'],
    ['ROTH IRA', 'roth_ira'],
    ['ROLLOVER IRA', 'trad_ira'],
    ['Traditional IRA', 'trad_ira'],
    ['SEP-IRA', 'trad_ira'],
    ['EXAMPLE CORP 401(K) PLAN', '401k'],
    ['My 401k', '401k'],
    ['BROKERAGELINK ROTH 401K', 'roth_401k'],
    ['Roth 401(k)', 'roth_401k'],
    ['Individual', 'taxable'],
    ['Individual - TOD', 'taxable'],
    [null, 'taxable'],
  ] as const)('%s → %s', (name, type) => {
    expect(inferAccountType(name)).toBe(type);
  });
});

describe('parseBrokerCsv', () => {
  it('parses a Fidelity positions export', () => {
    const r = parseBrokerCsv(fidelity, 'auto');
    expect(r.format).toBe('fidelity');
    expect(r.holdings).toEqual([
      {
        ticker: 'CASH',
        shares: null,
        costBasis: null,
        statementValue: 1523.4,
        accountType: 'taxable',
        accountName: 'Individual',
      },
      {
        ticker: 'FXAIX',
        shares: 120.5,
        costBasis: 20000,
        statementValue: 25943.65,
        accountType: 'taxable',
        accountName: 'Individual',
      },
      {
        ticker: 'AAPL',
        shares: 10,
        costBasis: 1500,
        statementValue: 2301,
        accountType: 'taxable',
        accountName: 'Individual',
      },
      {
        ticker: 'VTI',
        shares: 50,
        costBasis: 12500,
        statementValue: 14500,
        accountType: 'roth_ira',
        accountName: 'ROTH IRA',
      },
      {
        ticker: '912797XX1',
        shares: null,
        costBasis: 4875,
        statementValue: 4937.5,
        accountType: 'roth_ira',
        accountName: 'ROTH IRA',
      },
      {
        ticker: 'CASH',
        shares: null,
        costBasis: null,
        statementValue: 1270,
        accountType: 'trad_ira',
        accountName: 'ROLLOVER IRA',
      },
      {
        ticker: 'FCNTX',
        shares: null,
        costBasis: null,
        statementValue: 10000,
        accountType: '401k',
        accountName: 'EXAMPLE CORP 401(K) PLAN',
      },
      {
        ticker: 'QQQ',
        shares: 3,
        costBasis: 1500,
        statementValue: 1440,
        accountType: 'roth_401k',
        accountName: 'BROKERAGELINK ROTH 401K',
      },
    ]);
    expect(r.warnings).toEqual([{ line: 5, message: expect.stringContaining('Pending activity') }]);
  });

  it('parses a Schwab single-account export with a title preamble', () => {
    const r = parseBrokerCsv(schwab, 'auto');
    expect(r.format).toBe('schwab');
    const acct = { accountType: 'roth_ira', accountName: 'Roth Contributory IRA ...123' };
    expect(r.holdings).toEqual([
      { ticker: 'SCHD', shares: 200, costBasis: 5000, statementValue: 5600, ...acct },
      { ticker: 'BRK.B', shares: 5, costBasis: 2500, statementValue: 2350, ...acct },
      { ticker: 'CASH', shares: null, costBasis: null, statementValue: 1000, ...acct },
      { ticker: 'CASH', shares: null, costBasis: null, statementValue: 512.34, ...acct },
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('parses a Schwab all-accounts export with per-account sections', () => {
    const r = parseBrokerCsv(schwabAll, 'schwab');
    expect(r.format).toBe('schwab');
    expect(r.holdings.map((h) => [h.ticker, h.accountName, h.accountType])).toEqual([
      ['VOO', 'Individual ...456', 'taxable'],
      ['CASH', 'Individual ...456', 'taxable'],
      ['BND', 'Rollover IRA ...789', 'trad_ira'],
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('parses a Vanguard export and stops at the transactions section', () => {
    const r = parseBrokerCsv(vanguard, 'auto');
    expect(r.format).toBe('vanguard');
    expect(r.holdings).toEqual([
      {
        ticker: 'CASH',
        shares: null,
        costBasis: null,
        statementValue: 1200.5,
        accountType: 'taxable',
        accountName: '11112222',
      },
      {
        ticker: 'VTSAX',
        shares: 85.123,
        costBasis: null,
        statementValue: 11508.63,
        accountType: 'taxable',
        accountName: '11112222',
      },
      {
        ticker: 'VTIAX',
        shares: 40,
        costBasis: null,
        statementValue: 1420,
        accountType: 'taxable',
        accountName: '11112222',
      },
      {
        ticker: 'VFFVX',
        shares: 100,
        costBasis: null,
        statementValue: 5510,
        accountType: 'taxable',
        accountName: '33334444',
      },
    ]);
    expect(r.warnings).toEqual([]);
  });

  it('parses a generic CSV and reports bad lines', () => {
    const r = parseBrokerCsv(generic, 'auto');
    expect(r.format).toBe('generic');
    expect(r.holdings).toEqual([
      {
        ticker: 'VOO',
        shares: 10,
        costBasis: 4000,
        statementValue: null,
        accountType: 'roth_ira',
        accountName: 'Roth IRA',
      },
      {
        ticker: 'MSFT',
        shares: 5,
        costBasis: null,
        statementValue: null,
        accountType: '401k',
        accountName: 'My 401k',
      },
      {
        ticker: 'BND',
        shares: 20,
        costBasis: null,
        statementValue: null,
        accountType: 'taxable',
        accountName: 'Brokerage',
      },
    ]);
    expect(r.warnings.map((w) => w.line)).toEqual([5, 6]);
    expect(r.warnings[1]!.message).toContain('abc');
  });

  it('handles a BOM, alternate headers, parentheses negatives and a preamble line', () => {
    const csv = '﻿My holdings export\r\nSymbol,Quantity,Market Value\r\nIBM,"1,000",(5.00)\r\n';
    const r = parseBrokerCsv(csv, 'generic');
    expect(r.holdings).toEqual([
      {
        ticker: 'IBM',
        shares: 1000,
        costBasis: null,
        statementValue: -5,
        accountType: 'taxable',
        accountName: null,
      },
    ]);
  });

  it('warns when no header row is found', () => {
    const r = parseBrokerCsv('hello,world\n1,2\n', 'auto');
    expect(r.holdings).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(r.format).toBe('generic');
  });
});
