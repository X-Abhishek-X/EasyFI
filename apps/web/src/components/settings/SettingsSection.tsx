import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

/** Settings block: heading + description on the left (desktop), controls on the right. */
export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card
      as="section"
      aria-labelledby={id}
      className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10"
    >
      <div>
        <h2 id={id} className="text-[15px] font-semibold text-fg">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
