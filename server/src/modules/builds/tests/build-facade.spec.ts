import { BadRequestException } from '@nestjs/common';
import { BuildFacade } from '../services/build.facade';
import type { WriteBehindService } from '../../../common/queue/write-behind.service';
import type { BlueprintService } from '../../blueprint/services/blueprint.service';
import { ReadinessService } from '../../blueprint/services/readiness.service';
import type { ProjectsService } from '../../projects/services/projects.service';
import type { EngineValidationService } from '../../engine/services/engine-validation.service';
import type { IScheduleVersionRepository } from '../repositories/schedule-version.repository.interface';
import type { EventBus } from '../../../common/events/event-bus.service';
import type { AuditService } from '../../../common/audit/audit.service';
import type { BlueprintNodeDto, ScheduleVersionDto } from '@slotly/contracts';
import type { EngineInput } from '../../engine/core/types';

describe('BuildFacade', () => {
  let facade: BuildFacade;
  let flushOrAwaitMock: jest.Mock;
  let getGraphMock: jest.Mock;
  let readinessService: ReadinessService;
  let findByIdMock: jest.Mock;
  let updateMock: jest.Mock;
  let buildEngineInputMock: jest.Mock;
  let countByProjectIdMock: jest.Mock;
  let createMock: jest.Mock;
  let findLatestMock: jest.Mock;
  let publishMock: jest.Mock;
  let auditLogMock: jest.Mock;

  const mockProjectId = 'proj_123';
  const mockUserId = 'usr_456';

  beforeEach(() => {
    flushOrAwaitMock = jest.fn().mockResolvedValue(undefined);
    getGraphMock = jest.fn();
    readinessService = new ReadinessService();
    findByIdMock = jest.fn().mockResolvedValue({
      id: mockProjectId,
      name: 'Fall Term 2026',
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 6,
        periodDuration: 50,
        breaks: [{ period: 3, name: 'Lunch' }],
      },
    });
    updateMock = jest.fn().mockResolvedValue({});
    buildEngineInputMock = jest.fn();
    countByProjectIdMock = jest.fn().mockResolvedValue(0);
    createMock = jest
      .fn()
      .mockImplementation((data: Partial<ScheduleVersionDto>) =>
        Promise.resolve({
          id: `ver_${Math.random()}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as ScheduleVersionDto),
      );
    findLatestMock = jest.fn().mockResolvedValue(null);
    publishMock = jest.fn().mockResolvedValue(undefined);
    auditLogMock = jest.fn().mockResolvedValue(undefined);

    facade = new BuildFacade(
      {
        flushOrAwaitPendingWrites: flushOrAwaitMock,
      } as unknown as WriteBehindService,
      { getGraph: getGraphMock } as unknown as BlueprintService,
      readinessService,
      {
        findById: findByIdMock,
        update: updateMock,
        updateStatus: updateMock,
      } as unknown as ProjectsService,
      {
        buildEngineInput: buildEngineInputMock,
      } as unknown as EngineValidationService,
      {
        countByProjectId: countByProjectIdMock,
        create: createMock,
        findLatestByProjectId: findLatestMock,
      } as unknown as IScheduleVersionRepository,
      { publish: publishMock } as unknown as EventBus,
      { log: auditLogMock } as unknown as AuditService,
    );
  });

  // ---------------------------------------------------------------------------
  // G5 Gate Test: Block build on incomplete blueprint
  // ---------------------------------------------------------------------------
  it('blocks build when blueprint contains incomplete or blocked nodes (Gate G5)', async () => {
    const incompleteNodes: BlueprintNodeDto[] = [
      {
        id: 'node_inst',
        projectId: mockProjectId,
        type: 'institution',
        position: { x: 0, y: 0 },
        data: {},
        locked: false,
        hidden: false,
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
      },
      {
        id: 'node_dept',
        projectId: mockProjectId,
        type: 'department',
        parentId: 'node_inst',
        position: { x: 0, y: 100 },
        data: {},
        locked: false,
        hidden: false,
        status: 'incomplete', // Incomplete node!
        effectiveStatus: 'incomplete',
        missing: [{ field: 'code', message: 'Department code is required' }],
      },
    ];

    getGraphMock.mockResolvedValue({
      nodes: incompleteNodes,
      edges: [],
      revision: 1,
    });

    await expect(
      facade.build(mockProjectId, {
        alternatives: 3,
        profile: 'standard',
        mode: 'fresh',
        timeLimitMs: 5000,
      }),
    ).rejects.toThrow(BadRequestException);

    // Verify consistency barrier was called before gate check
    expect(flushOrAwaitMock).toHaveBeenCalledWith(mockProjectId, 5000);
    // Version repo create must NOT have been called
    expect(createMock).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Pre-build Structural Checks Test
  // ---------------------------------------------------------------------------
  it('blocks build when pre-build checks fail (e.g. insufficient lab capacity)', async () => {
    const completeNodes: BlueprintNodeDto[] = [
      {
        id: 'node_inst',
        projectId: mockProjectId,
        type: 'institution',
        position: { x: 0, y: 0 },
        data: {},
        locked: false,
        hidden: false,
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
      },
    ];

    getGraphMock.mockResolvedValue({
      nodes: completeNodes,
      edges: [],
      revision: 1,
    });

    // Engine input with insufficient lab capacity (requires 10h of lab, 0 lab rooms exist)
    const brokenInput: EngineInput = {
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 6,
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_1', name: 'Section 1', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_1',
          name: 'Faculty 1',
          code: 'F1',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        {
          id: 'rm_lec',
          name: 'Lecture Room',
          type: 'lecture',
          capacity: 40,
        },
      ], // No lab room!
      subjects: [
        {
          id: 'sub_lab',
          name: 'Physics Lab',
          code: 'PHYLAB',
          type: 'lab',
          weeklyHours: 10,
          consecutivePeriods: 2,
          sectionId: 'sec_1',
          requirements: { roomType: 'lab' },
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    buildEngineInputMock.mockReturnValue(brokenInput);

    await expect(
      facade.build(mockProjectId, {
        alternatives: 3,
        profile: 'standard',
        mode: 'fresh',
        timeLimitMs: 5000,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(createMock).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Successful Build Test
  // ---------------------------------------------------------------------------
  it('successfully builds schedule, saves ScheduleVersions, updates status, and emits events', async () => {
    const completeNodes: BlueprintNodeDto[] = [
      {
        id: 'node_inst',
        projectId: mockProjectId,
        type: 'institution',
        position: { x: 0, y: 0 },
        data: {},
        locked: false,
        hidden: false,
        status: 'complete',
        effectiveStatus: 'complete',
        missing: [],
      },
    ];

    getGraphMock.mockResolvedValue({
      nodes: completeNodes,
      edges: [],
      revision: 1,
    });

    const validInput: EngineInput = {
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 6,
        periodDuration: 50,
        breaks: [{ period: 3, name: 'Lunch' }],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_valid', name: 'Section Valid', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_1',
          name: 'Prof Alpha',
          code: 'ALP',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        {
          id: 'rm_1',
          name: 'Room 101',
          type: 'lecture',
          capacity: 40,
        },
      ],
      subjects: [
        {
          id: 'sub_math',
          name: 'Math',
          code: 'MTH',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_1'],
          sectionId: 'sec_valid',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    buildEngineInputMock.mockReturnValue(validInput);

    const versions = await facade.build(
      mockProjectId,
      {
        alternatives: 2,
        profile: 'standard',
        mode: 'fresh',
        timeLimitMs: 5000,
      },
      mockUserId,
    );

    expect(versions).toHaveLength(2);
    expect(createMock).toHaveBeenCalledTimes(2);

    // Verify project status updated to ready
    expect(updateMock).toHaveBeenCalledWith(mockProjectId, 'ready');

    // Verify event bus and audit
    expect(publishMock).toHaveBeenCalledWith(
      'build.completed',
      expect.objectContaining({ projectId: mockProjectId }),
    );
    expect(auditLogMock).toHaveBeenCalledWith(
      'BUILD_COMPLETED',
      mockUserId,
      { type: 'project', id: mockProjectId },
      expect.any(Object),
    );
  });
});
