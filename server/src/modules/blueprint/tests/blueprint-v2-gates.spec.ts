// Unit tests verifying Blueprint v2 gates: duplicate additions, ancestor required protection, impact checks, and assignment in pool.
import {
  AssignmentInPoolGate,
  PoolDuplicateGate,
  PoolImpactGate,
  PoolRequiredGate,
} from '../gates/blueprint-gates';
import { SectionCompletionRule } from '../model/rules/blueprint-completion.rules';
import type { BlueprintNodeDto } from '@slotly/contracts';
import type { GateContext } from '../gates/gate.interface';

describe('Blueprint v2 Gates', () => {
  describe('PoolDuplicateGate', () => {
    const gate = new PoolDuplicateGate();

    it('allows adding a resource not currently in node pool additions', () => {
      const node: BlueprintNodeDto = {
        id: 'dept-cs',
        projectId: 'p1',
        type: 'department',
        position: { x: 0, y: 0 },
        data: { name: 'CS' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [],
          exclusions: [],
        },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-1',
          type: 'update_node',
          targetId: 'dept-cs',
        },
        poolOperation: {
          projectId: 'p1',
          nodeId: 'dept-cs',
          op: 'pool:add',
          itemId: 'fac-1',
          kind: 'faculty',
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [node], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(true);
    });

    it('rejects adding a duplicate resource already in additions with POOL_DUPLICATE', () => {
      const node: BlueprintNodeDto = {
        id: 'dept-cs',
        projectId: 'p1',
        type: 'department',
        position: { x: 0, y: 0 },
        data: { name: 'CS' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'faculty',
              itemId: 'fac-1',
              required: false,
              pinned: false,
            },
          ],
          exclusions: [],
        },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-1',
          type: 'update_node',
          targetId: 'dept-cs',
        },
        poolOperation: {
          projectId: 'p1',
          nodeId: 'dept-cs',
          op: 'pool:add',
          itemId: 'fac-1',
          kind: 'faculty',
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [node], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('POOL_DUPLICATE');
    });
  });

  describe('PoolRequiredGate', () => {
    const gate = new PoolRequiredGate();

    it('allows excluding items when not marked required by any ancestor', () => {
      const parentNode: BlueprintNodeDto = {
        id: 'dept-cs',
        projectId: 'p1',
        type: 'department',
        position: { x: 0, y: 0 },
        data: { name: 'CS' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'faculty',
              itemId: 'fac-1',
              required: false, // not required
              pinned: false,
            },
          ],
          exclusions: [],
        },
      };

      const childNode: BlueprintNodeDto = {
        id: 'sec-a',
        projectId: 'p1',
        type: 'section',
        parentId: 'dept-cs',
        position: { x: 0, y: 100 },
        data: { name: 'Sec A' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: { additions: [], exclusions: [] },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-1',
          type: 'update_node',
          targetId: 'sec-a',
        },
        poolOperation: {
          projectId: 'p1',
          nodeId: 'sec-a',
          op: 'pool:exclude',
          itemId: 'fac-1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [parentNode, childNode], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(true);
    });

    it('rejects excluding an item that was marked required by an ancestor with POOL_ITEM_REQUIRED', () => {
      const parentNode: BlueprintNodeDto = {
        id: 'dept-cs',
        projectId: 'p1',
        type: 'department',
        position: { x: 0, y: 0 },
        data: { name: 'CS' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'faculty',
              itemId: 'fac-1',
              required: true, // required by parent
              pinned: false,
            },
          ],
          exclusions: [],
        },
      };

      const childNode: BlueprintNodeDto = {
        id: 'sec-a',
        projectId: 'p1',
        type: 'section',
        parentId: 'dept-cs',
        position: { x: 0, y: 100 },
        data: { name: 'Sec A' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: { additions: [], exclusions: [] },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-2',
          type: 'update_node',
          targetId: 'sec-a',
        },
        poolOperation: {
          projectId: 'p1',
          nodeId: 'sec-a',
          op: 'pool:exclude',
          itemId: 'fac-1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [parentNode, childNode], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('POOL_ITEM_REQUIRED');
    });
  });

  describe('PoolImpactGate', () => {
    const gate = new PoolImpactGate();

    it('rejects excluding a resource while it is assigned to an active class with POOL_ITEM_IN_USE', () => {
      const secNode: BlueprintNodeDto = {
        id: 'sec-a',
        projectId: 'p1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { name: 'Sec A' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'subject',
              itemId: 'sub-os',
              required: false,
              pinned: false,
            },
          ],
          exclusions: [],
        },
        assignments: [
          {
            id: 'as-1',
            subjectId: 'sub-os',
            facultyId: 'fac-1',
            periodsPerWeek: 4,
            isLab: false,
            labDuration: 1,
          },
        ],
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-3',
          type: 'update_node',
          targetId: 'sec-a',
        },
        poolOperation: {
          projectId: 'p1',
          nodeId: 'sec-a',
          op: 'pool:exclude',
          itemId: 'sub-os',
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [secNode], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('POOL_ITEM_IN_USE');
    });
  });

  describe('AssignmentInPoolGate', () => {
    const gate = new AssignmentInPoolGate();

    it('allows assigning items present in effective resource pool', () => {
      const node: BlueprintNodeDto = {
        id: 'sec-a',
        projectId: 'p1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { name: 'Sec A' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'subject',
              itemId: 'sub-os',
              required: false,
              pinned: false,
            },
            {
              id: 'e2',
              kind: 'faculty',
              itemId: 'fac-1',
              required: false,
              pinned: false,
            },
          ],
          exclusions: [],
        },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-4',
          type: 'update_node',
          targetId: 'sec-a',
        },
        assignmentOperation: {
          projectId: 'p1',
          nodeId: 'sec-a',
          op: 'assignment:upsert',
          assignment: {
            id: 'as-1',
            subjectId: 'sub-os',
            facultyId: 'fac-1',
            periodsPerWeek: 4,
            isLab: false,
            labDuration: 1,
          },
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [node], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(true);
    });

    it('rejects assigning a subject not present in pool with ASSIGNMENT_NOT_IN_POOL', () => {
      const node: BlueprintNodeDto = {
        id: 'sec-a',
        projectId: 'p1',
        type: 'section',
        position: { x: 0, y: 0 },
        data: { name: 'Sec A' },
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
        locked: false,
        hidden: false,
        pool: {
          additions: [
            {
              id: 'e1',
              kind: 'subject',
              itemId: 'sub-os',
              required: false,
              pinned: false,
            },
          ],
          exclusions: [],
        },
      };

      const ctx: GateContext = {
        operation: {
          opId: 'op-5',
          type: 'update_node',
          targetId: 'sec-a',
        },
        assignmentOperation: {
          projectId: 'p1',
          nodeId: 'sec-a',
          op: 'assignment:upsert',
          assignment: {
            id: 'as-1',
            subjectId: 'sub-foreign', // not in pool!
            periodsPerWeek: 4,
            isLab: false,
            labDuration: 1,
          },
        },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [node], edges: [] },
      };

      const res = gate.evaluate(ctx);
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('ASSIGNMENT_NOT_IN_POOL');
    });
  });

  describe('SectionCompletionRule with v2 assignments and pools', () => {
    const rule = new SectionCompletionRule();

    it('completes when name and strength > 0 and assignments are valid', () => {
      const res = rule.compute(
        { name: 'Section A', strength: 60 },
        {
          node: {
            id: 'sec-a',
            projectId: 'p1',
            type: 'section',
            position: { x: 0, y: 0 },
            data: { name: 'Section A', strength: 60 },
            status: 'incomplete',
            effectiveStatus: 'incomplete',
            missing: [],
            locked: false,
            hidden: false,
            assignments: [
              {
                id: 'as-1',
                subjectId: 'sub-1',
                periodsPerWeek: 4,
                isLab: false,
                labDuration: 1,
              },
            ],
          },
        },
      );

      expect(res.status).toBe('complete');
      expect(res.missing).toHaveLength(0);
    });

    it('marks incomplete when assignment has invalid periodsPerWeek <= 0', () => {
      const res = rule.compute(
        { name: 'Section A', strength: 60 },
        {
          node: {
            id: 'sec-a',
            projectId: 'p1',
            type: 'section',
            position: { x: 0, y: 0 },
            data: { name: 'Section A', strength: 60 },
            status: 'incomplete',
            effectiveStatus: 'incomplete',
            missing: [],
            locked: false,
            hidden: false,
            assignments: [
              {
                id: 'as-1',
                subjectId: 'sub-1',
                periodsPerWeek: 0, // invalid!
                isLab: false,
                labDuration: 1,
              },
            ],
          },
        },
      );

      expect(res.status).toBe('incomplete');
      expect(
        res.missing.some((m) => m.field === 'assignments[0].periodsPerWeek'),
      ).toBe(true);
    });
  });
});
