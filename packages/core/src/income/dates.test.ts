import { describe, expect, it } from 'vitest';
import { addDays, addMonths, addMonthKey, daysBetween, monthKey } from './dates';

describe('date helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds months clamping to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-10-22', -12)).toBe('2025-10-22');
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('computes month keys and day differences', () => {
    expect(monthKey('2026-10-22')).toBe('2026-10');
    expect(addMonthKey('2026-11', 3)).toBe('2027-02');
    expect(addMonthKey('2026-01', -1)).toBe('2025-12');
    expect(daysBetween('2026-01-01', '2026-02-01')).toBe(31);
  });
});
