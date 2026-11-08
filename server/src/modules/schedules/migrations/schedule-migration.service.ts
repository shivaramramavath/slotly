// Migration service converting legacy schedule slot arrays to ScheduleEntry and ScheduleOccupancy models.
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import {
  ScheduleVersion,
  ScheduleVersionDocument,
} from '../../builds/schemas/schedule-version.schema';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import { ScheduleOccupancy } from '../schemas/schedule-occupancy.schema';
import { TransactionHelper } from '../../../common/database/transaction.helper';

/** Interface defining migration result statistics. */
export interface ScheduleMigrationResult {
  totalVersions: number;
  migratedVersions: number;
  skippedVersions: number;
  entriesCreated: number;
  occupanciesCreated: number;
  dryRun: boolean;
}

type LegacyVersionRecord = ScheduleVersion & {
  _id: { toString(): string };
  id?: string;
};

/** Injectable service providing idempotent migration for legacy slot records. */
@Injectable()
export class ScheduleMigrationService {
  private readonly logger = new Logger(ScheduleMigrationService.name);

  constructor(
    @InjectModel(ScheduleVersion.name)
    private readonly versionModel: Model<ScheduleVersionDocument>,
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  /**
   * Idempotent migration from legacy version `slots` array to `ScheduleEntry` & `ScheduleOccupancy`.
   * Skips versions that already have entries.
   */
  async migrateLegacySlots(
    dryRun: boolean = false,
  ): Promise<ScheduleMigrationResult> {
    const versions = await this.versionModel
      .find()
      .lean<LegacyVersionRecord[]>()
      .exec();

    let migratedVersions = 0;
    let skippedVersions = 0;
    let entriesCreated = 0;
    let occupanciesCreated = 0;

    for (const v of versions) {
      const versionId = v.id || String(v._id);
      const existingEntries = await this.entryRepo.findByVersion(versionId);
      if (existingEntries.length > 0) {
        skippedVersions++;
        continue;
      }

      const slots = v.slots || [];
      if (slots.length === 0) {
        skippedVersions++;
        continue;
      }

      const newEntries: ScheduleEntry[] = [];
      const newOccupancies: ScheduleOccupancy[] = [];

      for (const s of slots) {
        const entryId = s.id || randomUUID();
        const span = s.span || 1;
        const startPeriod = s.period;

        newEntries.push({
          _id: entryId,
          versionId,
          sectionId: s.sectionId,
          batchId: s.batchId,
          day: s.day,
          startPeriod,
          span,
          type: s.type || 'theory',
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
          locked: s.isLocked || false,
          revision: 1,
        });

        for (let p = startPeriod; p < startPeriod + span; p++) {
          newOccupancies.push({
            _id: randomUUID(),
            versionId,
            resourceType: 'section',
            resourceId: s.sectionId,
            day: s.day,
            period: p,
            entryId,
          });

          if (s.facultyId) {
            newOccupancies.push({
              _id: randomUUID(),
              versionId,
              resourceType: 'faculty',
              resourceId: s.facultyId,
              day: s.day,
              period: p,
              entryId,
            });
          }

          if (s.roomId) {
            newOccupancies.push({
              _id: randomUUID(),
              versionId,
              resourceType: 'room',
              resourceId: s.roomId,
              day: s.day,
              period: p,
              entryId,
            });
          }
        }
      }

      entriesCreated += newEntries.length;
      occupanciesCreated += newOccupancies.length;
      migratedVersions++;

      if (!dryRun) {
        try {
          await this.transactionHelper.withTransaction(async (session) => {
            await this.entryRepo.createMany(newEntries, session);
            await this.occupancyRepo.createMany(newOccupancies, session);
          });
        } catch (err) {
          this.logger.warn(
            `Transaction failed for version ${versionId}, writing without transaction: ${(err as Error).message}`,
          );
          await this.entryRepo.createMany(newEntries);
          await this.occupancyRepo.createMany(newOccupancies);
        }
      }
    }

    return {
      totalVersions: versions.length,
      migratedVersions,
      skippedVersions,
      entriesCreated,
      occupanciesCreated,
      dryRun,
    };
  }
}
