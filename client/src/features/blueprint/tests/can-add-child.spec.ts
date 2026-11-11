// Unit tests for canAddChild pure validation function and getLibraryTypesState selector.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canAddChild, getLibraryTypesState } from '../can-add-child';
import type { BlueprintCanvasNode } from '../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

function createMockNode(
  id: string,
  type: BlueprintNodeType,
  label: string,
  status: 'complete' | 'incomplete' | 'empty' | 'blocked' = 'complete',
  missing: Array<{ field: string; message: string }> = [],
): BlueprintCanvasNode {
  return {
    id,
    type: 'blueprint',
    position: { x: 0, y: 0 },
    data: {
      label,
      nodeType: type,
      status,
      effectiveStatus: status,
      missing,
      config: {},
    },
  };
}

describe('canAddChild: Constraint-driven Blueprint Gating', () => {
  it('allows institution root when canvas is empty', () => {
    const res = canAddChild([], null, 'institution');
    assert.equal(res.ok, true);
    assert.equal(res.code, 'ok');
  });

  it('rejects second institution with cardinality error', () => {
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const res = canAddChild([inst], null, 'institution');
    assert.equal(res.ok, false);
    assert.equal(res.code, 'cardinality');
  });

  it('rejects adding when canvas is locked', () => {
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const res = canAddChild([inst], 'inst_1', 'department', true);
    assert.equal(res.ok, false);
    assert.equal(res.code, 'locked');
  });

  it('rejects child addition when parent is incomplete', () => {
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'incomplete', [
      { field: 'workingDays', message: 'Working days required' },
    ]);
    const res = canAddChild([inst], 'inst_1', 'department');
    assert.equal(res.ok, false);
    assert.equal(res.code, 'parent-incomplete');
    assert.match(res.reason || '', /Complete Main Campus first/);
    assert.equal(res.fix?.action, 'open-config');
    assert.equal(res.fix?.targetNodeId, 'inst_1');
  });

  it('allows department under complete institution', () => {
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const res = canAddChild([inst], 'inst_1', 'department');
    assert.equal(res.ok, true);
    assert.equal(res.code, 'ok');
  });

  it('rejects invalid hierarchy edge (e.g. section under institution)', () => {
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const res = canAddChild([inst], 'inst_1', 'section');
    assert.equal(res.ok, false);
    assert.equal(res.code, 'invalid-parent-type');
  });

  it('rejects addition without parent when parent type is missing from canvas', () => {
    // Only institution exists, trying to add program without department
    const inst = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const res = canAddChild([inst], null, 'program');
    assert.equal(res.ok, false);
    assert.equal(res.code, 'parent-missing');
    assert.match(res.reason || '', /Add a Department first/);
    assert.equal(res.fix?.action, 'focus-library');
    assert.equal(res.fix?.targetType, 'department');
  });

  it('allows batch under complete section', () => {
    const sec = createMockNode('sec_1', 'section', 'Section A', 'complete');
    const res = canAddChild([sec], 'sec_1', 'batch');
    assert.equal(res.ok, true);
    assert.equal(res.code, 'ok');
  });

  it('table-driven validation across all 7 node pairs', () => {
    const pairs: Array<{ parent: string; child: string }> = [
      { parent: 'institution', child: 'department' },
      { parent: 'department', child: 'program' },
      { parent: 'program', child: 'academicYear' },
      { parent: 'academicYear', child: 'semester' },
      { parent: 'semester', child: 'section' },
      { parent: 'section', child: 'batch' },
    ];

    for (const { parent, child } of pairs) {
      const pNode = createMockNode(`p_${parent}`, parent as BlueprintNodeType, `Mock ${parent}`, 'complete');
      const res = canAddChild([pNode], pNode.id, child as BlueprintNodeType);
      assert.equal(res.ok, true, `Expected ${child} to be allowed under complete ${parent}`);

      // Incomplete parent check
      const pIncomplete = createMockNode(`p_${parent}`, parent as BlueprintNodeType, `Mock ${parent}`, 'incomplete', [
        { field: 'name', message: 'Name missing' },
      ]);
      const resIncomplete = canAddChild([pIncomplete], pIncomplete.id, child as BlueprintNodeType);
      assert.equal(
        resIncomplete.ok,
        false,
        `Expected ${child} to be rejected under incomplete ${parent}`,
      );
      assert.equal(resIncomplete.code, 'parent-incomplete');
    }
  });
});

describe('getLibraryTypesState: Selector', () => {
  it('updates enabled states dynamically when parent becomes complete', () => {
    const instIncomplete = createMockNode('inst_1', 'institution', 'Main Campus', 'incomplete', [
      { field: 'code', message: 'Code missing' },
    ]);
    const state1 = getLibraryTypesState([instIncomplete], null);
    assert.equal(state1.department.enabled, false);
    assert.equal(state1.department.code, 'parent-incomplete');

    const instComplete = createMockNode('inst_1', 'institution', 'Main Campus', 'complete');
    const state2 = getLibraryTypesState([instComplete], null);
    assert.equal(state2.department.enabled, true);
    assert.equal(state2.department.code, 'ok');
  });

  it('disables child types when parent node is deleted', () => {
    const state = getLibraryTypesState([], null);
    assert.equal(state.institution.enabled, true);
    assert.equal(state.department.enabled, false);
    assert.equal(state.department.code, 'parent-missing');
  });
});
