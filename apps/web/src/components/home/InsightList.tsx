import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ExposureInsight } from '@/components/types';
import { SeverityPill } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';

export function explorerHref(q: string) {
  return `/explorer?q=${encodeURIComponent(q)}`;
}

/** One exposure insight: severity pill, sentence, "Ask why" deep link into the Explorer. */
export function InsightCard({
  insight,
  className,
}: {
  insight: ExposureInsight;
  className?: string;
}) {
  return (
    <article className={cn('flex flex-col items-start gap-3', className)}>
      <SeverityPill level={insight.severity} />
      <p className="max-w-[34ch] text-[14px] leading-[1.45] text-fg">{insight.text}</p>
      <Link
        href={explorerHref(insight.askQuery)}
        className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-up hover:underline"
      >
        Ask why <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        <span className="sr-only">: {insight.text}</span>
      </Link>
    </article>
  );
}

/** A row of insights inside one card, divided by vertical rules (stacked on phones). */
export function InsightRow({ insights }: { insights: ExposureInsight[] }) {
  return (
    <div className="grid rounded-[var(--radius-card)] border border-line bg-surface md:grid-cols-3">
      {insights.map((i, idx) => (
        <InsightCard
          key={i.id}
          insight={i}
          className={cn('p-5 sm:p-6', idx > 0 && 'border-t border-line md:border-t-0 md:border-l')}
        />
      ))}
    </div>
  );
}
