// Unit tests for inheritance snapshotting and createChildNode workflow.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getInheritedDataSnapshot } from '../inheritance';
import { createChildNode } from '../create-child-node';
import type { BlueprintCanvasNode, BlueprintCanvasEdge, Command } from '../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

function createMockNode(
  id: string,
  type: BlueprintNodeType,
  label: string,
  config: Record<string, unknown> = {},
  status: 'complete' | 'incomplete' = 'complete',
): BlueprintCanvasNode {
  return {
    id,
    type: 'blueprint',
    position: { x: 100, y: 100 },
    data: {
      label,
      nodeType: type,
      status,
      effectiveStatus: status,
      missing: [],
      config,
    },
  };
}

describe('getInheritedDataSnapshot: Inheritance Rules', () => {
  it('copies workingDays and period config from parent institution to department', () => {
    const inst = createMockNode('inst_1', 'institution', 'Stanford University', {
      workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      startTime: '08:30',
      periodDurationMinutes: 50,
      periodsPerDay: 6,
      name: 'Stanford University',
      code: 'STAN',
    });

    const snapshot = getInheritedDataSnapshot(inst, 'department');
    assert.deepEqual(snapshot['workingDays'], ['mon', 'tue', 'wed', 'thu', 'fri']);
    assert.equal(snapshot['startTime'], '08:30');
    assert.equal(snapshot['periodDurationMinutes'], 50);
    assert.equal(snapshot['periodsPerDay'], 6);

    // Identity fields must NEVER be inherited
    assert.equal(snapshot['name'], undefined);
    assert.equal(snapshot['code'], undefined);
    assert.equal(snapshot['id'], undefined);

    // Metadata recorded
    const meta = snapshot['_inheritedFrom'] as {
      parentId: string;
      parentLabel: string;
      parentType: string;
    };
    assert.equal(meta.parentId, 'inst_1');
    assert.equal(meta.parentLabel, 'Stanford University');
  });

  it('inherits resource pool from department down to section', () => {
    const dept = createMockNode('dept_1', 'department', 'Computer Science', {
      departmentId: 'dept_1',
      pool: {
        additions: [{ itemType: 'faculty', itemId: 'fac_1' }],
      },
    });

    const snapshot = getInheritedDataSnapshot(dept, 'section');
    assert.equal(snapshot['departmentId'], 'dept_1');
    assert.deepEqual(snapshot['pool'], {
      additions: [{ itemType: 'faculty', itemId: 'fac_1' }],
    });
  });
});

describe('createChildNode: Unified Creation with Undo/Redo', () => {
  it('creates node and edge, inherits data, and creates one undo command', async () => {
    const inst = createMockNode('inst_1', 'institution', 'IIT Delhi', {
      workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      startTime: '09:00',
    });

    let currentNodes: BlueprintCanvasNode[] = [inst];
    let currentEdges: BlueprintCanvasEdge[] = [];
    let selectedId: string | null = null;
    const registeredCommands: Command[] = [];
    let socketAddCalled = false;
    let socketEdgeCalled = false;

    const res = await createChildNode({
      parentId: 'inst_1',
      type: 'department',
      nodes: currentNodes,
      edges: currentEdges,
      projectId: 'proj_1',
      onAddNodeSocket: async () => {
        socketAddCalled = true;
        return { success: true };
      },
      onAddEdgeSocket: async () => {
        socketEdgeCalled = true;
        return { success: true };
      },
      onDeleteNodeSocket: async () => ({ success: true }),
      setNodes: (updater) => {
        currentNodes = updater(currentNodes);
      },
      setEdges: (updater) => {
        currentEdges = updater(currentEdges);
      },
      selectNode: (id) => {
        selectedId = id;
      },
      setActiveTab: () => {},
      pushCommand: (cmd) => {
        registeredCommands.push(cmd);
      },
    });

    assert.equal(res.success, true);
    assert.equal(socketAddCalled, true);
    assert.equal(socketEdgeCalled, true);
    assert.equal(currentNodes.length, 2);
    assert.equal(currentEdges.length, 1);
    assert.equal(currentEdges[0]?.source, 'inst_1');
    assert.equal(currentEdges[0]?.target, res.nodeId);
    assert.equal(selectedId, res.nodeId);

    // Verify inheritance in created node
    const createdDept = currentNodes.find((n) => n.id === res.nodeId);
    assert.deepEqual(createdDept?.data.config['workingDays'], ['mon', 'tue', 'wed', 'thu', 'fri']);
    assert.equal(createdDept?.data.config['startTime'], '09:00');

    // Verify single atomic undo command
    assert.equal(registeredCommands.length, 1);
    const undoCmd = registeredCommands[0]!;

    // Execute undo: both node and edge should be removed
    await undoCmd.undo();
    assert.equal(currentNodes.length, 1);
    assert.equal(currentEdges.length, 0);
  });
});
