// Command implementation for moving a schedule slot to a new target day, period, or resource.
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
import type { MoveSlotDto } from '@slotly/contracts';

/** Command implementing slot move mutation with inverse compensation. */
@Injectable()
export class MoveSlotOperation implements IScheduleCommand<
  MoveSlotDto & { slotId: string },
  ScheduleEntry
> {
  readonly type = 'move';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: MoveSlotDto & { slotId: string },
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    const entry = await this.entryRepo.findById(params.slotId);
    if (!entry || entry.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot '${params.slotId}' not found in version '${context.versionId}'`,
      );
    }

    const previousState = {
      slotId: entry._id,
      day: entry.day,
      startPeriod: entry.startPeriod,
      roomId: entry.roomId,
      facultyId: entry.facultyId,
      revision: entry.revision,
    };

    const targetDay = params.targetDay;
    const targetStartPeriod = params.targetStartPeriod;
    const targetRoomId =
      params.targetRoomId !== undefined ? params.targetRoomId : entry.roomId;
    const targetFacultyId =
      params.targetFacultyId !== undefined
        ? params.targetFacultyId
        : entry.facultyId;

    // Update entry
    const updated = await this.entryRepo.update(
      entry._id,
      {
        day: targetDay,
        startPeriod: targetStartPeriod,
        roomId: targetRoomId,
        facultyId: targetFacultyId,
        revision: entry.revision + 1,
      },
      context.session,
    );

    // Re-sync occupancies
    await this.occupancyRepo.deleteByEntryId(entry._id, context.session);
    const newOccupancies = [];
    for (let p = targetStartPeriod; p < targetStartPeriod + entry.span; p++) {
      newOccupancies.push({
        _id: randomUUID(),
        versionId: context.versionId,
        resourceType: 'section' as const,
        resourceId: entry.sectionId,
        day: targetDay,
        period: p,
        entryId: entry._id,
      });
      if (targetFacultyId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'faculty' as const,
          resourceId: targetFacultyId,
          day: targetDay,
          period: p,
          entryId: entry._id,
        });
      }
      if (targetRoomId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'room' as const,
          resourceId: targetRoomId,
          day: targetDay,
          period: p,
          entryId: entry._id,
        });
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    const forward = {
      slotId: entry._id,
      day: targetDay,
      startPeriod: targetStartPeriod,
      roomId: targetRoomId,
      facultyId: targetFacultyId,
    };

    return {
      type: this.type,
      forward,
      inverse: previousState,
      affectedEntries: [updated!],
      resultData: updated!,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    const slotId = inverse['slotId'] as string;
    const day = inverse['day'] as number;
    const startPeriod = inverse['startPeriod'] as number;
    const roomId = inverse['roomId'] as string | undefined;
    const facultyId = inverse['facultyId'] as string | undefined;

    return this.apply(
      {
        slotId,
        targetDay: day,
        targetStartPeriod: startPeriod,
        targetRoomId: roomId,
        targetFacultyId: facultyId,
      },
      context,
    );
  }
}
