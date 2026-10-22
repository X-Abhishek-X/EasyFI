import { describe, expect, it } from 'vitest';
import { FakeCpiSource } from './cpi';
import { FakeDividendSource } from './dividends';
import { FakeHoldingsSource } from './holdings';
import { FakeLLMProvider } from './llm';
import { FakePriceSource } from './prices';

describe('FakePriceSource', () => {
  const src = new FakePriceSource({
    prices: [
      { ticker: 'VOO', date: '2026-10-20', close: 600 },
      { ticker: 'VOO', date: '2026-10-21', close: 610 },
      { ticker: 'VOO', date: '2026-10-19', close: 590 },
      { ticker: 'QQQ', date: '2026-10-21', close: 500 },
    ],
    meta: { VOO: { name: 'Vanguard S&P 500 ETF', type: 'etf' } },
  });

  it('returns sorted history within the range', async () => {
    expect((await src.eodHistory('VOO', '2026-10-20', '2026-10-21')).map((p) => p.close)).toEqual([
      600, 610,
    ]);
  });

  it('latest returns last close and previous close; omits unknown tickers', async () => {
    expect(await src.latest(['VOO', 'QQQ', 'NOPE'])).toEqual({
      VOO: { close: 610, date: '2026-10-21', prevClose: 600 },
      QQQ: { close: 500, date: '2026-10-21' },
    });
  });

  it('meta returns configured metadata or null', async () => {
    expect(await src.meta('VOO')).toEqual({
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      type: 'etf',
    });
    expect(await src.meta('QQQ')).toBeNull();
  });
});

describe('FakeDividendSource', () => {
  it('filters by ticker and from date', async () => {
    const src = new FakeDividendSource([
      { ticker: 'SCHD', exDate: '2026-03-25', payDate: '2026-03-30', amount: 0.25 },
      { ticker: 'SCHD', exDate: '2026-06-25', payDate: '2026-06-30', amount: 0.26 },
      { ticker: 'VOO', exDate: '2026-06-27', payDate: null, amount: 1.7 },
    ]);
    expect((await src.dividends('SCHD', '2026-04-01')).map((d) => d.amount)).toEqual([0.26]);
  });
});

describe('FakeHoldingsSource', () => {
  it('returns holdings by fund ticker (case-insensitive) or null', async () => {
    const holdings = {
      asOf: '2026-06-30',
      constituents: [
        {
          fundTicker: 'VOO',
          constituentTicker: 'AAPL',
          name: 'Apple',
          weight: 0.07,
          assetBucket: 'stocks' as const,
          sector: 'Technology',
          industry: null,
        },
      ],
    };
    const src = new FakeHoldingsSource({ VOO: holdings });
    expect(await src.latestHoldings('voo')).toEqual(holdings);
    expect(await src.latestHoldings('QQQ')).toBeNull();
    const fromMap = new FakeHoldingsSource(new Map([['VOO', holdings]]));
    expect(await fromMap.latestHoldings('VOO')).toEqual(holdings);
  });
});

describe('FakeCpiSource', () => {
  it('filters by series and year range', async () => {
    const src = new FakeCpiSource([
      { seriesId: 'A', period: '2024-12', value: 1 },
      { seriesId: 'A', period: '2025-01', value: 2 },
      { seriesId: 'B', period: '2025-01', value: 3 },
    ]);
    expect(await src.series(['A'], 2025, 2026)).toEqual([
      { seriesId: 'A', period: '2025-01', value: 2 },
    ]);
  });
});

describe('FakeLLMProvider', () => {
  it('replays a scripted list and records requests', async () => {
    const llm = new FakeLLMProvider([
      {
        role: 'assistant',
        content: null,
        toolCalls: [{ id: '1', name: 'get_dividends', arguments: '{}' }],
      },
      {
        message: { role: 'assistant', content: 'done' },
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      },
    ]);
    const r1 = await llm.chat({ messages: [{ role: 'user', content: 'divs?' }] });
    expect(r1.message.toolCalls?.[0]?.name).toBe('get_dividends');
    const r2 = await llm.chat({ messages: [{ role: 'user', content: 'divs?' }] });
    expect(r2.message.content).toBe('done');
    expect(r2.usage?.totalTokens).toBe(2);
    expect(llm.calls).toHaveLength(2);
    await expect(llm.chat({ messages: [] })).rejects.toThrow(/script exhausted/);
  });

  it('accepts a function script', async () => {
    const llm = new FakeLLMProvider((req, i) => ({
      role: 'assistant',
      content: `${i}:${req.messages.length}`,
    }));
    expect((await llm.chat({ messages: [{ role: 'user', content: 'x' }] })).message.content).toBe(
      '0:1',
    );
  });

  it('snapshots requests so later mutation does not change records', async () => {
    const llm = new FakeLLMProvider(() => ({ role: 'assistant', content: 'ok' }));
    const messages = [{ role: 'user' as const, content: 'a' }];
    await llm.chat({ messages });
    messages.push({ role: 'user', content: 'b' });
    expect(llm.calls[0]!.messages).toHaveLength(1);
  });
});
