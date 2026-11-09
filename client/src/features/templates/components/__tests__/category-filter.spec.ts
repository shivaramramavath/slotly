// Unit tests for category filter matching logic, normalization, and count handling.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeCategory,
  matchCategory,
} from '../category-filter';

describe('normalizeCategory', () => {
  it('converts to lowercase, standardizes ampersands, and collapses whitespace', () => {
    assert.strictEqual(normalizeCategory('Vocational & STEM'), 'vocational and stem');
    assert.strictEqual(normalizeCategory('  K-12   School  '), 'k-12 school');
    assert.strictEqual(normalizeCategory('University'), 'university');
  });
});

describe('matchCategory', () => {
  it('matches all categories when filter is "all" or empty', () => {
    assert.strictEqual(matchCategory('K-12 School', 'all'), true);
    assert.strictEqual(matchCategory('University', 'all'), true);
    assert.strictEqual(matchCategory('Vocational & STEM', ''), true);
    assert.strictEqual(matchCategory(undefined, 'all'), true);
  });

  it('matches exact category strings case-insensitively', () => {
    assert.strictEqual(matchCategory('University', 'university'), true);
    assert.strictEqual(matchCategory('K-12 School', 'K-12 School'), true);
  });

  it('matches ampersand variants between template data and filter option', () => {
    assert.strictEqual(matchCategory('Vocational & STEM', 'Vocational and STEM'), true);
    assert.strictEqual(matchCategory('Vocational and STEM', 'Vocational & STEM'), true);
  });

  it('matches sub-string keywords like School and STEM', () => {
    assert.strictEqual(matchCategory('Secondary School', 'K-12 School'), true);
    assert.strictEqual(matchCategory('Higher Ed College', 'University'), true);
    assert.strictEqual(matchCategory('Technical STEM Lab', 'Vocational and STEM'), true);
  });

  it('rejects non-matching categories', () => {
    assert.strictEqual(matchCategory('University', 'K-12 School'), false);
    assert.strictEqual(matchCategory('K-12 School', 'Vocational and STEM'), false);
    assert.strictEqual(matchCategory(null, 'University'), false);
  });
});
