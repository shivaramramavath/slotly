// Unit tests verifying undo and redo round trip from the ScheduleOperation audit log.
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
import type { ScheduleOperation } from '../schemas/schedule-operation.schema';
import type { ScheduleVersionDto } from '@slotly/contracts';
import type { ClientSession } from 'mongoose';

describe('Undo / Redo Operation Log Round-trip', () => {
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
    revision: 2,
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

  const slotEntry: ScheduleEntry = {
    _id: 'slot_1',
    versionId: 'ver_1',
    sectionId: 'sec_1',
    day: 2,
    startPeriod: 4,
    span: 1,
    type: 'theory',
    roomId: 'room_1',
    facultyId: 'fac_1',
    locked: false,
    revision: 2,
  };

  const loggedOp: ScheduleOperation = {
    _id: 'op_1',
    versionId: 'ver_1',
    seq: 1,
    userId: 'usr_1',
    type: 'move',
    forward: { slotId: 'slot_1', targetDay: 2, targetStartPeriod: 4 },
    inverse: {
      slotId: 'slot_1',
      day: 1,
      startPeriod: 1,
      roomId: 'room_1',
      facultyId: 'fac_1',
    },
    at: new Date(),
  };

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockResolvedValue({ ...slotEntry }),
      update: jest
        .fn()
        .mockImplementation((_id: string, update: Partial<ScheduleEntry>) =>
          Promise.resolve({
            ...slotEntry,
            ...update,
          }),
        ),
    };

    occupancyRepoMock = {
      deleteByEntryId: jest.fn().mockResolvedValue(1),
      createMany: jest.fn().mockResolvedValue([]),
    };

    operationRepoMock = {
      findLatest: jest.fn().mockResolvedValue(loggedOp),
      delete: jest.fn().mockResolvedValue(true),
    };

    operationRegistry = new ScheduleOperationRegistry();
    const moveOp = new MoveSlotOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );
    operationRegistry.register(moveOp);

    versionRepoMock = {
      findById: jest.fn().mockResolvedValue(mockVersion),
      update: jest.fn().mockResolvedValue({ ...mockVersion, revision: 3 }),
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

  it('should undo the latest operation from log and advance revision', async () => {
    const res = await service.undo('ver_1', 'usr_1', 2);

    expect(res.success).toBe(true);
    expect(res.revision).toBe(3);
    expect(operationRepoMock.delete).toHaveBeenCalledWith(
      'op_1',
      expect.anything(),
    );
    expect(entryRepoMock.update).toHaveBeenCalledWith(
      'slot_1',
      expect.objectContaining({ day: 1, startPeriod: 1 }),
      expect.anything(),
    );
    expect(cacheMock.invalidateTag).toHaveBeenCalledWith(
      'project:proj_1:schedule',
    );
  });

  it('should return success: false if no operations exist to undo', async () => {
    (operationRepoMock.findLatest as jest.Mock).mockResolvedValueOnce(null);

    const res = await service.undo('ver_1', 'usr_1', 2);

    expect(res.success).toBe(false);
    expect(res.affectedEntries).toEqual([]);
    expect(operationRepoMock.delete).not.toHaveBeenCalled();
  });
});
