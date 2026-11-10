// Unit tests for project card helper utilities: opened metadata, description, and status coloring.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatOpenedMeta,
  formatOpenedDate,
  getProjectDescription,
  getStatusColorClass,
} from '../project-card';
import type { ProjectDto } from '@slotly/contracts';

describe('formatOpenedMeta', () => {
  it('returns "Not opened yet" when lastOpenedAt is null or invalid', () => {
    assert.strictEqual(formatOpenedMeta(1, null), 'Rev 1 · Not opened yet');
    assert.strictEqual(formatOpenedMeta(2, undefined), 'Rev 2 · Not opened yet');
    assert.strictEqual(formatOpenedMeta(3, 'not-a-valid-date'), 'Rev 3 · Not opened yet');
  });

  it('formats valid date into day and short month format', () => {
    const formatted = formatOpenedMeta(1, '2026-11-09T04:23:32.473Z');
    assert.match(formatted, /^Rev 1 · opened \d{1,2} Nov$/);
  });
});

describe('formatOpenedDate', () => {
  it('returns "Not opened yet" when lastOpenedAt is null or invalid', () => {
    assert.strictEqual(formatOpenedDate(null), 'Not opened yet');
    assert.strictEqual(formatOpenedDate(undefined), 'Not opened yet');
    assert.strictEqual(formatOpenedDate('invalid'), 'Not opened yet');
  });

  it('formats valid date into "opened day month"', () => {
    const formatted = formatOpenedDate('2026-11-09T04:23:32.473Z');
    assert.match(formatted, /^opened \d{1,2} Nov$/);
  });
});

describe('getProjectDescription', () => {
  it('returns default fallback description when settings are missing', () => {
    const project = {
      id: 'proj-1',
      name: 'Test Project',
      status: 'draft',
      revision: 1,
      createdAt: '2026-11-09T00:00:00.000Z',
      updatedAt: '2026-11-09T00:00:00.000Z',
    } as unknown as ProjectDto;

    assert.strictEqual(
      getProjectDescription(project),
      '5 days a week, 7 periods a day, strict mode.',
    );
  });

  it('returns customized description based on project settings', () => {
    const project = {
      id: 'proj-2',
      name: 'Custom Project',
      status: 'ready',
      revision: 2,
      strictness: 'flexible',
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        periodsPerDay: 8,
      },
      createdAt: '2026-11-09T00:00:00.000Z',
      updatedAt: '2026-11-09T00:00:00.000Z',
    } as unknown as ProjectDto;

    assert.strictEqual(
      getProjectDescription(project),
      '6 days a week, 8 periods a day, flexible mode.',
    );
  });
});

describe('getStatusColorClass', () => {
  it('returns green for published and ready', () => {
    assert.strictEqual(getStatusColorClass('published'), 'text-[#22C55E]');
    assert.strictEqual(getStatusColorClass('ready'), 'text-[#22C55E]');
  });

  it('returns yellow for building and pending_approval', () => {
    assert.strictEqual(getStatusColorClass('building'), 'text-[#FACC15]');
    assert.strictEqual(getStatusColorClass('pending_approval'), 'text-[#FACC15]');
  });

  it('returns muted gray for draft and archived', () => {
    assert.strictEqual(getStatusColorClass('draft'), 'text-[#8A8A8A]');
    assert.strictEqual(getStatusColorClass('archived'), 'text-[#8A8A8A]');
  });
});
