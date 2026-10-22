'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TabOption<V extends string = string> = {
  value: V;
  label: ReactNode;
  /** When set, the tab is a link (server-driven state via URL). */
  href?: string;
  icon?: ReactNode;
};

export type SegmentedTabsProps<V extends string> = {
  options: TabOption<V>[];
  value: V;
  onChange?: (value: V) => void;
  /** Accessible name for the group. */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
};

/** Pill-shaped tab group (Sector / Holding / Overlap, Company / Sector / Industry). */
export function SegmentedTabs<V extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedTabsProps<V>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        const cls = cn(
          'inline-flex items-center gap-1.5 rounded-full border transition-colors whitespace-nowrap',
          size === 'md' ? 'h-8 px-4 text-[13px]' : 'h-7 px-3 text-[12px]',
          active
            ? 'border-line-strong bg-surface-3 font-semibold text-fg'
            : 'border-line text-muted hover:border-line-strong hover:text-fg',
        );
        if (o.href) {
          return (
            <Link
              key={o.value}
              href={o.href}
              role="tab"
              aria-selected={active}
              scroll={false}
              className={cls}
            >
              {o.icon}
              {o.label}
            </Link>
          );
        }
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cls}
            onClick={() => onChange?.(o.value)}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
