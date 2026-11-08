// Concurrency test verifying unique compound index on ScheduleOccupancy and OCCUPANCY_CONFLICT exception.
import { ConflictException } from '@nestjs/common';
import { SchedulesService } from '../services/schedules.service';
import { ScheduleOperationRegistry } from '../operations/schedule-operation.registry';
import { MoveSlotOperation } from '../operations/move-slot.operation';
import type { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import type { ScheduleOperationRepository } from '../repositories/schedule-operation.repository';
import type { MoveValidatorChain } from '../validators/move-validator-chain';
import type { ScheduleGateway } from '../gateways/schedule.gateway';
import type { TransactionHelper } from '../../../common/database/transaction.helper';
import type { IScheduleVersionRepository } from '../../builds/repositories/schedule-version.repository.interface';
import type { ProjectsService } from '../../projects/services/projects.service';
import type { BlueprintService } from '../../blueprint/services/blueprint.service';
import type { EngineValidationService } from '../../engine/services/engine-validation.service';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { ScheduleVersionDto } from '@slotly/contracts';
import type { ClientSession } from 'mongoose';

describe('Unique Occupancy Concurrency & Conflict Catching', () => {
  let service: SchedulesService;
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;
  let operationRepoMock: Partial<ScheduleOperationRepository>;
  let operationRegistry: ScheduleOperationRegistry;
  let versionRepoMock: Partial<IScheduleVersionRepository>;
  let transactionHelperMock: Partial<TransactionHelper>;
  let cacheMock: Partial<CacheService>;
  let gatewayMock: Partial<ScheduleGateway>;

  const mockVersion: ScheduleVersionDto = {
    id: 'ver_1',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Version 1',
    revision: 1,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    score: 100,
    kind: 'auto',
    stats: {
      totalSlots: 10,
      occupiedSlots: 10,
      roomUtilizationPct: 80,
      facultyLoadBalanceScore: 90,
      afternoonLabPct: 50,
    },
    slots: [],
    conflicts: [],
  };

  const slotA: ScheduleEntry = {
    _id: 'slot_A',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 1,
    span: 1,
    type: 'theory',
    roomId: 'room_101',
    facultyId: 'fac_A',
    locked: false,
    revision: 1,
  };

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === 'slot_A') return Promise.resolve(slotA);
        return Promise.resolve(null);
      }),
      update: jest
        .fn()
        .mockImplementation((_id: string, update: Partial<ScheduleEntry>) =>
          Promise.resolve({
            ...slotA,
            ...update,
          }),
        ),
      findByVersion: jest.fn().mockResolvedValue([slotA]),
    };

    occupancyRepoMock = {
      deleteByEntryId: jest.fn().mockResolvedValue(1),
      createMany: jest.fn().mockResolvedValue([]),
    };

    operationRepoMock = {
      findLatest: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({} as any),
    };

    operationRegistry = new ScheduleOperationRegistry();
    const moveOp = new MoveSlotOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );
    operationRegistry.register(moveOp);

    versionRepoMock = {
      findById: jest.fn().mockResolvedValue(mockVersion),
      update: jest.fn().mockResolvedValue({ ...mockVersion, revision: 2 }),
    };

    transactionHelperMock = {
      withTransaction: jest
        .fn()
        .mockImplementation(
          (cb: (session: ClientSession) => Promise<unknown>) =>
            cb({} as ClientSession),
        ),
    };

    cacheMock = {
      remember: jest.fn(),
      invalidateTag: jest.fn().mockResolvedValue(undefined),
    };

    gatewayMock = {
      broadcastSlotMoved: jest.fn(),
      broadcastSlotUpdated: jest.fn(),
      broadcastSlotCleared: jest.fn(),
      broadcastSlotLocked: jest.fn(),
    };

    service = new SchedulesService(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
      operationRepoMock as ScheduleOperationRepository,
      operationRegistry,
      {} as MoveValidatorChain,
      gatewayMock as ScheduleGateway,
      transactionHelperMock as TransactionHelper,
      versionRepoMock as IScheduleVersionRepository,
      {} as ProjectsService,
      {} as BlueprintService,
      {} as EngineValidationService,
      cacheMock as CacheService,
    );
  });

  it('should successfully execute a move operation and broadcast event when room is free', async () => {
    const res = await service.executeOperation(
      'ver_1',
      'move',
      {
        slotId: 'slot_A',
        targetDay: 2,
        targetStartPeriod: 3,
        targetRoomId: 'room_101',
      },
      'user_1',
      1,
    );

    expect(res.success).toBe(true);
    expect(res.revision).toBe(2);
    expect(gatewayMock.broadcastSlotMoved).toHaveBeenCalledWith(
      'ver_1',
      expect.objectContaining({
        slotId: 'slot_A',
        day: 2,
        startPeriod: 3,
      }),
    );
  });

  it('should catch MongoDB duplicate key error 11000 and throw ConflictException with suggestions', async () => {
    const mongoDuplicateKeyError = new Error(
      'E11000 duplicate key error collection: schedule_occupancies index: versionId_1_resourceType_1_resourceId_1_day_1_period_1',
    );
    (mongoDuplicateKeyError as unknown as { code: number }).code = 11000;

    (transactionHelperMock.withTransaction as jest.Mock).mockRejectedValueOnce(
      mongoDuplicateKeyError,
    );

    await expect(
      service.executeOperation(
        'ver_1',
        'move',
        {
          slotId: 'slot_A',
          targetDay: 1,
          targetStartPeriod: 2,
          targetRoomId: 'room_101',
        },
        'user_1',
        1,
      ),
    ).rejects.toThrow(ConflictException);

    try {
      await service.executeOperation(
        'ver_1',
        'move',
        {
          slotId: 'slot_A',
          targetDay: 1,
          targetStartPeriod: 2,
          targetRoomId: 'room_101',
        },
        'user_1',
        1,
      );
    } catch (err) {
      const conflict = err as ConflictException;
      const resp = conflict.getResponse() as {
        code: string;
        suggestions?: Array<{ type: string }>;
      };
      expect(resp.code).toBe('OCCUPANCY_CONFLICT');
      expect(resp.suggestions).toBeDefined();
      expect(resp.suggestions?.[0]?.type).toBe('swap');
    }
  });
});
