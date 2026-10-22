import { OTHER_COLOR, seriesColor } from '@/lib/palette';
import type { CompareFund } from './types';

/**
 * Sector → color map shared by both cards so "Technology" is the same blue on each side.
 * Keys are assigned in order of first appearance; "Other" is always slate.
 */
export function sectorColorMap(funds: CompareFund[]): Record<string, string> {
  const map: Record<string, string> = {};
  let i = 0;
  for (const f of funds) {
    for (const s of f.sectors) {
      if (map[s.key]) continue;
      if (/^other$/i.test(s.label)) {
        map[s.key] = OTHER_COLOR;
      } else {
        map[s.key] = seriesColor(i);
        i += 1;
      }
    }
  }
  return map;
}
