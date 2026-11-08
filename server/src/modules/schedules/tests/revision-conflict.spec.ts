// Unit tests verifying optimistic concurrency If-Match revision check throwing 409 ConflictException.
import { SchedulesService } from '../services/schedules.service';
import { ScheduleOperationRegistry } from '../operations/schedule-operation.registry';
import { RevisionConflictException } from '../../../common/concurrency/revision.helper';
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

describe('Revision Conflict (Optimistic Concurrency)', () => {
  let service: SchedulesService;
  let versionRepoMock: Partial<IScheduleVersionRepository>;

  const mockVersion = {
    id: 'ver_1',
    projectId: 'proj_1',
    versionNo: 1,
    label: 'Version 1',
    revision: 5,
    status: 'draft',
    slots: [],
    conflicts: [],
  };

  beforeEach(() => {
    versionRepoMock = {
      findById: jest.fn().mockResolvedValue({ ...mockVersion }),
    };

    service = new SchedulesService(
      {} as ScheduleEntryRepository,
      {} as ScheduleOccupancyRepository,
      {} as ScheduleOperationRepository,
      new ScheduleOperationRegistry(),
      {} as MoveValidatorChain,
      {} as ScheduleGateway,
      {} as TransactionHelper,
      versionRepoMock as IScheduleVersionRepository,
      {} as ProjectsService,
      {} as BlueprintService,
      {} as EngineValidationService,
      {} as CacheService,
    );
  });

  it('should throw RevisionConflictException (409) if client sends stale expectedRevision', async () => {
    await expect(
      service.executeOperation(
        'ver_1',
        'move',
        {},
        'usr_1',
        4, // Stale: current revision is 5
      ),
    ).rejects.toThrow(RevisionConflictException);
  });

  it('should throw RevisionConflictException on undo when expectedRevision is stale', async () => {
    await expect(
      service.undo(
        'ver_1',
        'usr_1',
        3, // Stale: current revision is 5
      ),
    ).rejects.toThrow(RevisionConflictException);
  });
});
