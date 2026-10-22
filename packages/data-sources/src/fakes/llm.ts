import type { AssistantMessage, ChatRequest, ChatResponse, LLMProvider } from '../types';

export type FakeLLMStep = ChatResponse | AssistantMessage;
export type FakeLLMScript = FakeLLMStep[] | ((req: ChatRequest, callIndex: number) => FakeLLMStep);

function toResponse(step: FakeLLMStep): ChatResponse {
  return 'message' in step ? step : { message: step };
}

/** Scripted LLMProvider for tests. Records every request in `calls`. */
export class FakeLLMProvider implements LLMProvider {
  readonly calls: ChatRequest[] = [];

  constructor(private readonly script: FakeLLMScript) {}

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const i = this.calls.length;
    this.calls.push(structuredClone(req));
    if (typeof this.script === 'function') return toResponse(this.script(req, i));
    const step = this.script[i];
    if (!step) throw new Error(`FakeLLMProvider: script exhausted at call #${i + 1}`);
    return toResponse(structuredClone(step));
  }
}
