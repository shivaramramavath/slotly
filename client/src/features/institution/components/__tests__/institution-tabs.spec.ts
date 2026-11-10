// Unit tests for institution segmented link tabs routing and active key resolution.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getActiveInstitutionTab,
  INSTITUTION_TABS,
} from '../institution-tabs';

describe('getActiveInstitutionTab', () => {
  it('correctly maps route paths to active tab keys', () => {
    assert.strictEqual(getActiveInstitutionTab('/institutions'), 'overview');
    assert.strictEqual(getActiveInstitutionTab('/institutions/'), 'overview');
    assert.strictEqual(getActiveInstitutionTab('/institutions/departments'), 'departments');
    assert.strictEqual(getActiveInstitutionTab('/institutions/programs'), 'programs');
    assert.strictEqual(getActiveInstitutionTab('/institutions/academic-years'), 'academic-years');
    assert.strictEqual(getActiveInstitutionTab('/institutions/semesters'), 'semesters');
    assert.strictEqual(getActiveInstitutionTab('/institutions/sections'), 'sections');
    assert.strictEqual(getActiveInstitutionTab('/institutions/calendar'), 'calendar');
    assert.strictEqual(getActiveInstitutionTab('/institutions/working-days'), 'working-days');
  });

  it('defaults to overview for unspecified paths', () => {
    assert.strictEqual(getActiveInstitutionTab('/institutions/other'), 'overview');
  });
});

describe('INSTITUTION_TABS', () => {
  it('contains all 8 required tabs in proper hierarchy order', () => {
    assert.strictEqual(INSTITUTION_TABS.length, 8);
    const keys = INSTITUTION_TABS.map((t) => t.key);
    assert.deepStrictEqual(keys, [
      'overview',
      'departments',
      'programs',
      'academic-years',
      'semesters',
      'sections',
      'calendar',
      'working-days',
    ]);
  });

  it('guarantees correct base href for each tab', () => {
    const hrefMap = Object.fromEntries(INSTITUTION_TABS.map((t) => [t.key, t.href]));
    assert.strictEqual(hrefMap['overview'], '/institutions');
    assert.strictEqual(hrefMap['departments'], '/institutions/departments');
    assert.strictEqual(hrefMap['programs'], '/institutions/programs');
    assert.strictEqual(hrefMap['academic-years'], '/institutions/academic-years');
    assert.strictEqual(hrefMap['semesters'], '/institutions/semesters');
    assert.strictEqual(hrefMap['sections'], '/institutions/sections');
    assert.strictEqual(hrefMap['calendar'], '/institutions/calendar');
    assert.strictEqual(hrefMap['working-days'], '/institutions/working-days');
  });
});
