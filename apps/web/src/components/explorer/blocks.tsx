'use client';

import { type ReactNode, useState } from 'react';
import { AsOf } from '@/components/ui/AsOf';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/cn';
import { formatPercent, trendClass } from '@/lib/format';
import type { ChatBlock, SectorShiftBlock, TableBlock } from './types';

function BlockFrame({
  title,
  subtitle,
  asOf,
  children,
}: {
  title: string;
  subtitle?: string;
  asOf: string | null;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5">
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      <AsOf date={asOf} prefix="As of" className="mt-0.5 block" />
      {children}
    </section>
  );
}

export function TableBlockView({ block }: { block: TableBlock }) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? block.rows.filter(
        (r) =>
          r.ticker.toLowerCase().includes(needle) || (r.name ?? '').toLowerCase().includes(needle),
      )
    : block.rows;
  return (
    <BlockFrame title={block.title} subtitle={block.subtitle} asOf={block.asOf}>
      <SearchInput
        size="sm"
        className="mt-4 max-w-[260px]"
        label={`Filter ${block.title}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="scroll-x mt-4">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="border-b border-line-strong text-[12px] text-faint">
              <th scope="col" className="pb-2.5 text-left font-normal">
                Ticker
              </th>
              {block.columns.map((c) => (
                <th key={c.key} scope="col" className="pb-2.5 text-right font-normal">
                  {c.label}
                </th>
              ))}
              <th scope="col" className="pb-2.5 text-right font-normal">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker} className="border-b border-line/60 last:border-0">
                <th scope="row" className="py-2.5 text-left font-normal" title={r.name}>
                  <span className="font-mono font-bold text-fg">{r.ticker}</span>
                </th>
                {block.columns.map((c) => {
                  const v = r.values[c.key] ?? null;
                  return (
                    <td
                      key={c.key}
                      className={cn('py-2.5 text-right', v == null ? 'text-faint' : 'text-fg')}
                    >
                      {formatPercent(v, { digits: 2 })}
                    </td>
                  );
                })}
                <td className="py-2.5 text-right font-semibold text-fg">
                  {formatPercent(r.total, { digits: 2 })}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={block.columns.length + 2} className="py-6 text-center text-muted">
                  No holdings match “{q}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </BlockFrame>
  );
}

export function SectorShiftBlockView({ block }: { block: SectorShiftBlock }) {
  const max = Math.max(...block.rows.flatMap((r) => [r.before, r.after]), 0.0001);
  return (
    <BlockFrame title={block.title} subtitle={block.subtitle} asOf={block.asOf}>
      <ul className="mt-3 flex items-center gap-4 text-[12px] text-muted" aria-label="Legend">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-4 rounded-full bg-c-other" /> Before
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-4 rounded-full bg-c1" /> After
        </li>
      </ul>
      <ul className="mt-3 space-y-3">
        {block.rows.map((r) => {
          const d = r.after - r.before;
          return (
            <li
              key={r.sector}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-[150px_1fr_120px]"
            >
              <span className="truncate text-fg">{r.sector}</span>
              <span className="order-last col-span-2 space-y-1 sm:order-none sm:col-span-1">
                <span className="block h-[5px] rounded-full bg-track">
                  <span
                    className="block h-full rounded-full bg-c-other"
                    style={{ width: `${(r.before / max) * 100}%` }}
                  />
                </span>
                <span className="block h-[5px] rounded-full bg-track">
                  <span
                    className="block h-full rounded-full bg-c1"
                    style={{ width: `${(r.after / max) * 100}%` }}
                  />
                </span>
              </span>
              <span className="text-right whitespace-nowrap">
                <span className="text-muted">{formatPercent(r.before, { digits: 0 })}</span>
                <span className="mx-1 text-faint">→</span>
                <span className="font-semibold text-fg">
                  {formatPercent(r.after, { digits: 0 })}
                </span>
                <span className={cn('ml-2 text-[12px]', trendClass(d))}>
                  {formatPercent(d, { digits: 0, signed: true })}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </BlockFrame>
  );
}

export function ChatBlockView({ block }: { block: ChatBlock }) {
  switch (block.type) {
    case 'table':
      return <TableBlockView block={block} />;
    case 'sector_shift':
      return <SectorShiftBlockView block={block} />;
  }
}
