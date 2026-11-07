// Unit tests for library export filename formatting.
import { describe, it, expect } from 'vitest';
import { buildExportFilename } from '@/features/library/utils/export-filename';

describe('buildExportFilename', () => {
  it('formats filename with entity, date, and extension', () => {
    const testDate = new Date(2026, 4, 15); // May 15, 2026
    const filename = buildExportFilename('faculty', 'xlsx', testDate);
    expect(filename).toBe('faculty-2026-05-15.xlsx');
  });

  it('handles csv extension with or without leading dot', () => {
    const testDate = new Date(2026, 11, 2); // Dec 2, 2026
    expect(buildExportFilename('subjects', '.csv', testDate)).toBe('subjects-2026-12-02.csv');
    expect(buildExportFilename('rooms', 'csv', testDate)).toBe('rooms-2026-12-02.csv');
  });

  it('pads single-digit month and day with zeros', () => {
    const testDate = new Date(2026, 0, 5); // Jan 5, 2026
    const filename = buildExportFilename('rooms', 'xlsx', testDate);
    expect(filename).toBe('rooms-2026-01-05.xlsx');
  });
});
