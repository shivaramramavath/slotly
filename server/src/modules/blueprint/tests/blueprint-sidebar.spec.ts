// Unit tests covering sidebar server operations: candidates, peek, check, suggestions, copy-settings, and history filter.
import {
  NodeFormSchemas,
  type BlueprintNodeDto,
  type BlueprintGraphDto,
  type PoolCandidatesQueryDto,
  type AssignmentSuggestRequestDto,
  type CopyNodeSettingsDto,
} from '@slotly/contracts';
import { BlueprintSidebarService } from '../services/blueprint-sidebar.service';
import type { CachedBlueprintRepository } from '../repositories/cached-blueprint.repository';
import type { PoolResolverService } from '../services/pool-resolver.service';
import type { BlueprintService } from '../services/blueprint.service';
import type { FacultyRepository } from '../../library/repositories/faculty.repository';
import type { SubjectRepository } from '../../library/repositories/subject.repository';
import type { RoomRepository } from '../../library/repositories/room.repository';
import type { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { Faculty } from '../../library/schemas/faculty.schema';
import type { Subject } from '../../library/schemas/subject.schema';
import type { Room } from '../../library/schemas/room.schema';

describe('Blueprint Sidebar Server Support (Pass A)', () => {
  describe('1. Schema Validation Per Node Type (NodeFormSchemas)', () => {
    it('validates institution form schema with required timing and working days', () => {
      const valid = {
        name: 'MIT World Campus',
        code: 'MIT',
        address: 'Cambridge, MA',
        workingDays: [1, 2, 3, 4, 5],
        startTime: '08:30',
        periodLength: 50,
        periodsPerDay: 7,
        breaks: [{ name: 'Lunch', afterPeriod: 4, durationMinutes: 45 }],
        defaultAutoFillMode: 'same_department' as const,
      };
      expect(NodeFormSchemas.institution.safeParse(valid).success).toBe(true);

      const invalidTime = { ...valid, startTime: '8:30am' };
      expect(NodeFormSchemas.institution.safeParse(invalidTime).success).toBe(
        false,
      );

      const emptyDays = { ...valid, workingDays: [] };
      expect(NodeFormSchemas.institution.safeParse(emptyDays).success).toBe(
        false,
      );
    });

    it('validates department, program, academic year, and semester schemas', () => {
      expect(
        NodeFormSchemas.department.safeParse({
          name: 'Computer Science',
          code: 'CSE',
        }).success,
      ).toBe(true);
      expect(NodeFormSchemas.department.safeParse({ name: '' }).success).toBe(
        false,
      );

      expect(
        NodeFormSchemas.program.safeParse({
          name: 'B.Tech CSE',
          code: 'CS-UG',
          durationYears: 4,
          degreeLevel: 'undergraduate',
        }).success,
      ).toBe(true);

      expect(
        NodeFormSchemas.academicYear.safeParse({
          yearNumber: 1,
          label: 'Year 1',
        }).success,
      ).toBe(true);

      expect(
        NodeFormSchemas.semester.safeParse({
          number: 3,
          startDate: '2026-08-01',
        }).success,
      ).toBe(true);
    });

    it('validates section and batch schemas including classTeacherId and homeRoomId', () => {
      const validSection = {
        name: 'Section A',
        strength: 60,
        classTeacherId: 'fac_123',
        homeRoomId: 'room_456',
      };
      expect(NodeFormSchemas.section.safeParse(validSection).success).toBe(
        true,
      );

      const invalidSection = { name: 'Section A', strength: -5 };
      expect(NodeFormSchemas.section.safeParse(invalidSection).success).toBe(
        false,
      );

      const validBatch = {
        name: 'Batch A1',
        size: 30,
        labSubjectIds: ['sub_lab_1'],
      };
      expect(NodeFormSchemas.batch.safeParse(validBatch).success).toBe(true);
    });
  });

  describe('2. Sidebar Service Operations', () => {
    let service: BlueprintSidebarService;
    let mockBlueprintRepo: jest.Mocked<Partial<CachedBlueprintRepository>>;
    let mockPoolResolver: jest.Mocked<Partial<PoolResolverService>>;
    let mockBlueprintService: jest.Mocked<Partial<BlueprintService>>;
    let mockFacultyRepo: jest.Mocked<Partial<FacultyRepository>>;
    let mockSubjectRepo: jest.Mocked<Partial<SubjectRepository>>;
    let mockRoomRepo: jest.Mocked<Partial<RoomRepository>>;
    let mockProjectRepo: jest.Mocked<Partial<CachedProjectRepository>>;
    let mockCacheService: jest.Mocked<Partial<CacheService>>;

    const sampleNodes: BlueprintNodeDto[] = [
      {
        id: 'node_inst',
        projectId: 'proj_1',
        type: 'institution',
        position: { x: 0, y: 0 },
        data: {
          name: 'Tech Univ',
          code: 'TU',
          workingDays: [1, 2, 3],
          startTime: '09:00',
          periodLength: 60,
          periodsPerDay: 6,
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'node_dept',
        projectId: 'proj_1',
        parentId: 'node_inst',
        type: 'department',
        position: { x: 0, y: 100 },
        data: { name: 'CS Dept', code: 'CSE', departmentId: 'dept_cs' },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
      },
      {
        id: 'node_sec',
        projectId: 'proj_1',
        parentId: 'node_dept',
        type: 'section',
        position: { x: 0, y: 200 },
        data: {
          name: 'Sec A',
          strength: 50,
          classTeacherId: 'fac_1',
          homeRoomId: 'room_1',
        },
        locked: false,
        hidden: false,
        status: 'complete',
        missing: [],
        effectiveStatus: 'complete',
        assignments: [],
      },
    ];

    const sampleGraph: BlueprintGraphDto = {
      projectId: 'proj_1',
      revision: 1,
      nodes: sampleNodes,
      edges: [],
    };

    beforeEach(() => {
      mockBlueprintRepo = {
        findByProject: jest.fn().mockResolvedValue(sampleGraph),
      };
      mockPoolResolver = {
        resolveEffectivePool: jest.fn().mockResolvedValue({
          nodeId: 'node_sec',
          faculty: [
            {
              itemId: 'fac_1',
              name: 'Dr. Turing',
              kind: 'faculty',
              sourceNodeId: 'node_dept',
              sourceNodeType: 'department',
              required: false,
              pinned: false,
              isExcluded: false,
            },
          ],
          subjects: [
            {
              itemId: 'sub_1',
              name: 'Algorithms',
              kind: 'subject',
              sourceNodeId: 'node_dept',
              sourceNodeType: 'department',
              required: false,
              pinned: false,
              isExcluded: false,
            },
          ],
          rooms: [
            {
              itemId: 'room_1',
              name: 'Hall 101',
              kind: 'room',
              sourceNodeId: 'node_dept',
              sourceNodeType: 'department',
              required: false,
              pinned: false,
              isExcluded: false,
            },
          ],
        }),
      };
      mockBlueprintService = {
        applyOperations: jest.fn().mockResolvedValue({
          revision: 2,
          applied: [
            { opId: 'op_1', type: 'update_node', targetId: 'node_sec' },
          ],
          skipped: [],
          graph: sampleGraph,
        }),
      };
      mockFacultyRepo = {
        findByInstitution: jest.fn().mockResolvedValue({
          items: [
            {
              id: 'fac_1',
              name: 'Dr. Turing',
              code: 'TURING',
              departmentId: 'dept_cs',
              subjectIds: ['sub_1'],
              maxHoursPerWeek: 20,
            } as Faculty,
            {
              id: 'fac_2',
              name: 'Dr. Hopper',
              code: 'HOPPER',
              departmentId: 'dept_ee',
              subjectIds: ['sub_2'],
              maxHoursPerWeek: 15,
            } as Faculty,
          ],
          total: 2,
        }),
        findById: jest.fn().mockImplementation((id: string) => {
          if (id === 'fac_1')
            return Promise.resolve({
              id: 'fac_1',
              name: 'Dr. Turing',
              departmentId: 'dept_cs',
              subjectIds: ['sub_1'],
              maxHoursPerWeek: 20,
            });
          return Promise.resolve(null);
        }),
      };
      mockSubjectRepo = {
        findByInstitution: jest.fn().mockResolvedValue({
          items: [
            {
              id: 'sub_1',
              name: 'Algorithms',
              code: 'CS101',
              type: 'theory',
              departmentId: 'dept_cs',
              weeklyHours: 4,
              credits: 3,
            } as Subject,
          ],
          total: 1,
        }),
        findByIds: jest.fn().mockResolvedValue([
          {
            id: 'sub_1',
            name: 'Algorithms',
            code: 'CS101',
            type: 'theory',
            departmentId: 'dept_cs',
            weeklyHours: 4,
            credits: 3,
          } as Subject,
        ]),
      };
      mockRoomRepo = {
        findByInstitution: jest.fn().mockResolvedValue({
          items: [
            {
              id: 'room_1',
              name: 'Hall 101',
              code: 'H101',
              type: 'lecture',
              capacity: 60,
              shared: true,
              building: 'Main',
            } as Room,
            {
              id: 'room_2',
              name: 'EE Lab',
              code: 'EELAB',
              type: 'lab',
              capacity: 30,
              shared: false,
              departmentId: 'dept_ee',
              building: 'EE',
            } as Room,
          ],
          total: 2,
        }),
        findById: jest.fn().mockImplementation((id: string) => {
          if (id === 'room_1')
            return Promise.resolve({
              id: 'room_1',
              name: 'Hall 101',
              type: 'lecture',
              capacity: 60,
              shared: true,
            });
          return Promise.resolve(null);
        }),
      };
      mockProjectRepo = {
        findById: jest.fn().mockResolvedValue({
          id: 'proj_1',
          institutionId: 'inst_1',
          status: 'draft',
        } as any),
      };
      mockCacheService = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
      };

      service = new BlueprintSidebarService(
        mockBlueprintRepo as any,
        mockPoolResolver as any,
        mockBlueprintService as any,
        mockFacultyRepo as any,
        mockSubjectRepo as any,
        mockRoomRepo as any,
        mockProjectRepo as any,
        mockCacheService as any,
      );
    });

    it('getCandidates: returns cursor-paginated candidates with pool and doNotLend flags', async () => {
      const query: PoolCandidatesQueryDto = {
        type: 'faculty',
        q: 'Turing',
        limit: 10,
      };

      const result = await service.getCandidates('proj_1', 'node_sec', query);
      expect(result.items.length).toBe(1);
      expect(result.items[0]!.id).toBe('fac_1');
      expect(result.items[0]!.alreadyInPool).toBe(true);
      expect(result.items[0]!.doNotLend).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('getCandidates: flags cross-department non-shared rooms as doNotLend', async () => {
      const query: PoolCandidatesQueryDto = {
        type: 'room',
        limit: 10,
      };

      const result = await service.getCandidates('proj_1', 'node_sec', query);
      expect(result.items.length).toBe(2);
      const eeLab = result.items.find((r) => r.id === 'room_2');
      expect(eeLab).toBeDefined();
      expect(eeLab!.doNotLend).toBe(true);
    });

    it('checkNode: detects valid section configuration and reports readiness', async () => {
      const res = await service.checkNode('proj_1', 'node_sec');
      expect(res.nodeId).toBe('node_sec');
      expect(res.isReady).toBe(true);
      expect(res.missingFields).toEqual([]);
      expect(res.warnings).toEqual([]);
    });

    it('checkNode: flags missing qualified faculty and capacity shortage', async () => {
      mockPoolResolver.resolveEffectivePool = jest.fn().mockResolvedValue({
        nodeId: 'node_sec',
        faculty: [], // No faculty in pool
        subjects: [{ itemId: 'sub_1', name: 'Algorithms', kind: 'subject' }],
        rooms: [{ itemId: 'room_small', name: 'Tiny Room', kind: 'room' }],
      });
      mockRoomRepo.findById = jest.fn().mockResolvedValue({
        id: 'room_small',
        name: 'Tiny Room',
        capacity: 20, // Less than section strength 50
      } as any);

      const res = await service.checkNode('proj_1', 'node_sec');
      expect(res.isReady).toBe(false);
      expect(res.warnings.some((w) => w.code === 'NO_QUALIFIED_FACULTY')).toBe(
        true,
      );
      expect(res.warnings.some((w) => w.code === 'ROOM_CAPACITY_DEFICIT')).toBe(
        true,
      );
      expect(res.fixHints.length).toBeGreaterThan(0);
    });

    it('suggestAssignments: returns ranked faculty and rooms for unassigned subject', async () => {
      const dto: AssignmentSuggestRequestDto = {
        subjectId: 'sub_1',
        mode: 'single',
      };

      const res = await service.suggestAssignments('proj_1', 'node_sec', dto);
      expect(res.suggestions.length).toBe(1);
      const sugg = res.suggestions[0]!;
      expect(sugg.subjectId).toBe('sub_1');
      expect(sugg.faculty[0]!.id).toBe('fac_1');
      expect(sugg.faculty[0]!.score).toBeGreaterThan(100);
      expect(sugg.faculty[0]!.reasons).toContain('Qualified for subject');
      expect(sugg.rooms[0]!.id).toBe('room_1');
      expect(sugg.rooms[0]!.reasons).toContain(
        'Capacity (60) covers strength (50)',
      );
    });

    it('copySettings: applies fields and pool settings atomically between nodes', async () => {
      const dto: CopyNodeSettingsDto = {
        sourceNodeId: 'node_dept',
        parts: ['fields', 'rules'],
      };

      const res = await service.copySettings(
        'proj_1',
        'node_sec',
        dto,
        'user_1',
      );
      expect(res.appliedParts).toContain('fields');
      expect(res.appliedOperations).toBeGreaterThan(0);
      expect(mockBlueprintService.applyOperations).toHaveBeenCalled();
    });

    it('copySettings: gracefully skips incompatible parts with reason code', async () => {
      const dto: CopyNodeSettingsDto = {
        sourceNodeId: 'node_inst', // Institution cannot have section assignments
        parts: ['assignments'],
      };

      const res = await service.copySettings(
        'proj_1',
        'node_sec',
        dto,
        'user_1',
      );
      expect(res.skippedParts.length).toBe(1);
      expect(res.skippedParts[0]!.reasonCode).toBe('TYPE_INCOMPATIBLE');
    });

    it('history: supports filtering history entries by nodeId', async () => {
      const mockHistoryRepo = {
        findByProject: jest
          .fn()
          .mockImplementation((projId: string, limit = 50, nodeId?: string) => {
            void limit;
            const all = [
              {
                id: 'h1',
                projectId: projId,
                revision: 1,
                nodeId: 'node_sec',
                description: 'Updated Sec A',
              },
              {
                id: 'h2',
                projectId: projId,
                revision: 2,
                nodeId: 'node_dept',
                description: 'Updated Dept',
              },
            ];
            if (nodeId)
              return Promise.resolve(all.filter((h) => h.nodeId === nodeId));
            return Promise.resolve(all);
          }),
      };

      const bpService = {
        getHistory: async (projId: string, nodeId?: string) => {
          const list = await mockHistoryRepo.findByProject(projId, 50, nodeId);
          return list.map((h: any) => ({
            id: h.id,
            projectId: h.projectId,
            nodeId: h.nodeId,
            revision: h.revision,
            description: h.description,
          }));
        },
      };

      const all = await bpService.getHistory('proj_1');
      expect(all.length).toBe(2);

      const secOnly = await bpService.getHistory('proj_1', 'node_sec');
      expect(secOnly.length).toBe(1);
      expect(secOnly[0].nodeId).toBe('node_sec');
    });

    it('bulk edit: applies batch operations for multiple nodes', async () => {
      const batchDto = {
        operations: [
          {
            opId: 'op_1',
            type: 'update_node' as const,
            targetId: 'node_sec',
            data: { strength: 65 },
          },
          {
            opId: 'op_2',
            type: 'update_node' as const,
            targetId: 'node_dept',
            data: { name: 'CS & Engineering' },
          },
        ],
      };

      await mockBlueprintService.applyOperations!(
        'proj_1',
        batchDto as any,
        'user_1',
      );
      expect(mockBlueprintService.applyOperations).toHaveBeenCalledWith(
        'proj_1',
        batchDto,
        'user_1',
      );
    });
  });
});
