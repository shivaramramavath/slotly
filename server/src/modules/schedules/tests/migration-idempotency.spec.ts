// Unit tests verifying ScheduleMigrationService idempotency and dry-run accuracy.
import { ScheduleMigrationService } from '../migrations/schedule-migration.service';
import type { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import type { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import type { TransactionHelper } from '../../../common/database/transaction.helper';
import type { Model, ClientSession } from 'mongoose';
import type { ScheduleVersionDocument } from '../../builds/schemas/schedule-version.schema';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

describe('ScheduleMigrationService Idempotency & Dry-run', () => {
  let service: ScheduleMigrationService;
  let entryRepoMock: Partial<ScheduleEntryRepository>;
  let occupancyRepoMock: Partial<ScheduleOccupancyRepository>;
  let transactionHelperMock: Partial<TransactionHelper>;
  let versionModelMock: unknown;

  const legacyVersions = [
    {
      _id: 'ver_legacy_1',
      id: 'ver_legacy_1',
      projectId: 'proj_1',
      versionNo: 1,
      slots: [
        {
          id: 'slot_1',
          sectionId: 'sec_1',
          day: 1,
          period: 1,
          span: 1,
          type: 'theory',
          facultyId: 'fac_1',
          roomId: 'room_1',
          isLocked: false,
        },
        {
          id: 'slot_2',
          sectionId: 'sec_1',
          day: 1,
          period: 2,
          span: 2,
          type: 'lab',
          facultyId: 'fac_2',
          roomId: 'lab_1',
          isLocked: false,
        },
      ],
    },
    {
      _id: 'ver_empty',
      id: 'ver_empty',
      projectId: 'proj_1',
      versionNo: 2,
      slots: [],
    },
  ];

  let existingEntriesByVersion: Record<string, ScheduleEntry[]> = {};

  beforeEach(() => {
    existingEntriesByVersion = {};

    versionModelMock = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(legacyVersions),
        }),
      }),
    };

    entryRepoMock = {
      findByVersion: jest
        .fn()
        .mockImplementation((versionId: string) =>
          Promise.resolve(existingEntriesByVersion[versionId] || []),
        ),
      createMany: jest.fn().mockImplementation((entries: ScheduleEntry[]) => {
        for (const e of entries) {
          if (!existingEntriesByVersion[e.versionId]) {
            existingEntriesByVersion[e.versionId] = [];
          }
          existingEntriesByVersion[e.versionId]!.push(e);
        }
        return Promise.resolve(entries);
      }),
    };

    occupancyRepoMock = {
      createMany: jest.fn().mockResolvedValue([]),
    };

    transactionHelperMock = {
      withTransaction: jest
        .fn()
        .mockImplementation(
          (cb: (session: ClientSession) => Promise<unknown>) =>
            cb({} as ClientSession),
        ),
    };

    service = new ScheduleMigrationService(
      versionModelMock as Model<ScheduleVersionDocument>,
      entryRepoMock as ScheduleEntryRepository,
      occupancyRepoMock as ScheduleOccupancyRepository,
      transactionHelperMock as TransactionHelper,
    );
  });

  it('should compute migration counts without writing when dryRun is true', async () => {
    const res = await service.migrateLegacySlots(true);

    expect(res.dryRun).toBe(true);
    expect(res.totalVersions).toBe(2);
    expect(res.migratedVersions).toBe(1);
    expect(res.skippedVersions).toBe(1); // ver_empty skipped
    expect(res.entriesCreated).toBe(2);
    // slot_1 has section, faculty, room = 3 occupancies
    // slot_2 has span=2 with section, faculty, room = 2 * 3 = 6 occupancies
    expect(res.occupanciesCreated).toBe(9);

    expect(entryRepoMock.createMany).not.toHaveBeenCalled();
    expect(occupancyRepoMock.createMany).not.toHaveBeenCalled();
  });

  it('should persist entries and occupancies when dryRun is false', async () => {
    const res = await service.migrateLegacySlots(false);

    expect(res.dryRun).toBe(false);
    expect(res.migratedVersions).toBe(1);
    expect(res.entriesCreated).toBe(2);
    expect(res.occupanciesCreated).toBe(9);

    expect(entryRepoMock.createMany).toHaveBeenCalled();
    expect(occupancyRepoMock.createMany).toHaveBeenCalled();
  });

  it('should be completely idempotent when executed repeatedly', async () => {
    // First run persists data
    const firstRun = await service.migrateLegacySlots(false);
    expect(firstRun.migratedVersions).toBe(1);
    expect(firstRun.entriesCreated).toBe(2);

    // Second run should detect existing entries and skip
    const secondRun = await service.migrateLegacySlots(false);
    expect(secondRun.migratedVersions).toBe(0);
    expect(secondRun.skippedVersions).toBe(2);
    expect(secondRun.entriesCreated).toBe(0);
    expect(secondRun.occupanciesCreated).toBe(0);
  });
});
