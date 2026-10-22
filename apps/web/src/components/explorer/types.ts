/** Structured blocks an Explorer answer can carry. Weights are fractions 0–1. */
export type TableBlock = {
  type: 'table';
  title: string;
  /** e.g. "126 shared of 574 constituents". */
  subtitle?: string;
  asOf: string | null;
  /** One column per fund, in display order. */
  columns: { key: string; label: string }[];
  rows: {
    ticker: string;
    name?: string;
    /** Weight per column key; null/absent = not held ("—"). */
    values: Record<string, number | null>;
    total: number | null;
  }[];
};

export type SectorShiftBlock = {
  type: 'sector_shift';
  title: string;
  subtitle?: string;
  asOf: string | null;
  rows: { sector: string; before: number; after: number }[];
};

export type ChatBlock = TableBlock | SectorShiftBlock;

export type UserMessage = { id: string; role: 'user'; text: string };
export type AssistantMessage = { id: string; role: 'assistant'; text: string; blocks: ChatBlock[] };
export type ChatMessage = UserMessage | AssistantMessage;
