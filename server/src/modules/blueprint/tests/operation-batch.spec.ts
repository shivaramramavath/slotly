import { OperationService } from '../services/operation.service';
import { GateChain } from '../gates/gate-chain';
import { CompletionService } from '../services/completion.service';
import { NodeTypeRegistry } from '../model/node-type.registry';
import type { BlueprintNodeDto, BlueprintOp } from '@slotly/contracts';

describe('OperationService.applyBatch & Topological Sort', () => {
  let operationService: OperationService;
  let registry: NodeTypeRegistry;

  beforeEach(() => {
    registry = new NodeTypeRegistry();
    const completion = new CompletionService(registry);
    const gateChain = new GateChain(registry);
    operationService = new OperationService(gateChain, completion);
  });

  it('should sort operations topologically so parent nodes are added before children', () => {
    const ops: BlueprintOp[] = [
      {
        opId: 'op_child_prog',
        type: 'add_node',
        targetId: 'prog_1',
        node: { type: 'program', parentId: 'dept_1' },
        parentId: 'dept_1',
      },
      {
        opId: 'op_parent_dept',
        type: 'add_node',
        targetId: 'dept_1',
        node: { type: 'department', parentId: 'inst_1' },
        parentId: 'inst_1',
      },
      {
        opId: 'op_edge',
        type: 'add_edge',
        targetId: 'edge_1',
        edge: { source: 'dept_1', target: 'prog_1' },
      },
    ];

    const sorted = operationService.topologicalSort(ops);
    expect(sorted[0]?.targetId).toBe('dept_1');
    expect(sorted[1]?.targetId).toBe('prog_1');
    expect(sorted[2]?.targetId).toBe('edge_1');
  });

  it('should skip dependent operations when parent operation fails (G6 Skip Cascade)', async () => {
    // Current graph has only an incomplete institution
    const currentNodes: BlueprintNodeDto[] = [
      {
        id: 'inst_1',
        projectId: 'p1',
        type: 'institution',
        parentId: null,
        position: { x: 0, y: 0 },
        data: { name: 'Incomplete' }, // missing code and periodConfig
        locked: false,
        hidden: false,
        status: 'incomplete',
        missing: [{ field: 'code', message: 'Missing code' }],
        effectiveStatus: 'incomplete',
      },
    ];

    // Batch contains adding department under incomplete institution, and adding program under that department
    const batchOps: BlueprintOp[] = [
      {
        opId: 'op_dept',
        type: 'add_node',
        targetId: 'dept_1',
        node: {
          type: 'department',
          parentId: 'inst_1',
          data: { name: 'CS', code: 'CS' },
        },
        parentId: 'inst_1',
      },
      {
        opId: 'op_prog',
        type: 'add_node',
        targetId: 'prog_1',
        node: {
          type: 'program',
          parentId: 'dept_1',
          data: { name: 'BTech', durationYears: 4 },
        },
        parentId: 'dept_1',
      },
    ];

    const result = await operationService.applyBatch(
      batchOps,
      currentNodes,
      [],
      { id: 'p1', status: 'draft', isLocked: false, isDeleted: false },
    );

    // 1. Department fails ParentCompleteGate because institution is incomplete
    expect(result.applied).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);

    expect(result.skipped[0]?.opId).toBe('op_dept');
    expect(result.skipped[0]?.reasonCode).toBe('PARENT_INCOMPLETE');

    // 2. Program is skipped automatically via skip propagation (G6) without running the gate!
    expect(result.skipped[1]?.opId).toBe('op_prog');
    expect(result.skipped[1]?.reasonCode).toBe('PARENT_INCOMPLETE');
  });
});
