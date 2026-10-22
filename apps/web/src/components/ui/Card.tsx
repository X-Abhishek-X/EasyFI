import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article' | 'aside';
  padded?: boolean;
};

/** Rounded bordered surface. Default element is <section>. */
export function Card({ as: Tag = 'section', padded = true, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}

export type CardHeaderProps = {
  title: ReactNode;
  /** Small text right after the title (e.g. "78 companies appear in both"). */
  meta?: ReactNode;
  /** Right-aligned controls (tabs, links). */
  actions?: ReactNode;
  level?: 2 | 3;
  className?: string;
};

export function CardHeader({ title, meta, actions, level = 2, className }: CardHeaderProps) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-2', className)}>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <H className="text-[15px] font-semibold text-fg">{title}</H>
        {meta ? <span className="text-[13px] text-muted">{meta}</span> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Section heading row used between card groups ("Your portfolios · sorted by risk"). */
export function SectionHeading({
  title,
  action,
  id,
}: {
  title: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 id={id} className="text-[15px] font-semibold text-fg">
        {title}
      </h2>
      {action ? <div className="text-[13px] text-muted">{action}</div> : null}
    </div>
  );
}
