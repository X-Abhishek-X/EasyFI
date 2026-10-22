/** Shapes are structurally compatible with @easyfi/core domain types. */

export type IsoDate = string; // 'YYYY-MM-DD'

export interface PricePoint {
  ticker: string;
  date: IsoDate;
  close: number;
}

export interface DividendEvent {
  ticker: string;
  exDate: IsoDate;
  payDate: IsoDate | null;
  amount: number;
}

export type AssetBucket = 'stocks' | 'bonds' | 'cash' | 'commodities' | 'crypto' | 'other';

export interface FundConstituent {
  fundTicker: string;
  constituentTicker: string | null;
  name: string;
  /** Fraction of fund NAV (0.05 = 5%). */
  weight: number;
  assetBucket: AssetBucket;
  sector: string | null;
  industry: string | null;
}

export interface CpiPoint {
  seriesId: string;
  period: string; // 'YYYY-MM'
  value: number;
}

export type SecurityType = 'stock' | 'etf' | 'mutual_fund' | 'mmf' | 'crypto' | 'bond' | 'other';

export interface Security {
  ticker: string;
  name: string;
  type: SecurityType;
  sector: string | null;
  industry: string | null;
  expenseRatio: number | null;
}

export interface LatestQuote {
  close: number;
  date: IsoDate;
  prevClose?: number;
}

export interface PriceSource {
  eodHistory(ticker: string, from: IsoDate, to: IsoDate): Promise<PricePoint[]>;
  latest(tickers: string[]): Promise<Record<string, LatestQuote>>;
  meta(ticker: string): Promise<Partial<Security> | null>;
}

export interface DividendSource {
  dividends(ticker: string, from: IsoDate): Promise<DividendEvent[]>;
}

export interface FundHoldings {
  asOf: IsoDate;
  constituents: FundConstituent[];
}

export interface HoldingsSource {
  latestHoldings(fundTicker: string): Promise<FundHoldings | null>;
}

export interface CpiSource {
  series(seriesIds: string[], startYear: number, endYear: number): Promise<CpiPoint[]>;
}

// ---- LLM (OpenAI-compatible shapes) ----

export interface ToolCall {
  id: string;
  name: string;
  /** JSON-encoded arguments string, as returned by OpenAI-compatible APIs. */
  arguments: string;
}

export type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; toolCalls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string; name?: string };

export type AssistantMessage = Extract<ChatMessage, { role: 'assistant' }>;

export interface ToolDef {
  name: string;
  description: string;
  /** JSON Schema for the arguments object. */
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolDef[];
  temperature?: number;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  message: AssistantMessage;
  usage?: ChatUsage;
}

export interface LLMProvider {
  chat(req: ChatRequest): Promise<ChatResponse>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type SleepFn = (ms: number) => Promise<void>;
