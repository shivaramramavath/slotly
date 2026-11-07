/**
 * Deterministic Pseudo-Random Number Generator using Mulberry32.
 * Produces reproducible sequences given a numeric seed.
 */
export class SeededRng {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Returns a float in [0, 1).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  range(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a randomly chosen item from an array.
   */
  pick<T>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    return items[this.range(0, items.length - 1)];
  }

  /**
   * Shuffles an array deterministically in place.
   */
  shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = temp;
    }
    return arr;
  }
}
