import { cn } from '@/lib/cn';
import { formatIsoDate } from '@/lib/format';

/** "as of 2026-09-30" — required next to every market number. */
export function AsOf({
  date,
  prefix = 'as of',
  className,
}: {
  date: string | null | undefined;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={cn('text-[12px] text-faint', className)}>
      {prefix}{' '}
      {date ? <time dateTime={date.slice(0, 10)}>{formatIsoDate(date)}</time> : 'unknown date'}
    </span>
  );
}
