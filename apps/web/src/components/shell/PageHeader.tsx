import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Crumb = { label: string; href?: string };

/** Page title block: optional breadcrumb, h1, subtitle, right-side actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: Crumb[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="mb-1 text-[13px] text-muted">
            <ol className="flex flex-wrap items-center gap-1">
              {breadcrumb.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1">
                  {i > 0 ? (
                    <span aria-hidden className="text-faint">
                      ›
                    </span>
                  ) : null}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-fg">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.015em] text-fg">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-[14px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
