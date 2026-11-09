// Unit tests for library table columns, widths, and header wrap prevention configurations.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  FACULTY_COLUMNS,
  SUBJECT_COLUMNS,
  ROOM_COLUMNS,
} from '../library-table-skeleton';

describe('FACULTY_COLUMNS', () => {
  it('contains all 8 required columns', () => {
    assert.strictEqual(FACULTY_COLUMNS.length, 8);
    const labels = FACULTY_COLUMNS.map((c) => c.label);
    assert.deepStrictEqual(labels, [
      'Code',
      'Name',
      'Department',
      'Designation',
      'Teaching Workload',
      'Qualified Subjects',
      'Status',
      'Actions',
    ]);
  });

  it('guarantees min-widths to prevent column header wrapping at 1024px', () => {
    const workloadCol = FACULTY_COLUMNS.find((c) => c.label === 'Teaching Workload');
    assert.ok(workloadCol);
    assert.match(workloadCol.widthClass || '', /min-w-\[220px\]/);

    const qualifiedCol = FACULTY_COLUMNS.find((c) => c.label === 'Qualified Subjects');
    assert.ok(qualifiedCol);
    assert.match(qualifiedCol.widthClass || '', /min-w-\[140px\]/);
  });

  it('right-aligns actions column', () => {
    const actionsCol = FACULTY_COLUMNS.find((c) => c.label === 'Actions');
    assert.strictEqual(actionsCol?.align, 'right');
  });
});

describe('SUBJECT_COLUMNS', () => {
  it('contains all 9 required columns', () => {
    assert.strictEqual(SUBJECT_COLUMNS.length, 9);
    const labels = SUBJECT_COLUMNS.map((c) => c.label);
    assert.deepStrictEqual(labels, [
      'Code',
      'Name',
      'Department',
      'Type',
      'Credits',
      'Weekly / Lab Hrs',
      'Room Requirements',
      'Elective Group',
      'Actions',
    ]);
  });

  it('right-aligns actions column', () => {
    const actionsCol = SUBJECT_COLUMNS.find((c) => c.label === 'Actions');
    assert.strictEqual(actionsCol?.align, 'right');
  });
});

describe('ROOM_COLUMNS', () => {
  it('contains all 9 required columns', () => {
    assert.strictEqual(ROOM_COLUMNS.length, 9);
    const labels = ROOM_COLUMNS.map((c) => c.label);
    assert.deepStrictEqual(labels, [
      'Code',
      'Name',
      'Building',
      'Type',
      'Capacity',
      'Equipment',
      'Shared',
      'Status',
      'Actions',
    ]);
  });

  it('right-aligns actions column', () => {
    const actionsCol = ROOM_COLUMNS.find((c) => c.label === 'Actions');
    assert.strictEqual(actionsCol?.align, 'right');
  });
});
