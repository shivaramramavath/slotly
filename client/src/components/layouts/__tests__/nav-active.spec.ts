// Unit tests for active top navigation section calculation.
import { describe, it, expect } from 'vitest';
import { getActiveNavSection } from '@/components/layouts/nav-active';

describe('getActiveNavSection', () => {
  it('returns null for the root path "/"', () => {
    expect(getActiveNavSection('/')).toBeNull();
  });

  it('matches "projects" for "/projects/123" and dashboard paths', () => {
    expect(getActiveNavSection('/projects/123')).toBe('projects');
    expect(getActiveNavSection('/dashboard')).toBe('projects');
    expect(getActiveNavSection('/projects/new')).toBe('projects');
  });

  it('matches "library" for "/library/faculty" and subpaths', () => {
    expect(getActiveNavSection('/library/faculty')).toBe('library');
    expect(getActiveNavSection('/library/subjects')).toBe('library');
    expect(getActiveNavSection('/library/rooms')).toBe('library');
    expect(getActiveNavSection('/library')).toBe('library');
  });

  it('matches "institution" for "/institution" and "/institutions"', () => {
    expect(getActiveNavSection('/institution')).toBe('institution');
    expect(getActiveNavSection('/institutions')).toBe('institution');
    expect(getActiveNavSection('/institution/departments')).toBe('institution');
  });

  it('handles null, empty, or unknown paths gracefully', () => {
    expect(getActiveNavSection(null)).toBeNull();
    expect(getActiveNavSection(undefined)).toBeNull();
    expect(getActiveNavSection('')).toBeNull();
    expect(getActiveNavSection('/unknown-path')).toBeNull();
  });
});
