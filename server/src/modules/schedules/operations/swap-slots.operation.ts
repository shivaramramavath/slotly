// Command implementation for swapping two timetable slots across periods and days.
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import { ScheduleOccupancy } from '../schemas/schedule-occupancy.schema';
import type { SwapSlotsDto } from '@slotly/contracts';

/** Command implementing atomic swap of two timetable slots. */
@Injectable()
export class SwapSlotsOperation implements IScheduleCommand<
  SwapSlotsDto,
  [ScheduleEntry, ScheduleEntry]
> {
  readonly type = 'swap';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: SwapSlotsDto,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<[ScheduleEntry, ScheduleEntry]>> {
    const entryA = await this.entryRepo.findById(params.slotIdA);
    const entryB = await this.entryRepo.findById(params.slotIdB);

    if (!entryA || entryA.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot A '${params.slotIdA}' not found in version '${context.versionId}'`,
      );
    }
    if (!entryB || entryB.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot B '${params.slotIdB}' not found in version '${context.versionId}'`,
      );
    }

    // Swap day and startPeriod
    const updatedA = await this.entryRepo.update(
      entryA._id,
      {
        day: entryB.day,
        startPeriod: entryB.startPeriod,
        revision: entryA.revision + 1,
      },
      context.session,
    );

    const updatedB = await this.entryRepo.update(
      entryB._id,
      {
        day: entryA.day,
        startPeriod: entryA.startPeriod,
        revision: entryB.revision + 1,
      },
      context.session,
    );

    // Delete old occupancies for both entries
    await this.occupancyRepo.deleteByEntryId(entryA._id, context.session);
    await this.occupancyRepo.deleteByEntryId(entryB._id, context.session);

    // Create new occupancies
    const newOccupancies: ScheduleOccupancy[] = [];
    const entriesToUpdate = [updatedA!, updatedB!];

    for (const e of entriesToUpdate) {
      for (let p = e.startPeriod; p < e.startPeriod + e.span; p++) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'section' as const,
          resourceId: e.sectionId,
          day: e.day,
          period: p,
          entryId: e._id,
        });
        if (e.facultyId) {
          newOccupancies.push({
            _id: randomUUID(),
            versionId: context.versionId,
            resourceType: 'faculty' as const,
            resourceId: e.facultyId,
            day: e.day,
            period: p,
            entryId: e._id,
          });
        }
        if (e.roomId) {
          newOccupancies.push({
            _id: randomUUID(),
            versionId: context.versionId,
            resourceType: 'room' as const,
            resourceId: e.roomId,
            day: e.day,
            period: p,
            entryId: e._id,
          });
        }
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    return {
      type: this.type,
      forward: params,
      inverse: { slotIdA: params.slotIdB, slotIdB: params.slotIdA },
      affectedEntries: [updatedA!, updatedB!],
      resultData: [updatedA!, updatedB!],
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<[ScheduleEntry, ScheduleEntry]>> {
    return this.apply(
      {
        slotIdA: inverse['slotIdA'] as string,
        slotIdB: inverse['slotIdB'] as string,
      },
      context,
    );
  }
}
