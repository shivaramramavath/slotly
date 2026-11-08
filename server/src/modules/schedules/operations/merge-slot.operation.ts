// Command implementation for merging consecutive periods into a single multi-period entry.
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { MergeSlotDto } from '@slotly/contracts';

/** Command implementing slot period merging with inverse compensation. */
@Injectable()
export class MergeSlotOperation implements IScheduleCommand<
  MergeSlotDto & { slotId: string },
  ScheduleEntry
> {
  readonly type = 'merge';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: MergeSlotDto & { slotId: string },
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    const entry = await this.entryRepo.findById(params.slotId);
    if (!entry || entry.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot '${params.slotId}' not found in version '${context.versionId}'`,
      );
    }

    const previousSpan = entry.span;
    const newSpan = params.span;
    if (newSpan <= previousSpan) {
      throw new BadRequestException(
        `New span (${newSpan}) must be strictly greater than current span (${previousSpan})`,
      );
    }

    // Check consecutive slots to absorb
    const sectionEntries = await this.entryRepo.findByFilter({
      versionId: context.versionId,
      sectionId: entry.sectionId,
      day: entry.day,
    });

    const absorbedSlotIds: string[] = [];
    const targetRangeEnd = entry.startPeriod + newSpan - 1;

    for (const other of sectionEntries) {
      if (other._id === entry._id) continue;
      const otherEnd = other.startPeriod + other.span - 1;
      if (
        other.startPeriod <= targetRangeEnd &&
        otherEnd >= entry.startPeriod + previousSpan
      ) {
        // Can only absorb empty / unassigned slots, or slots of the same subject
        if (other.subjectId && other.subjectId !== entry.subjectId) {
          throw new BadRequestException(
            `Cannot merge over period ${other.startPeriod} because it is occupied by subject ${other.subjectId}`,
          );
        }
        absorbedSlotIds.push(other._id);
      }
    }

    // Delete absorbed slots
    for (const absorbedId of absorbedSlotIds) {
      await this.entryRepo.delete(absorbedId, context.session);
      await this.occupancyRepo.deleteByEntryId(absorbedId, context.session);
    }

    // Update merged slot span
    const updated = await this.entryRepo.update(
      entry._id,
      {
        span: newSpan,
        revision: entry.revision + 1,
      },
      context.session,
    );

    // Re-sync occupancies for new span
    await this.occupancyRepo.deleteByEntryId(entry._id, context.session);
    const newOccupancies = [];
    for (let p = entry.startPeriod; p <= targetRangeEnd; p++) {
      newOccupancies.push({
        _id: randomUUID(),
        versionId: context.versionId,
        resourceType: 'section' as const,
        resourceId: entry.sectionId,
        day: entry.day,
        period: p,
        entryId: entry._id,
      });
      if (entry.facultyId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'faculty' as const,
          resourceId: entry.facultyId,
          day: entry.day,
          period: p,
          entryId: entry._id,
        });
      }
      if (entry.roomId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'room' as const,
          resourceId: entry.roomId,
          day: entry.day,
          period: p,
          entryId: entry._id,
        });
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    return {
      type: this.type,
      forward: params,
      inverse: {
        slotId: entry._id,
        originalSpan: previousSpan,
        absorbedSlotIds,
      },
      affectedEntries: [updated!],
      resultData: updated!,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    const slotId = inverse['slotId'] as string;
    const originalSpan = inverse['originalSpan'] as number;

    const entry = await this.entryRepo.findById(slotId);
    if (!entry) throw new NotFoundException(`Slot '${slotId}' not found`);

    const updated = await this.entryRepo.update(
      slotId,
      {
        span: originalSpan,
        revision: entry.revision + 1,
      },
      context.session,
    );

    await this.occupancyRepo.deleteByEntryId(slotId, context.session);
    const newOccupancies = [];
    for (let p = entry.startPeriod; p < entry.startPeriod + originalSpan; p++) {
      newOccupancies.push({
        _id: randomUUID(),
        versionId: context.versionId,
        resourceType: 'section' as const,
        resourceId: entry.sectionId,
        day: entry.day,
        period: p,
        entryId: entry._id,
      });
      if (entry.facultyId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'faculty' as const,
          resourceId: entry.facultyId,
          day: entry.day,
          period: p,
          entryId: entry._id,
        });
      }
      if (entry.roomId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'room' as const,
          resourceId: entry.roomId,
          day: entry.day,
          period: p,
          entryId: entry._id,
        });
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    return {
      type: this.type,
      forward: inverse,
      inverse: { slotId },
      affectedEntries: [updated!],
      resultData: updated!,
    };
  }
}
