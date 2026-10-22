'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

/** Accessible on/off switch. Uncontrolled unless `checked` + `onChange` are given. */
export function Switch({
  label,
  description,
  defaultChecked = false,
  checked,
  onChange,
  name,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  name?: string;
}) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    setInner(!on);
    onChange?.(!on);
  };
  return (
    <div className="flex items-start justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <div className="text-[14px] text-fg">{label}</div>
        {description ? <div className="mt-0.5 text-[13px] text-muted">{description}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        name={name}
        onClick={toggle}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          on ? 'border-brand bg-brand' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-[22px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  );
}
