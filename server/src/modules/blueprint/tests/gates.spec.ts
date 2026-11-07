import { NodeTypeRegistry } from '../model/node-type.registry';
import {
  CapacityGate,
  ConnectionEndpointGate,
  DuplicateNameGate,
  NoCycleGate,
  ParentCompleteGate,
  ParentExistsGate,
  ParentTypeAllowedGate,
  PermissionGate,
  ProjectNotLockedGate,
  QualificationGate,
  SingleParentGate,
} from '../gates/blueprint-gates';
import type { GateContext } from '../gates/gate.interface';

describe('Blueprint GateChain & Gates', () => {
  const registry = new NodeTypeRegistry();

  describe('ProjectNotLockedGate', () => {
    const gate = new ProjectNotLockedGate();

    it('should allow operation when project is in draft status and not locked', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'draft', isLocked: false },
        graph: { nodes: [], edges: [] },
      });
      expect(res.allowed).toBe(true);
    });

    it('should reject operation when project is locked', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'draft', isLocked: true },
        graph: { nodes: [], edges: [] },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PROJECT_LOCKED');
    });

    it('should reject operation when project is archived', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'archived' },
        graph: { nodes: [], edges: [] },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PROJECT_LOCKED');
    });
  });

  describe('PermissionGate', () => {
    const gate = new PermissionGate();

    it('should allow admin and designer roles', () => {
      const res1 = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'draft' },
        user: { id: 'u1', role: 'ADMIN' },
        graph: { nodes: [], edges: [] },
      });
      expect(res1.allowed).toBe(true);

      const res2 = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'draft' },
        user: { id: 'u2', role: 'DESIGNER' },
        graph: { nodes: [], edges: [] },
      });
      expect(res2.allowed).toBe(true);
    });

    it('should reject student without BLUEPRINT_EDIT permission', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'node_1' },
        project: { id: 'p1', status: 'draft' },
        user: { id: 'u3', role: 'STUDENT', permissions: [] },
        graph: { nodes: [], edges: [] },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PERMISSION_DENIED');
    });
  });

  describe('ParentExistsGate', () => {
    const gate = new ParentExistsGate();

    it('should allow node addition when parent exists', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'child_1', parentId: 'parent_1' },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'parent_1',
              projectId: 'p1',
              type: 'institution',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(true);
    });

    it('should reject node addition when parent does not exist', () => {
      const res = gate.evaluate({
        operation: { opId: '1', type: 'add_node', targetId: 'child_1', parentId: 'nonexistent' },
        project: { id: 'p1', status: 'draft' },
        graph: { nodes: [], edges: [] },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PARENT_MISSING');
    });
  });

  describe('ParentTypeAllowedGate', () => {
    const gate = new ParentTypeAllowedGate(registry);

    it('should allow department under institution', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'dept_1',
          node: { type: 'department' },
          parentId: 'inst_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'inst_1',
              projectId: 'p1',
              type: 'institution',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(true);
    });

    it('should reject section directly under institution', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'sec_1',
          node: { type: 'section' },
          parentId: 'inst_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'inst_1',
              projectId: 'p1',
              type: 'institution',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PARENT_TYPE_NOT_ALLOWED');
    });
  });

  describe('ParentCompleteGate (G1 Creation Gate)', () => {
    const gate = new ParentCompleteGate(registry);

    it('should allow child creation under a complete parent', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'dept_1',
          node: { type: 'department' },
          parentId: 'inst_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'inst_1',
              projectId: 'p1',
              type: 'institution',
              position: { x: 0, y: 0 },
              data: { name: 'Full Institution' },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(true);
    });

    it('should reject child creation when parent is incomplete (G1 gate)', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'dept_1',
          node: { type: 'department' },
          parentId: 'inst_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'inst_1',
              projectId: 'p1',
              type: 'institution',
              position: { x: 0, y: 0 },
              data: { name: 'Incomplete Inst' },
              locked: false,
              hidden: false,
              status: 'incomplete',
              missing: [{ field: 'code', message: 'Institution code required' }],
              effectiveStatus: 'incomplete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('PARENT_INCOMPLETE');
      expect(res.fixHint?.field).toBe('code');
    });
  });

  describe('SingleParentGate', () => {
    const gate = new SingleParentGate();

    it('should reject adding a second incoming hierarchy edge to a node', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_edge',
          targetId: 'edge_2',
          edge: { source: 'parent_2', target: 'child_1', type: 'hierarchy' },
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'child_1',
              projectId: 'p1',
              type: 'program',
              parentId: 'parent_1',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [{ id: 'edge_1', projectId: 'p1', source: 'parent_1', target: 'child_1', type: 'hierarchy' }],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('SINGLE_PARENT_VIOLATION');
    });
  });

  describe('NoCycleGate', () => {
    const gate = new NoCycleGate();

    it('should reject connecting a node to itself', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_edge',
          targetId: 'edge_1',
          edge: { source: 'node_1', target: 'node_1', type: 'hierarchy' },
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'node_1',
              projectId: 'p1',
              type: 'department',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('CYCLE');
    });
  });

  describe('DuplicateNameGate', () => {
    const gate = new DuplicateNameGate();

    it('should reject creating sibling with identical name under same parent', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'dept_new',
          node: { type: 'department', data: { name: 'Computer Science' } },
          parentId: 'inst_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'dept_existing',
              projectId: 'p1',
              type: 'department',
              parentId: 'inst_1',
              position: { x: 0, y: 0 },
              data: { name: 'Computer Science' },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('DUPLICATE_NAME');
    });
  });

  describe('CapacityGate', () => {
    const gate = new CapacityGate();

    it('should reject batch when sum of batch sizes exceeds section strength', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_node',
          targetId: 'batch_2',
          node: { type: 'batch', data: { size: 35 } },
          parentId: 'sec_1',
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'sec_1',
              projectId: 'p1',
              type: 'section',
              position: { x: 0, y: 0 },
              data: { strength: 60 },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
            {
              id: 'batch_1',
              projectId: 'p1',
              type: 'batch',
              parentId: 'sec_1',
              position: { x: 0, y: 0 },
              data: { size: 30 },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('CAPACITY_EXCEEDED');
    });
  });

  describe('ConnectionEndpointGate (G2 Connection Gate)', () => {
    const gate = new ConnectionEndpointGate();

    it('should allow edge between complete endpoints', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_edge',
          targetId: 'edge_1',
          edge: { source: 'node_a', target: 'node_b', type: 'hierarchy' },
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'node_a',
              projectId: 'p1',
              type: 'academicYear',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
            {
              id: 'node_b',
              projectId: 'p1',
              type: 'semester',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(true);
    });

    it('should reject edge if either endpoint is incomplete (G2 gate)', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_edge',
          targetId: 'edge_1',
          edge: { source: 'node_a', target: 'node_b', type: 'hierarchy' },
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'node_a',
              projectId: 'p1',
              type: 'academicYear',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
            {
              id: 'node_b',
              projectId: 'p1',
              type: 'semester',
              position: { x: 0, y: 0 },
              data: {},
              locked: false,
              hidden: false,
              status: 'incomplete',
              missing: [{ field: 'endDate', message: 'End date required' }],
              effectiveStatus: 'incomplete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('ENDPOINT_INCOMPLETE');
    });
  });

  describe('QualificationGate', () => {
    const gate = new QualificationGate();

    it('should reject connecting unqualified faculty to subject', () => {
      const res = gate.evaluate({
        operation: {
          opId: '1',
          type: 'add_edge',
          targetId: 'edge_fac_sub',
          edge: { source: 'fac_1', target: 'sub_1', type: 'assignment' },
        },
        project: { id: 'p1', status: 'draft' },
        graph: {
          nodes: [
            {
              id: 'fac_1',
              projectId: 'p1',
              type: 'faculty',
              position: { x: 0, y: 0 },
              data: { name: 'Dr. Jones', subjectIds: ['sub_physics'] },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
            {
              id: 'sub_1',
              projectId: 'p1',
              type: 'subjectAssignment',
              position: { x: 0, y: 0 },
              data: { subjectId: 'sub_algorithms', name: 'Algorithms' },
              locked: false,
              hidden: false,
              status: 'complete',
              missing: [],
              effectiveStatus: 'complete',
            },
          ],
          edges: [],
        },
      });
      expect(res.allowed).toBe(false);
      expect(res.reasonCode).toBe('NOT_QUALIFIED');
    });
  });
});
