import { normalizeAvailabilityMatrix } from '@slotly/contracts';

describe('Availability Matrix Normalization (AUD-003)', () => {
  it('should initialize a default 5x7 availability matrix when empty', () => {
    const matrix = normalizeAvailabilityMatrix(undefined, 5, 7);
    expect(matrix).toHaveLength(5);
    for (const row of matrix) {
      expect(row).toHaveLength(7);
      expect(row.every((cell) => cell === true)).toBe(true);
    }
  });

  it('should pad smaller matrices to match configured days and periods', () => {
    // 3 days x 4 periods with custom false cell
    const input = [
      [true, false, true, true],
      [true, true, true, true],
      [false, true, true, true],
    ];

    const result = normalizeAvailabilityMatrix(input, 6, 8);
    expect(result).toHaveLength(6);
    // Preserves existing cells
    expect(result[0]![1]).toBe(false);
    expect(result[2]![0]).toBe(false);
    // Pads extra periods in existing rows with true
    expect(result[0]![4]).toBe(true);
    expect(result[0]![7]).toBe(true);
    // Pads extra days with true rows
    expect(result[5]).toHaveLength(8);
    expect(result[5]!.every((c) => c === true)).toBe(true);
  });

  it('should truncate larger legacy matrices (e.g. 7x10) to configured dimensions', () => {
    const legacy = Array.from({ length: 7 }, (): boolean[] =>
      Array<boolean>(10).fill(true),
    );
    legacy[0]![0] = false;

    const normalized = normalizeAvailabilityMatrix(legacy, 5, 7);
    expect(normalized).toHaveLength(5);
    for (const row of normalized) {
      expect(row).toHaveLength(7);
    }
    expect(normalized[0]![0]).toBe(false);
  });
});
