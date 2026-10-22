import { fetchWithRetry, HttpError } from './http';
import type {
  AssistantMessage,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  FetchLike,
  LLMProvider,
  SleepFn,
  ToolCall,
} from './types';

const URL_CHAT = 'https://openrouter.ai/api/v1/chat/completions';

export type LLMErrorKind = 'auth' | 'rate_limited' | 'upstream' | 'bad_response' | 'network';

export class LLMError extends Error {
  override readonly name = 'LLMError';
  constructor(
    readonly kind: LLMErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface OpenRouterOptions {
  apiKey: string;
  model: string;
  /** Sent as HTTP-Referer (OpenRouter app attribution). */
  referer?: string;
  fetch?: FetchLike;
  sleep?: SleepFn;
  retries?: number;
}

interface OaiToolCall {
  id: string;
  type?: 'function';
  function: { name: string; arguments: string };
}

interface OaiResponse {
  choices?: { message?: { content?: string | null; tool_calls?: OaiToolCall[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { code?: number | string; message?: string };
}

function toOai(m: ChatMessage): Record<string, unknown> {
  if (m.role === 'assistant') {
    const out: Record<string, unknown> = { role: 'assistant', content: m.content };
    if (m.toolCalls?.length) {
      out.tool_calls = m.toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      }));
    }
    return out;
  }
  if (m.role === 'tool') {
    const out: Record<string, unknown> = {
      role: 'tool',
      tool_call_id: m.tool_call_id,
      content: m.content,
    };
    if (m.name) out.name = m.name;
    return out;
  }
  return { role: m.role, content: m.content };
}

function kindForStatus(status: number): LLMErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limited';
  return 'upstream';
}

export class OpenRouterProvider implements LLMProvider {
  private readonly fetch: FetchLike;

  constructor(private readonly opts: OpenRouterOptions) {
    this.fetch = opts.fetch ?? ((url, init) => globalThis.fetch(url, init));
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
      model: this.opts.model,
      messages: req.messages.map(toOai),
    };
    if (req.tools?.length) {
      body.tools = req.tools.map((t) => ({ type: 'function', function: t }));
    }
    if (req.temperature !== undefined) body.temperature = req.temperature;

    let res: Response;
    try {
      res = await fetchWithRetry(
        this.fetch,
        URL_CHAT,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.opts.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.opts.referer ?? 'https://easyfi.app',
            'X-Title': 'EasyFI',
          },
          body: JSON.stringify(body),
        },
        {
          retries: this.opts.retries ?? 2,
          ...(this.opts.sleep ? { sleep: this.opts.sleep } : {}),
        },
      );
    } catch (err) {
      if (err instanceof HttpError) {
        throw new LLMError(
          kindForStatus(err.status),
          `OpenRouter HTTP ${err.status}: ${err.body.slice(0, 300)}`,
          err.status,
        );
      }
      throw new LLMError('network', `OpenRouter request failed: ${(err as Error).message}`);
    }

    let json: OaiResponse;
    try {
      json = (await res.json()) as OaiResponse;
    } catch {
      throw new LLMError('bad_response', 'OpenRouter returned non-JSON body', res.status);
    }
    if (json.error) {
      const code = typeof json.error.code === 'number' ? json.error.code : undefined;
      throw new LLMError(
        code ? kindForStatus(code) : 'upstream',
        `OpenRouter error: ${json.error.message ?? 'unknown'}`,
        code,
      );
    }
    const msg = json.choices?.[0]?.message;
    if (!msg) throw new LLMError('bad_response', 'OpenRouter response had no choices');

    const toolCalls: ToolCall[] = (msg.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments || '{}',
    }));
    const message: AssistantMessage = {
      role: 'assistant',
      content: msg.content ? msg.content : null,
    };
    if (toolCalls.length) message.toolCalls = toolCalls;

    const out: ChatResponse = { message };
    if (json.usage) {
      out.usage = {
        promptTokens: json.usage.prompt_tokens ?? 0,
        completionTokens: json.usage.completion_tokens ?? 0,
        totalTokens: json.usage.total_tokens ?? 0,
      };
    }
    return out;
  }
}
