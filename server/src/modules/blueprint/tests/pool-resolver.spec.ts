// Unit tests verifying hierarchical pool resolution, additions, exclusions, required items, and where-used queries.
import { PoolResolverService } from '../services/pool-resolver.service';
import type { BlueprintNodeDto } from '@slotly/contracts';

describe('PoolResolverService', () => {
  let service: PoolResolverService;

  const mockFacultyRepo = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === 'fac-1') {
        return Promise.resolve({
          id: 'fac-1',
          name: 'Dr. Alan Turing',
          code: 'AT',
          departmentId: 'dept-cs',
        });
      }
      if (id === 'fac-2') {
        return Promise.resolve({
          id: 'fac-2',
          name: 'Prof. Grace Hopper',
          code: 'GH',
          departmentId: 'dept-cs',
        });
      }
      return Promise.resolve(null);
    }),
  };

  const mockSubjectRepo = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === 'sub-1') {
        return Promise.resolve({
          id: 'sub-1',
          name: 'Operating Systems',
          code: 'CS301',
          departmentId: 'dept-cs',
        });
      }
      if (id === 'sub-2') {
        return Promise.resolve({
          id: 'sub-2',
          name: 'Algorithms',
          code: 'CS302',
          departmentId: 'dept-cs',
        });
      }
      return Promise.resolve(null);
    }),
  };

  const mockRoomRepo = {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === 'room-1') {
        return Promise.resolve({
          id: 'room-1',
          name: 'Lab 101',
          code: 'L101',
          departmentId: 'dept-cs',
        });
      }
      return Promise.resolve(null);
    }),
  };

  beforeEach(() => {
    service = new PoolResolverService(
      mockFacultyRepo as any,
      mockSubjectRepo as any,
      mockRoomRepo as any,
    );
  });

  it('resolves own direct additions on root node', async () => {
    const rootNode: BlueprintNodeDto = {
      id: 'inst-1',
      projectId: 'proj-1',
      type: 'institution',
      position: { x: 0, y: 0 },
      data: { name: 'Main Univ' },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'entry-1',
            kind: 'faculty',
            itemId: 'fac-1',
            required: false,
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const resolved = await service.resolveEffectivePool('inst-1', [rootNode]);
    expect(resolved.faculty).toHaveLength(1);
    expect(resolved.faculty[0]!.itemId).toBe('fac-1');
    expect(resolved.faculty[0]!.name).toBe('Dr. Alan Turing');
    expect(resolved.faculty[0]!.sourceNodeId).toBe('inst-1');
  });

  it('inherits parent pool items down the hierarchy', async () => {
    const parentNode: BlueprintNodeDto = {
      id: 'dept-cs',
      projectId: 'proj-1',
      type: 'department',
      position: { x: 0, y: 0 },
      data: { name: 'Computer Science' },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'e-1',
            kind: 'faculty',
            itemId: 'fac-1',
            required: false,
            pinned: false,
          },
          {
            id: 'e-2',
            kind: 'subject',
            itemId: 'sub-1',
            required: false,
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const sectionNode: BlueprintNodeDto = {
      id: 'sec-a',
      projectId: 'proj-1',
      type: 'section',
      parentId: 'dept-cs',
      position: { x: 0, y: 100 },
      data: { name: 'Section A', strength: 60 },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'e-3',
            kind: 'room',
            itemId: 'room-1',
            required: false,
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const resolved = await service.resolveEffectivePool('sec-a', [
      parentNode,
      sectionNode,
    ]);

    expect(resolved.faculty).toHaveLength(1);
    expect(resolved.faculty[0]!.itemId).toBe('fac-1');
    expect(resolved.subjects).toHaveLength(1);
    expect(resolved.subjects[0]!.itemId).toBe('sub-1');
    expect(resolved.rooms).toHaveLength(1);
    expect(resolved.rooms[0]!.itemId).toBe('room-1');
  });

  it('respects child exclusions for non-required ancestor items', async () => {
    const parentNode: BlueprintNodeDto = {
      id: 'dept-cs',
      projectId: 'proj-1',
      type: 'department',
      position: { x: 0, y: 0 },
      data: { name: 'Computer Science' },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'e-1',
            kind: 'faculty',
            itemId: 'fac-1',
            required: false,
            pinned: false,
          },
          {
            id: 'e-2',
            kind: 'faculty',
            itemId: 'fac-2',
            required: false,
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const sectionNode: BlueprintNodeDto = {
      id: 'sec-a',
      projectId: 'proj-1',
      type: 'section',
      parentId: 'dept-cs',
      position: { x: 0, y: 100 },
      data: { name: 'Section A', strength: 60 },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [],
        exclusions: ['fac-2'],
      },
    };

    const resolved = await service.resolveEffectivePool('sec-a', [
      parentNode,
      sectionNode,
    ]);

    expect(resolved.faculty).toHaveLength(1);
    expect(resolved.faculty[0]!.itemId).toBe('fac-1');
  });

  it('prevents exclusion of ancestor required items', async () => {
    const parentNode: BlueprintNodeDto = {
      id: 'dept-cs',
      projectId: 'proj-1',
      type: 'department',
      position: { x: 0, y: 0 },
      data: { name: 'Computer Science' },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'e-1',
            kind: 'faculty',
            itemId: 'fac-1',
            required: true, // Ancestor Required!
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const sectionNode: BlueprintNodeDto = {
      id: 'sec-a',
      projectId: 'proj-1',
      type: 'section',
      parentId: 'dept-cs',
      position: { x: 0, y: 100 },
      data: { name: 'Section A', strength: 60 },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [],
        exclusions: ['fac-1'], // Child tries to exclude ancestor required item!
      },
    };

    const resolved = await service.resolveEffectivePool('sec-a', [
      parentNode,
      sectionNode,
    ]);

    // Item must still be present because ancestor required it
    expect(resolved.faculty).toHaveLength(1);
    expect(resolved.faculty[0]!.itemId).toBe('fac-1');
    expect(resolved.faculty[0]!.required).toBe(true);
  });

  it('finds where items are used across the blueprint', async () => {
    const deptNode: BlueprintNodeDto = {
      id: 'dept-cs',
      projectId: 'proj-1',
      type: 'department',
      position: { x: 0, y: 0 },
      data: { name: 'Computer Science' },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      pool: {
        additions: [
          {
            id: 'e-1',
            kind: 'faculty',
            itemId: 'fac-1',
            required: true,
            pinned: false,
          },
        ],
        exclusions: [],
      },
    };

    const sectionNode: BlueprintNodeDto = {
      id: 'sec-a',
      projectId: 'proj-1',
      type: 'section',
      parentId: 'dept-cs',
      position: { x: 0, y: 100 },
      data: { name: 'Section A', strength: 60 },
      status: 'complete',
      effectiveStatus: 'complete',
      missing: [],
      locked: false,
      hidden: false,
      assignments: [
        {
          id: 'as-1',
          subjectId: 'sub-1',
          facultyId: 'fac-1',
          periodsPerWeek: 4,
          isLab: false,
          labDuration: 1,
        },
      ],
    };

    const graph = {
      projectId: 'proj-1',
      revision: 1,
      nodes: [deptNode, sectionNode],
      edges: [],
    };

    const whereUsed = await service.getWhereUsed(
      'proj-1',
      'faculty',
      'fac-1',
      graph,
    );

    expect(whereUsed.length).toBeGreaterThanOrEqual(2);
    const deptUsage = whereUsed.find((u) => u.nodeId === 'dept-cs');
    const secUsage = whereUsed.find((u) => u.nodeId === 'sec-a');

    expect(deptUsage?.isDirectAddition).toBe(true);
    expect(secUsage?.isAssigned).toBe(true);
  });
});
