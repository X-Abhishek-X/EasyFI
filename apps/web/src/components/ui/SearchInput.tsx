import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: string;
  size?: 'sm' | 'md';
};

export function SearchInput({
  label = 'Search',
  placeholder = 'Search by ticker or name…',
  className,
  size = 'md',
  ...rest
}: SearchInputProps) {
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-faint"
      />
      <input
        type="search"
        placeholder={placeholder}
        className={cn(
          'w-full rounded-[10px] border border-line bg-surface pr-3 pl-10 text-[14px] text-fg placeholder:text-faint focus:border-line-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-brand',
          size === 'md' ? 'h-10' : 'h-9 text-[13px]',
        )}
        {...rest}
      />
    </label>
  );
}
