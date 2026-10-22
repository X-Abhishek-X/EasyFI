import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-3 text-faint">{icon}</div> : null}
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {body ? <p className="mt-1.5 max-w-sm text-[13px] text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
