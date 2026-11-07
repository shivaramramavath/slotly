// Unit tests for library filter URL parsing, serialization, and fallback behavior.
import { describe, it, expect } from 'vitest';
import {
  parseLibraryFilters,
  serializeLibraryFilters,
  DEFAULT_LIBRARY_FILTERS,
} from '@/features/library/hooks/use-library-filters';

describe('use-library-filters utilities', () => {
  describe('parseLibraryFilters', () => {
    it('returns default filters for empty or root search string', () => {
      expect(parseLibraryFilters('')).toEqual(DEFAULT_LIBRARY_FILTERS);
      expect(parseLibraryFilters('?')).toEqual(DEFAULT_LIBRARY_FILTERS);
    });

    it('correctly parses valid query parameters', () => {
      const parsed = parseLibraryFilters('?q=algorithms&dept=cse-101&archived=true&page=3');
      expect(parsed).toEqual({
        q: 'algorithms',
        dept: 'cse-101',
        archived: true,
        page: 3,
      });
    });

    it('falls back safely on invalid page values', () => {
      expect(parseLibraryFilters('?page=-5').page).toBe(1);
      expect(parseLibraryFilters('?page=0').page).toBe(1);
      expect(parseLibraryFilters('?page=notanumber').page).toBe(1);
    });

    it('falls back safely on invalid archived values', () => {
      expect(parseLibraryFilters('?archived=yes').archived).toBe(false);
      expect(parseLibraryFilters('?archived=1').archived).toBe(false);
      expect(parseLibraryFilters('?archived=false').archived).toBe(false);
      expect(parseLibraryFilters('?archived=true').archived).toBe(true);
    });

    it('trims whitespace from string parameters', () => {
      const parsed = parseLibraryFilters('?q=%20%20physics%20%20&dept=%20sci%20');
      expect(parsed.q).toBe('physics');
      expect(parsed.dept).toBe('sci');
    });

    it('parses from Record object', () => {
      const parsed = parseLibraryFilters({
        q: 'chemistry',
        dept: 'chem-dept',
        archived: 'true',
        page: '2',
      });
      expect(parsed).toEqual({
        q: 'chemistry',
        dept: 'chem-dept',
        archived: true,
        page: 2,
      });
    });
  });

  describe('serializeLibraryFilters', () => {
    it('serializes active filters into URLSearchParams', () => {
      const params = serializeLibraryFilters({
        q: 'calculus',
        dept: 'math',
        archived: true,
        page: 4,
      });

      expect(params.get('q')).toBe('calculus');
      expect(params.get('dept')).toBe('math');
      expect(params.get('archived')).toBe('true');
      expect(params.get('page')).toBe('4');
    });

    it('omits defaults to keep the URL clean', () => {
      const params = serializeLibraryFilters({
        q: '',
        dept: '',
        archived: false,
        page: 1,
      });

      expect(params.has('q')).toBe(false);
      expect(params.has('dept')).toBe(false);
      expect(params.has('archived')).toBe(false);
      expect(params.has('page')).toBe(false);
    });

    it('preserves existing non-library query params', () => {
      const existing = new URLSearchParams('view=compact&sort=name');
      const params = serializeLibraryFilters({ q: 'biology' }, existing);

      expect(params.get('view')).toBe('compact');
      expect(params.get('sort')).toBe('name');
      expect(params.get('q')).toBe('biology');
    });
  });
});
