// Unit tests for library navigation tabs active state, query string preservation, and route helpers.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getActiveLibraryTab,
  getLibraryTabHref,
  LIBRARY_TABS,
} from '../library-tabs';

describe('getActiveLibraryTab', () => {
  it('correctly maps route paths to active tab keys', () => {
    assert.strictEqual(getActiveLibraryTab('/library/faculty'), 'faculty');
    assert.strictEqual(getActiveLibraryTab('/library/subjects'), 'subjects');
    assert.strictEqual(getActiveLibraryTab('/library/rooms'), 'rooms');
  });

  it('handles singular alias routes', () => {
    assert.strictEqual(getActiveLibraryTab('/library/subject'), 'subjects');
    assert.strictEqual(getActiveLibraryTab('/library/room'), 'rooms');
  });

  it('handles nested subpaths under library sections', () => {
    assert.strictEqual(getActiveLibraryTab('/library/faculty/fac_123'), 'faculty');
    assert.strictEqual(getActiveLibraryTab('/library/subjects/sub_456'), 'subjects');
    assert.strictEqual(getActiveLibraryTab('/library/rooms/room_789'), 'rooms');
  });

  it('defaults to faculty for root or unknown subpaths', () => {
    assert.strictEqual(getActiveLibraryTab('/library'), 'faculty');
    assert.strictEqual(getActiveLibraryTab('/library/unknown'), 'faculty');
  });
});

describe('getLibraryTabHref', () => {
  it('preserves search and active-only filters across all tabs', () => {
    const filters = { search: 'prof', department: null, archived: 'true' };

    assert.strictEqual(
      getLibraryTabHref('faculty', filters),
      '/library/faculty?search=prof&archived=true',
    );
    assert.strictEqual(
      getLibraryTabHref('subjects', filters),
      '/library/subjects?search=prof&archived=true',
    );
    assert.strictEqual(
      getLibraryTabHref('rooms', filters),
      '/library/rooms?search=prof&archived=true',
    );
  });

  it('preserves department filter between faculty and subjects', () => {
    const filters = { search: 'alg', department: 'dept_cs', archived: 'false' };

    assert.strictEqual(
      getLibraryTabHref('faculty', filters),
      '/library/faculty?search=alg&department=dept_cs',
    );
    assert.strictEqual(
      getLibraryTabHref('subjects', filters),
      '/library/subjects?search=alg&department=dept_cs',
    );
  });

  it('excludes department filter when targeting rooms', () => {
    const filters = { search: 'lab', department: 'dept_cs', archived: 'true' };

    // Department must not carry over to rooms because rooms are institution-level
    assert.strictEqual(
      getLibraryTabHref('rooms', filters),
      '/library/rooms?search=lab&archived=true',
    );
  });

  it('handles empty filters cleanly without trailing query mark', () => {
    const filters = { search: '', department: '', archived: '' };

    assert.strictEqual(getLibraryTabHref('faculty', filters), '/library/faculty');
    assert.strictEqual(getLibraryTabHref('subjects', filters), '/library/subjects');
    assert.strictEqual(getLibraryTabHref('rooms', filters), '/library/rooms');
  });
});

describe('LIBRARY_TABS', () => {
  it('defines all three primary library sections in canonical order', () => {
    assert.strictEqual(LIBRARY_TABS.length, 3);
    assert.deepStrictEqual(
      LIBRARY_TABS.map((t) => t.key),
      ['faculty', 'subjects', 'rooms'],
    );
    assert.strictEqual(LIBRARY_TABS[0]?.label, 'Faculty');
    assert.strictEqual(LIBRARY_TABS[1]?.label, 'Subjects');
    assert.strictEqual(LIBRARY_TABS[2]?.label, 'Rooms & Facilities');
  });
});
