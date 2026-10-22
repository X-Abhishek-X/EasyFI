'use client';

import { Search } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Select, TextInput, inputClass } from '@/components/ui/Field';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { cn } from '@/lib/cn';
import { Overlay } from './Overlay';
import {
  ACCOUNT_TYPE_LABEL,
  type AccountType,
  type AddHoldingInput,
  HOLDING_TYPE_LABEL,
  type TickerSuggestion,
} from './types';

export type AddHoldingPanelProps = {
  open: boolean;
  onClose: () => void;
  /** Ticker lookup results (mock list until GET /api/v1/securities?q= exists). */
  suggestions: TickerSuggestion[];
  /** Persist the new line. Not wired yet. */
  action?: (data: AddHoldingInput) => void | Promise<void>;
};

/** Parses paste-friendly numbers: "$1,234.50" → 1234.5. Empty → null. */
function parseAmount(s: string): number | null {
  const n = Number(s.replace(/[$,\s]/g, ''));
  return s.trim() === '' || !Number.isFinite(n) ? null : n;
}

const EMPTY = { ticker: '', amount: '', cost: '', tags: '' };

/** Side drawer to add one holding (ticker search, account, shares/dollars, cost basis, tags). */
export function AddHoldingPanel({ open, onClose, suggestions, action }: AddHoldingPanelProps) {
  const tickerRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [account, setAccount] = useState<AccountType>('taxable');
  const [mode, setMode] = useState<'shares' | 'dollars'>('shares');
  const [showList, setShowList] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const q = form.ticker.trim().toLowerCase();
  const matches = q
    ? suggestions
        .filter((s) => s.ticker.toLowerCase().startsWith(q) || s.name.toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  const submit = async (another: boolean, e?: FormEvent) => {
    e?.preventDefault();
    if (!form.ticker.trim()) {
      tickerRef.current?.focus();
      return;
    }
    await action?.({
      ticker: form.ticker.trim().toUpperCase(),
      accountType: account,
      mode,
      amount: parseAmount(form.amount),
      costBasis: parseAmount(form.cost),
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });
    if (another) {
      setAdded(form.ticker.trim().toUpperCase());
      setForm(EMPTY);
      tickerRef.current?.focus();
    } else {
      setForm(EMPTY);
      setAdded(null);
      onClose();
    }
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Add holding"
      description="Search by ticker, CUSIP or name. Unpriced assets can be added by statement value."
      initialFocus={tickerRef}
      footer={
        <>
          <Button variant="ghost" onClick={() => void submit(true)}>
            Add and add another
          </Button>
          <Button variant="primary" type="submit" form="add-holding-form">
            Add
          </Button>
        </>
      }
    >
      <form id="add-holding-form" onSubmit={(e) => void submit(false, e)} className="space-y-5">
        {added ? (
          <p role="status" className="rounded-lg bg-brand/10 px-3 py-2 text-[13px] text-brand">
            Added {added}. Enter the next holding.
          </p>
        ) : null}
        <div className="relative">
          <Field label="Ticker">
            <span className="relative block">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
              />
              <input
                ref={tickerRef}
                role="combobox"
                aria-expanded={showList && matches.length > 0}
                aria-controls="ticker-results"
                aria-autocomplete="list"
                autoComplete="off"
                value={form.ticker}
                onChange={(e) => {
                  setForm({ ...form, ticker: e.target.value });
                  setShowList(true);
                }}
                onBlur={() => setTimeout(() => setShowList(false), 120)}
                placeholder="e.g. VTI or Vanguard Total"
                className={cn(
                  inputClass,
                  'pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case',
                )}
              />
            </span>
          </Field>
          {showList && matches.length > 0 ? (
            <ul
              id="ticker-results"
              role="listbox"
              className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-[10px] border border-line-strong bg-surface-2 py-1 shadow-xl"
            >
              {matches.map((m) => (
                <li key={m.ticker} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setForm({ ...form, ticker: m.ticker });
                      setShowList(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] hover:bg-surface-3"
                  >
                    <span className="w-14 font-mono font-bold text-fg">{m.ticker}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{m.name}</span>
                    <span className="text-[11px] text-faint">{HOLDING_TYPE_LABEL[m.type]}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Field label="Account type">
          <Select value={account} onChange={(e) => setAccount(e.target.value as AccountType)}>
            {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((a) => (
              <option key={a} value={a}>
                {ACCOUNT_TYPE_LABEL[a]}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-muted">Enter amount as</span>
          <SegmentedTabs
            label="Amount mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'shares', label: 'Shares' },
              { value: 'dollars', label: 'Dollars' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={mode === 'shares' ? 'Shares' : 'Amount ($)'}>
            <TextInput
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder={mode === 'shares' ? '12.5' : '$1,250.00'}
            />
          </Field>
          <Field label="Cost basis ($)" hint="Optional, total paid">
            <TextInput
              inputMode="decimal"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="$1,100.00"
            />
          </Field>
        </div>

        <Field label="Tags" hint="Comma separated, e.g. growth, core">
          <TextInput
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="growth, core"
          />
        </Field>
      </form>
    </Overlay>
  );
}
