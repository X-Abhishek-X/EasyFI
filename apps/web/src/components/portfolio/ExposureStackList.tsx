import type { ExposureRow } from '@/components/types';
import { ExposureStackRow } from './ExposureStackRow';

export type ExposureStackListProps = {
  rows: ExposureRow[];
  sourceOrder: readonly string[];
  /** Builds the constellation deep link for a ticker (company fold). */
  constellationHref?: (ticker: string) => string;
  stockHref?: (ticker: string) => string;
  /** Key of a row to open initially. */
  openKey?: string;
};

/** Ranked look-through rows. Bars share one scale: the largest row fills the track. */
export function ExposureStackList({
  rows,
  sourceOrder,
  constellationHref,
  stockHref,
  openKey,
}: ExposureStackListProps) {
  const scale = Math.max(...rows.map((r) => r.weight), 0);
  return (
    <ul className="space-y-2" aria-label="Exposure ranked by effective weight">
      {rows.map((r) => (
        <ExposureStackRow
          key={r.key}
          row={r}
          scale={scale}
          sourceOrder={sourceOrder}
          defaultOpen={r.key === openKey}
          constellationHref={
            r.ticker && constellationHref ? constellationHref(r.ticker) : undefined
          }
          stockHref={r.ticker && stockHref ? stockHref(r.ticker) : undefined}
        />
      ))}
    </ul>
  );
}
