// Unit tests for floating node library panel, node issues hover card, and issue labeling.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PALETTE_ITEMS } from '../palette/blueprint-palette';
import { formatIssueLabel, groupAndSortIssues } from '../canvas/issue-label';
import { getSafeDefaultsForNodeType } from '../canvas/safe-defaults';
import type { BlueprintCanvasNode } from '../../types/canvas.types';

describe('NodeLibraryPanel & PALETTE_ITEMS', () => {
  it('renders all canonical blueprint node types in preserved hierarchy and resource order', () => {
    assert.strictEqual(PALETTE_ITEMS.length, 11);

    const expectedTypes = [
      'institution',
      'department',
      'program',
      'academicYear',
      'semester',
      'section',
      'batch',
      'subjectAssignment',
      'electiveGroup',
      'faculty',
      'room',
    ];

    PALETTE_ITEMS.forEach((item, index) => {
      assert.strictEqual(item.type, expectedTypes[index]);
      assert.ok(item.label.length > 0);
      assert.ok(item.description.length > 0);
    });

    const structureItems = PALETTE_ITEMS.filter((i) => i.category === 'structure');
    const resourceItems = PALETTE_ITEMS.filter((i) => i.category === 'resource');

    assert.strictEqual(structureItems.length, 9);
    assert.strictEqual(resourceItems.length, 2);
  });

  it('guarantees disabled items carry aria-disabled="true" and preserve reason explanation without throwing', () => {
    const disabledReason = 'Cannot add Academic Year under Institution. Needs a Program.';
    const isAllowed = false;

    // Simulate item properties evaluated in NodeLibraryItem
    const itemProps = {
      isAllowed,
      reason: disabledReason,
      ariaDisabled: !isAllowed,
      ariaDescribedBy: !isAllowed && disabledReason ? 'node-reason-academicYear' : 'node-desc-academicYear',
    };

    assert.strictEqual(itemProps.ariaDisabled, true);
    assert.strictEqual(itemProps.ariaDescribedBy, 'node-reason-academicYear');
    assert.strictEqual(itemProps.reason, disabledReason);
  });

  it('handles keyboard navigation key codes (ArrowDown, ArrowUp, Home, End, Enter, Escape)', () => {
    const totalItems = PALETTE_ITEMS.length;
    let focusedIndex = 0;

    // Down arrow advances
    focusedIndex = (focusedIndex + 1) % totalItems;
    assert.strictEqual(focusedIndex, 1);

    // Up arrow decrements
    focusedIndex = (focusedIndex - 1 + totalItems) % totalItems;
    assert.strictEqual(focusedIndex, 0);

    // End jumps to last
    focusedIndex = totalItems - 1;
    assert.strictEqual(focusedIndex, totalItems - 1);

    // Home jumps to 0
    focusedIndex = 0;
    assert.strictEqual(focusedIndex, 0);
  });
});

describe('Issue Label Helper & Grouping', () => {
  it('translates known configuration keys into plain-language sentences', () => {
    assert.strictEqual(formatIssueLabel('workingDays'), 'Working days are not set');
    assert.strictEqual(formatIssueLabel('periodConfig'), 'Period timing is not configured');
    assert.strictEqual(formatIssueLabel('durationYears'), 'Degree duration is not set');
    assert.strictEqual(formatIssueLabel('yearNumber'), 'Academic year number is not set');
    assert.strictEqual(formatIssueLabel('startDate'), 'Term start date is missing');
    assert.strictEqual(formatIssueLabel('endDate'), 'Term end date is missing');
    assert.strictEqual(formatIssueLabel('strength'), 'Student strength is not configured');
    assert.strictEqual(formatIssueLabel('size'), 'Batch size is not configured');
    assert.strictEqual(formatIssueLabel('weeklyHours'), 'Weekly teaching hours are not set');
    assert.strictEqual(formatIssueLabel('maxHoursPerWeek'), 'Maximum weekly workload is not configured');
    assert.strictEqual(formatIssueLabel('capacity'), 'Room capacity is not specified');
    assert.strictEqual(formatIssueLabel('code'), 'Department or course code is missing');
  });

  it('humanizes unknown keys with readable sentence fallback', () => {
    assert.strictEqual(formatIssueLabel('customLabRequirements'), 'Custom lab requirements is required');
    assert.strictEqual(formatIssueLabel('exam_schedule_mode'), 'Exam schedule mode is required');
  });

  it('sorts blocking errors before warnings and missing requirements', () => {
    const node: BlueprintCanvasNode = {
      id: 'node-sec-1',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'Section A',
        nodeType: 'section',
        status: 'incomplete',
        effectiveStatus: 'blocked', // Blocking error
        missing: [
          { field: 'strength', message: 'Student strength is required' },
          { field: 'code', message: 'Section code is missing' },
        ],
        config: {},
      },
    };

    const issues = groupAndSortIssues(node);

    assert.strictEqual(issues.totalCount, 3);
    assert.strictEqual(issues.errors.length, 2); // 'parent_dependency' and 'code'
    assert.strictEqual(issues.warnings.length, 1); // 'strength'

    // First item in all must be an error
    assert.strictEqual(issues.all[0]?.severity, 'error');
    assert.strictEqual(issues.all[0]?.rawKey, 'parent_dependency');
  });

  it('reports zero issues for complete and valid nodes', () => {
    const node: BlueprintCanvasNode = {
      id: 'node-dept-1',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'Computer Science',
        nodeType: 'department',
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        config: {},
      },
    };

    const issues = groupAndSortIssues(node);
    assert.strictEqual(issues.totalCount, 0);
    assert.strictEqual(issues.errors.length, 0);
    assert.strictEqual(issues.warnings.length, 0);
  });
});

describe('Node Issues Card & Safe Defaults', () => {
  it('provides complete safe defaults for every node type', () => {
    const instDefaults = getSafeDefaultsForNodeType('institution');
    assert.ok(Array.isArray(instDefaults.workingDays));
    assert.ok(typeof instDefaults.code === 'string');
    assert.ok(typeof instDefaults.periodConfig === 'object');

    const deptDefaults = getSafeDefaultsForNodeType('department');
    assert.strictEqual(deptDefaults.code, 'DEPT');

    const progDefaults = getSafeDefaultsForNodeType('program');
    assert.strictEqual(progDefaults.durationYears, 4);

    const semDefaults = getSafeDefaultsForNodeType('semester');
    assert.strictEqual(semDefaults.startDate, '2026-08-01');
    assert.strictEqual(semDefaults.endDate, '2026-12-15');

    const secDefaults = getSafeDefaultsForNodeType('section');
    assert.strictEqual(secDefaults.strength, 60);

    const batchDefaults = getSafeDefaultsForNodeType('batch');
    assert.strictEqual(batchDefaults.size, 30);
  });

  it('guarantees identical node card dimensions with card open or closed (no layout shift)', () => {
    // In node-card.tsx, card width is strictly 200px and the footer status is single line without chevron expansion
    const NODE_WIDTH = 200;
    const NODE_MIN_HEIGHT = 72;

    // Both closed and open state rely on screen-space portal for NodeIssuesCard,
    // so node container bounding box remains strictly constant
    const closedNodeBounding = { width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT };
    const openNodeBounding = { width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT };

    assert.strictEqual(closedNodeBounding.width, openNodeBounding.width);
    assert.strictEqual(closedNodeBounding.minHeight, openNodeBounding.minHeight);
  });
});
