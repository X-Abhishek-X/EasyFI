import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Concentration } from '@/lib/palette';

export type PillTone = 'high' | 'medium' | 'low' | 'neutral' | 'brand' | 'info';

const tones: Record<PillTone, string> = {
  high: 'bg-[var(--sev-high-bg)] text-[var(--sev-high-fg)]',
  medium: 'bg-[var(--sev-med-bg)] text-[var(--sev-med-fg)]',
  low: 'bg-[var(--sev-low-bg)] text-[var(--sev-low-fg)]',
  neutral: 'border border-line-strong text-muted',
  brand: 'bg-brand/15 text-brand',
  info: 'bg-c1/15 text-c1',
};

export function Pill({
  tone = 'neutral',
  children,
  className,
  title,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[12px] leading-none font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type Severity = 'high' | 'medium' | 'low';
const SEVERITY_LABEL: Record<Severity, string> = { high: 'High', medium: 'Medium', low: 'Low' };

/** Severity / concentration badge: High (red), Medium (amber), Low (slate). */
export function SeverityPill({
  level,
  className,
}: {
  level: Severity | Concentration;
  className?: string;
}) {
  return (
    <Pill tone={level} className={className}>
      {SEVERITY_LABEL[level]}
    </Pill>
  );
}

/** Shown next to "—" when a holding has no price. Never render a missing price as $0. */
export function UnpricedPill() {
  return (
    <Pill tone="neutral" title="No market price available yet" className="h-5 px-2 text-[11px]">
      Unpriced
    </Pill>
  );
}
