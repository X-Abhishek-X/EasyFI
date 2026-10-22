import { describe, expect, it } from 'vitest';
import toolCall from './__fixtures__/openrouter/tool-call.json';
import text from './__fixtures__/openrouter/text.json';
import { LLMError, OpenRouterProvider } from './openrouter';
import { fakeFetch, jsonResponse, textResponse } from './testing';
import type { ToolDef } from './types';

const noSleep = async () => {};
const tools: ToolDef[] = [
  {
    name: 'compare_funds',
    description: 'Compare funds',
    parameters: {
      type: 'object',
      properties: { tickers: { type: 'array', items: { type: 'string' } } },
    },
  },
];

const make = (fetch: ReturnType<typeof fakeFetch>) =>
  new OpenRouterProvider({
    apiKey: 'sk-or-secret',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    referer: 'https://easyfi.example',
    fetch,
    sleep: noSleep,
  });

describe('OpenRouterProvider', () => {
  it('sends an OpenAI-compatible request with headers, tools and history', async () => {
    const fetch = fakeFetch(() => jsonResponse(text));
    await make(fetch).chat({
      temperature: 0.2,
      tools,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'Compare VOO and SCHD' },
        {
          role: 'assistant',
          content: null,
          toolCalls: [
            { id: 'call_1', name: 'compare_funds', arguments: '{"tickers":["VOO","SCHD"]}' },
          ],
        },
        { role: 'tool', tool_call_id: 'call_1', content: '{"overlap":0.14}' },
      ],
    });
    const call = fetch.calls[0]!;
    expect(call.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(call.init?.method).toBe('POST');
    const h = new Headers(call.init?.headers);
    expect(h.get('Authorization')).toBe('Bearer sk-or-secret');
    expect(h.get('HTTP-Referer')).toBe('https://easyfi.example');
    expect(h.get('X-Title')).toBe('EasyFI');
    const body = JSON.parse(call.init!.body as string);
    expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
    expect(body.temperature).toBe(0.2);
    expect(body.tools).toEqual([{ type: 'function', function: tools[0] }]);
    expect(body.messages[2]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_1',
          type: 'function',
          function: { name: 'compare_funds', arguments: '{"tickers":["VOO","SCHD"]}' },
        },
      ],
    });
    expect(body.messages[3]).toEqual({
      role: 'tool',
      tool_call_id: 'call_1',
      content: '{"overlap":0.14}',
    });
  });

  it('parses tool calls and usage', async () => {
    const res = await make(fakeFetch(() => jsonResponse(toolCall))).chat({
      messages: [{ role: 'user', content: 'hi' }],
      tools,
    });
    expect(res.message).toEqual({
      role: 'assistant',
      content: null,
      toolCalls: [
        { id: 'call_abc123', name: 'compare_funds', arguments: '{"tickers":["VOO","SCHD"]}' },
      ],
    });
    expect(res.usage).toEqual({ promptTokens: 512, completionTokens: 24, totalTokens: 536 });
  });

  it('parses plain text answers', async () => {
    const res = await make(fakeFetch(() => jsonResponse(text))).chat({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(res.message.content).toContain('overlap');
    expect(res.message.toolCalls).toBeUndefined();
  });

  it('maps 401 to an auth LLMError without leaking the key', async () => {
    const err = await make(fakeFetch(() => textResponse('{"error":{"message":"No auth"}}', 401)))
      .chat({ messages: [{ role: 'user', content: 'hi' }] })
      .catch((e) => e);
    expect(err).toBeInstanceOf(LLMError);
    expect(err).toMatchObject({ kind: 'auth', status: 401 });
    expect((err as Error).message).not.toContain('sk-or-secret');
  });

  it('maps persistent 429 to rate_limited', async () => {
    const err = await make(fakeFetch(() => textResponse('slow', 429)))
      .chat({ messages: [{ role: 'user', content: 'hi' }] })
      .catch((e) => e);
    expect(err).toMatchObject({ name: 'LLMError', kind: 'rate_limited', status: 429 });
  });

  it('maps an in-body error object (HTTP 200) to an upstream LLMError', async () => {
    const err = await make(
      fakeFetch(() => jsonResponse({ error: { code: 502, message: 'Provider returned error' } })),
    )
      .chat({ messages: [{ role: 'user', content: 'hi' }] })
      .catch((e) => e);
    expect(err).toMatchObject({ kind: 'upstream' });
    expect((err as Error).message).toContain('Provider returned error');
  });

  it('maps responses without choices to bad_response', async () => {
    const err = await make(fakeFetch(() => jsonResponse({ id: 'x', choices: [] })))
      .chat({ messages: [{ role: 'user', content: 'hi' }] })
      .catch((e) => e);
    expect(err).toMatchObject({ kind: 'bad_response' });
  });

  it('maps network failures to network errors', async () => {
    const fetch = fakeFetch(() => {
      throw new TypeError('fetch failed');
    });
    const err = await make(fetch)
      .chat({ messages: [{ role: 'user', content: 'hi' }] })
      .catch((e) => e);
    expect(err).toMatchObject({ kind: 'network' });
  });
});
