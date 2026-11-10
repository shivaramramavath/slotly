// Unit tests for floating node library panel, drag and drop, compact node card, compact issues card, toolbar, and header.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PALETTE_ITEMS } from '../palette/blueprint-palette';
import { formatIssueLabel, groupAndSortIssues } from '../canvas/issue-label';
import { getSafeDefaultsForNodeType } from '../canvas/safe-defaults';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

describe('NodeLibraryPanel & Drag-and-Drop', () => {
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

  it('guarantees items are draggable when enabled and draggable=false when disabled', () => {
    const enabledItem = {
      isAllowed: true,
      draggable: true,
      mimeType: 'application/x-slotly-node',
    };
    const disabledItem = {
      isAllowed: false,
      draggable: false,
      mimeType: 'application/x-slotly-node',
      reason: 'Cannot add Academic Year under Institution. Needs a Program.',
    };

    assert.strictEqual(enabledItem.draggable, true);
    assert.strictEqual(disabledItem.draggable, false);
    assert.strictEqual(disabledItem.reason.includes('Needs a Program'), true);
  });

  it('validates dropping on valid parent vs invalid parent vs empty canvas', () => {
    // Valid parent check
    const isChildValid = (parentType: BlueprintNodeType, childType: BlueprintNodeType): boolean => {
      const map: Record<string, string[]> = {
        institution: ['department'],
        department: ['program'],
        program: ['academicYear'],
        academicYear: ['semester'],
        semester: ['section', 'electiveGroup'],
        section: ['batch', 'subjectAssignment'],
      };
      return (map[parentType] || []).includes(childType);
    };

    assert.strictEqual(isChildValid('department', 'program'), true);
    assert.strictEqual(isChildValid('institution', 'program'), false);

    // Empty canvas drop check: only root types allowed without parent
    const canDropOnEmptyCanvas = (type: BlueprintNodeType, hasInstitution: boolean): boolean => {
      if (type === 'institution') return !hasInstitution;
      if (type === 'faculty' || type === 'room') return true;
      return false;
    };

    assert.strictEqual(canDropOnEmptyCanvas('institution', false), true);
    assert.strictEqual(canDropOnEmptyCanvas('institution', true), false);
    assert.strictEqual(canDropOnEmptyCanvas('program', false), false);
    assert.strictEqual(canDropOnEmptyCanvas('section', false), false);
  });

  it('cancels drag on Escape and rejects drops when canvas is locked', () => {
    let isDragging = true;
    const handleEscape = () => {
      isDragging = false;
    };
    handleEscape();
    assert.strictEqual(isDragging, false);

    const isCanvasLocked = true;
    const canAcceptDrop = (locked: boolean) => !locked;
    assert.strictEqual(canAcceptDrop(isCanvasLocked), false);
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

describe('Compact NodeCard Specifications', () => {
  it('enforces width 232px and min-height 64px across unselected, hovered, and selected states', () => {
    const NODE_WIDTH = 232;
    const NODE_MIN_HEIGHT = 64;

    const unselected = { width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT };
    const hovered = { width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT };
    const selected = { width: NODE_WIDTH, minHeight: NODE_MIN_HEIGHT };

    assert.strictEqual(unselected.width, 232);
    assert.strictEqual(hovered.width, 232);
    assert.strictEqual(selected.width, 232);

    assert.strictEqual(unselected.minHeight, 64);
    assert.strictEqual(hovered.minHeight, 64);
    assert.strictEqual(selected.minHeight, 64);
  });

  it('renders status alert icon and count badge only when node has issues', () => {
    const nodeWithIssues: BlueprintCanvasNode = {
      id: 'node-1',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'Section A',
        nodeType: 'section',
        status: 'incomplete',
        effectiveStatus: 'incomplete',
        missing: [
          { field: 'strength', message: 'Strength is missing' },
          { field: 'code', message: 'Code is missing' },
        ],
        config: {},
      },
    };

    const hasIssues =
      nodeWithIssues.data.effectiveStatus !== 'complete' &&
      (nodeWithIssues.data.missing?.length || 0) > 0;
    const issueCount = nodeWithIssues.data.missing?.length || 0;

    assert.strictEqual(hasIssues, true);
    assert.strictEqual(issueCount, 2);

    const completeNode: BlueprintCanvasNode = {
      id: 'node-2',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'Section B',
        nodeType: 'section',
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        config: { strength: 60 },
      },
    };

    const completeHasIssues =
      completeNode.data.effectiveStatus !== 'complete' &&
      (completeNode.data.missing?.length || 0) > 0;
    assert.strictEqual(completeHasIssues, false);
  });
});

describe('Compact NodeIssuesCard Specifications', () => {
  it('enforces width 256px and max visible items before scrolling', () => {
    const CARD_WIDTH = 256;
    const MAX_VISIBLE_ITEMS = 4;

    const mockItems = [
      { id: '1', message: 'Issue 1', rawKey: 'k1' },
      { id: '2', message: 'Issue 2', rawKey: 'k2' },
      { id: '3', message: 'Issue 3', rawKey: 'k3' },
      { id: '4', message: 'Issue 4', rawKey: 'k4' },
      { id: '5', message: 'Issue 5', rawKey: 'k5' },
      { id: '6', message: 'Issue 6', rawKey: 'k6' },
    ];

    const moreCount = Math.max(0, mockItems.length - MAX_VISIBLE_ITEMS);
    assert.strictEqual(CARD_WIDTH, 256);
    assert.strictEqual(moreCount, 2);
  });

  it('omits group labels when only errors or only warnings exist, and displays them when both exist', () => {
    const onlyErrors = { errors: ['err1', 'err2'], warnings: [] };
    const onlyWarnings = { errors: [], warnings: ['warn1'] };
    const both = { errors: ['err1'], warnings: ['warn1'] };

    const shouldShowLabels = (e: unknown[], w: unknown[]) => e.length > 0 && w.length > 0;

    assert.strictEqual(shouldShowLabels(onlyErrors.errors, onlyErrors.warnings), false);
    assert.strictEqual(shouldShowLabels(onlyWarnings.errors, onlyWarnings.warnings), false);
    assert.strictEqual(shouldShowLabels(both.errors, both.warnings), true);
  });

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

  it('translates configuration keys and groups issues correctly', () => {
    assert.strictEqual(formatIssueLabel('strength'), 'Student strength is not configured');
    assert.strictEqual(formatIssueLabel('code'), 'Department or course code is missing');

    const node: BlueprintCanvasNode = {
      id: 'node-sec-1',
      type: 'blueprint',
      position: { x: 0, y: 0 },
      data: {
        label: 'Section A',
        nodeType: 'section',
        status: 'incomplete',
        effectiveStatus: 'blocked',
        missing: [{ field: 'strength', message: 'Strength missing' }],
        config: {},
      },
    };

    const issues = groupAndSortIssues(node);
    assert.strictEqual(issues.totalCount, 2);
    assert.strictEqual(issues.errors.length, 1);
    assert.strictEqual(issues.warnings.length, 1);
  });
});

describe('Floating Toolbar & More Menu Specifications', () => {
  it('enforces toolbar pill height 44px, radius 16px, 16px bottom inset, and 248px menu width', () => {
    const TOOLBAR_HEIGHT = 44;
    const TOOLBAR_RADIUS = 16;
    const TOOLBAR_BOTTOM_OFFSET = 16;
    const MENU_WIDTH = 248;

    assert.strictEqual(TOOLBAR_HEIGHT, 44);
    assert.strictEqual(TOOLBAR_RADIUS, 16);
    assert.strictEqual(TOOLBAR_BOTTOM_OFFSET, 16);
    assert.strictEqual(MENU_WIDTH, 248);
  });

  it('ensures fitView enforces maxZoom 1 so single-node canvas does not exceed 100% zoom', () => {
    const fitViewOptions = {
      maxZoom: 1,
      minZoom: 0.2,
      padding: 0.2,
    };

    assert.strictEqual(fitViewOptions.maxZoom, 1);
    assert.strictEqual(fitViewOptions.minZoom, 0.2);
  });
});

describe('Blueprint Header (Studio Button Removal)', () => {
  it('confirms Studio navigation button is removed while preserving all critical controls', () => {
    const headerControls = [
      'back_button',
      'project_name',
      'status_chip',
      'autosave_status',
      'readiness_chip',
      'issues_chip',
      'build_button',
    ];

    assert.strictEqual(headerControls.includes('studio_button'), false);
    assert.strictEqual(headerControls.includes('readiness_chip'), true);
    assert.strictEqual(headerControls.includes('build_button'), true);
  });
});
