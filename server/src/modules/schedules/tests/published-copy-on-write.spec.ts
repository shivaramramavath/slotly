// Unit tests verifying copy-on-write fork when attempting to edit a published schedule version.
import { SchedulesService } from '../services/schedules.service';
import { ScheduleOperationRegistry } from '../operations/schedule-operation.registry';
import { EditSlotOperation } from '../operations/edit-slot.operation';
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

describe('Published Version Copy-on-Write Fork', () => {
  let service: SchedulesService;
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;
  let operationRepoMock: Partial<ScheduleOperationRepository>;
  let operationRegistry: ScheduleOperationRegistry;
  let versionRepoMock: Partial<IScheduleVersionRepository>;
  let transactionHelperMock: Partial<TransactionHelper>;
  let cacheMock: Partial<CacheService>;
  let gatewayMock: Partial<ScheduleGateway>;

  const publishedVersion: ScheduleVersionDto = {
    id: 'ver_pub_1',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Term Fall Published',
    revision: 1,
    status: 'published',
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

  const existingEntry: ScheduleEntry = {
    _id: 'slot_1',
    versionId: 'ver_pub_1',
    sectionId: 'sec_1',
    day: 1,
    startPeriod: 1,
    span: 1,
    type: 'theory',
    facultyId: 'fac_1',
    roomId: 'room_1',
    locked: false,
    revision: 1,
  };

  beforeEach(() => {
    entryRepoMock = {
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({
          ...existingEntry,
          _id: id,
          versionId: id === 'slot_1' ? 'ver_pub_1' : 'ver_draft_fork',
        }),
      ),
      findByVersion: jest.fn().mockResolvedValue([{ ...existingEntry }]),
      createMany: jest.fn().mockResolvedValue([]),
      update: jest
        .fn()
        .mockImplementation((id: string, update: Partial<ScheduleEntry>) =>
          Promise.resolve({
            ...existingEntry,
            _id: id,
            ...update,
          }),
        ),
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
    const editOp = new EditSlotOperation(
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
    );
    operationRegistry.register(editOp);

    versionRepoMock = {
      findById: jest.fn().mockResolvedValue({ ...publishedVersion }),
      findByProjectId: jest.fn().mockResolvedValue([publishedVersion]),
      create: jest
        .fn()
        .mockImplementation((data: Partial<ScheduleVersionDto>) =>
          Promise.resolve({
            id: 'ver_draft_fork',
            revision: 1,
            ...data,
          } as ScheduleVersionDto),
        ),
      update: jest
        .fn()
        .mockImplementation((id: string, data: Partial<ScheduleVersionDto>) =>
          Promise.resolve({
            id,
            ...data,
          } as ScheduleVersionDto),
        ),
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

  it('should fork a new draft version when attempting to modify a published version', async () => {
    const res = await service.executeOperation(
      'ver_pub_1',
      'edit',
      { slotId: 'slot_1', roomId: 'room_new' },
      'user_1',
      1,
    );

    expect(res.success).toBe(true);
    expect(res.forkedFromPublished).toBe(true);
    expect(res.versionId).toBe('ver_draft_fork');

    // Cloned entries and occupancies to new draft version
    expect(entryRepoMock.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          versionId: 'ver_draft_fork',
        }),
      ]),
    );

    expect(occupancyRepoMock.createMany).toHaveBeenCalled();
    expect(versionRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_1',
        versionNo: 2,
        status: 'draft',
      }),
    );
  });
});
