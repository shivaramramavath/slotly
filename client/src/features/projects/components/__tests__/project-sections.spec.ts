// Unit tests for project sections registry, pure selectors, filtering, and sorting behavior.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PROJECT_SECTIONS,
  type ProjectSectionConfig,
} from '../project-sections.registry';
import {
  selectSectionProjects,
  selectFlatResults,
  isFilteringActive,
} from '../project-selectors';
import type { ProjectDto } from '@slotly/contracts';

function makeMockProject(partial: Partial<ProjectDto>): ProjectDto {
  return {
    id: 'proj_default',
    institutionId: 'inst_1',
    ownerId: 'user_1',
    name: 'Sample Term',
    term: { kind: 'odd', startDate: '2026-08-01', endDate: '2026-12-20' },
    status: 'draft',
    settings: {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 7,
      periodDuration: 50,
      startTime: '09:00',
      breaks: [],
      perDayOverrides: {},
    },
    strictness: 'strict',
    revision: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...partial,
  };
}

describe('PROJECT_SECTIONS registry', () => {
  it('contains canonical sections in exact order: pinned, recent, all, archived', () => {
    assert.deepStrictEqual(
      PROJECT_SECTIONS.map((s) => s.id),
      ['pinned', 'recent', 'all', 'archived'],
    );
  });

  it('pinned section has limit 12 and hides when empty', () => {
    const pinnedSection = PROJECT_SECTIONS.find((s) => s.id === 'pinned');
    assert.ok(pinnedSection);
    assert.strictEqual(pinnedSection.limit, 12);
    assert.strictEqual(pinnedSection.hideWhenEmpty, true);
    assert.strictEqual(pinnedSection.collapsible, true);
  });

  it('recent section has limit 6, is non-collapsible, and hides when empty', () => {
    const recentSection = PROJECT_SECTIONS.find((s) => s.id === 'recent');
    assert.ok(recentSection);
    assert.strictEqual(recentSection.limit, 6);
    assert.strictEqual(recentSection.hideWhenEmpty, true);
    assert.strictEqual(recentSection.collapsible, false);
  });

  it('archived section is collapsible and defaultCollapsed is true', () => {
    const archivedSection = PROJECT_SECTIONS.find((s) => s.id === 'archived');
    assert.ok(archivedSection);
    assert.strictEqual(archivedSection.collapsible, true);
    assert.strictEqual(archivedSection.defaultCollapsed, true);
  });
});

describe('selectSectionProjects - Pinned Section', () => {
  const pinnedConfig = PROJECT_SECTIONS.find((s) => s.id === 'pinned') as ProjectSectionConfig;

  it('filters only pinned projects and sorts by pinnedAt descending', () => {
    const p1 = makeMockProject({ id: 'p1', pinned: true, pinnedAt: '2026-11-01T10:00:00Z' });
    const p2 = makeMockProject({ id: 'p2', pinned: true, pinnedAt: '2026-11-05T10:00:00Z' });
    const p3 = makeMockProject({ id: 'p3', pinned: false });
    const pArchived = makeMockProject({ id: 'p4', pinned: true, status: 'archived' });

    const selected = selectSectionProjects([p1, p2, p3, pArchived], pinnedConfig);
    assert.strictEqual(selected.length, 2);
    assert.strictEqual(selected[0]?.id, 'p2'); // More recent pin first
    assert.strictEqual(selected[1]?.id, 'p1');
  });

  it('enforces maximum limit of 12 pinned projects', () => {
    const manyPinned = Array.from({ length: 20 }, (_, i) =>
      makeMockProject({
        id: `p_${i}`,
        pinned: true,
        pinnedAt: new Date(Date.now() - i * 1000).toISOString(),
      }),
    );

    const selected = selectSectionProjects(manyPinned, pinnedConfig);
    assert.strictEqual(selected.length, 12);
  });
});

describe('selectSectionProjects - Recent Section', () => {
  const recentConfig = PROJECT_SECTIONS.find((s) => s.id === 'recent') as ProjectSectionConfig;

  it('includes projects opened within 14 days and excludes pinned or archived projects', () => {
    const now = Date.now();
    const pRecent = makeMockProject({
      id: 'pRecent',
      lastOpenedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: false,
    });
    const pOld = makeMockProject({
      id: 'pOld',
      lastOpenedAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: false,
    });
    const pPinned = makeMockProject({
      id: 'pPinned',
      lastOpenedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pinned: true,
    });
    const pArchived = makeMockProject({
      id: 'pArchived',
      lastOpenedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'archived',
    });

    const selected = selectSectionProjects([pRecent, pOld, pPinned, pArchived], recentConfig);
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0]?.id, 'pRecent');
  });

  it('limits recent projects to at most 6', () => {
    const now = Date.now();
    const manyRecent = Array.from({ length: 10 }, (_, i) =>
      makeMockProject({
        id: `recent_${i}`,
        lastOpenedAt: new Date(now - i * 3600000).toISOString(),
        pinned: false,
      }),
    );

    const selected = selectSectionProjects(manyRecent, recentConfig);
    assert.strictEqual(selected.length, 6);
  });
});

describe('selectFlatResults & isFilteringActive', () => {
  it('detects when filter or search is active', () => {
    assert.strictEqual(isFilteringActive('', ''), false);
    assert.strictEqual(isFilteringActive('  ', ''), false);
    assert.strictEqual(isFilteringActive('fall', ''), true);
    assert.strictEqual(isFilteringActive('', 'draft'), true);
  });

  it('filters projects by search term case-insensitively', () => {
    const p1 = makeMockProject({ id: '1', name: 'Spring Term 2026' });
    const p2 = makeMockProject({ id: '2', name: 'Fall Term 2026' });

    const results = selectFlatResults([p1, p2], 'fall', '');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.id, '2');
  });

  it('filters projects by status', () => {
    const pDraft = makeMockProject({ id: '1', status: 'draft' });
    const pArchived = makeMockProject({ id: '2', status: 'archived' });

    const results = selectFlatResults([pDraft, pArchived], '', 'archived');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.id, '2');
  });
});
