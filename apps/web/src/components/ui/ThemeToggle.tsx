'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* storage unavailable: theme still applies for this page view */
  }
}

/** Icon button (compact) or labelled switch (`variant="switch"`) toggling dark/light. */
export function ThemeToggle({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'switch';
  className?: string;
}) {
  const [theme, setThemeState] = useState<Theme>('dark');
  useEffect(() => {
    // Sync with the value the inline head script applied before paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readTheme());
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const toggle = () => {
    setTheme(next);
    setThemeState(next);
  };

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={theme === 'light'}
        onClick={toggle}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2 p-1 text-[13px]',
          className,
        )}
      >
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-full px-3',
            theme === 'dark' ? 'bg-surface-3 font-semibold text-fg' : 'text-muted',
          )}
        >
          <Moon className="h-3.5 w-3.5" aria-hidden /> Dark
        </span>
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-full px-3',
            theme === 'light' ? 'bg-surface-3 font-semibold text-fg' : 'text-muted',
          )}
        >
          <Sun className="h-3.5 w-3.5" aria-hidden /> Light
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
