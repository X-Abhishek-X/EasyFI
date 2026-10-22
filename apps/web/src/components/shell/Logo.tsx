import { cn } from '@/lib/cn';

/** EasyFI mark: three stacked exposure bars, largest first — the look-through stack in miniature. */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <rect width="26" height="26" rx="8" fill="var(--brand)" />
      <rect x="6" y="7" width="14" height="3" rx="1.5" fill="var(--brand-ink)" />
      <rect x="6" y="11.5" width="10" height="3" rx="1.5" fill="var(--brand-ink)" opacity="0.8" />
      <rect x="6" y="16" width="6" height="3" rx="1.5" fill="var(--brand-ink)" opacity="0.6" />
    </svg>
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? (
        <span className="sr-only">EasyFI</span>
      ) : (
        <span className="text-[18px] font-semibold tracking-[-0.01em] text-fg">EasyFI</span>
      )}
    </span>
  );
}
