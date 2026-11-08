// Command implementation for editing metadata and assignments of a timetable slot.
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
import { ScheduleOccupancy } from '../schemas/schedule-occupancy.schema';
import type { EditSlotDto, SlotType } from '@slotly/contracts';

/** Command implementing slot edits and corresponding occupancy sync. */
@Injectable()
export class EditSlotOperation implements IScheduleCommand<
  EditSlotDto,
  ScheduleEntry
> {
  readonly type = 'edit';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: EditSlotDto,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    if (!params.slotId) {
      throw new BadRequestException('slotId is required for edit operation');
    }
    const entry = await this.entryRepo.findById(params.slotId);
    if (!entry || entry.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot '${params.slotId}' not found in version '${context.versionId}'`,
      );
    }

    const previousState = {
      slotId: entry._id,
      subjectId: entry.subjectId,
      facultyId: entry.facultyId,
      roomId: entry.roomId,
      type: entry.type,
      batchId: entry.batchId,
      span: entry.span,
    };

    const updateData: Partial<ScheduleEntry> = {
      revision: entry.revision + 1,
    };
    if (params.subjectId !== undefined) updateData.subjectId = params.subjectId;
    if (params.facultyId !== undefined) updateData.facultyId = params.facultyId;
    if (params.roomId !== undefined) updateData.roomId = params.roomId;
    if (params.type !== undefined) updateData.type = params.type;
    if (params.batchId !== undefined) updateData.batchId = params.batchId;
    if (params.span !== undefined) updateData.span = params.span;

    const updated = await this.entryRepo.update(
      entry._id,
      updateData,
      context.session,
    );

    // Rebuild occupancies for this entry
    await this.occupancyRepo.deleteByEntryId(entry._id, context.session);

    const span = updated?.span ?? entry.span;
    const startPeriod = updated?.startPeriod ?? entry.startPeriod;
    const facultyId = updated?.facultyId ?? entry.facultyId;
    const roomId = updated?.roomId ?? entry.roomId;

    const newOccupancies: ScheduleOccupancy[] = [];
    for (let p = startPeriod; p < startPeriod + span; p++) {
      newOccupancies.push({
        _id: randomUUID(),
        versionId: context.versionId,
        resourceType: 'section' as const,
        resourceId: updated!.sectionId,
        day: updated!.day,
        period: p,
        entryId: updated!._id,
      });

      if (facultyId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'faculty' as const,
          resourceId: facultyId,
          day: updated!.day,
          period: p,
          entryId: updated!._id,
        });
      }

      if (roomId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'room' as const,
          resourceId: roomId,
          day: updated!.day,
          period: p,
          entryId: updated!._id,
        });
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    return {
      type: this.type,
      forward: { ...params, slotId: entry._id },
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
    return this.apply(
      {
        slotId,
        subjectId: inverse['subjectId'] as string | undefined,
        facultyId: inverse['facultyId'] as string | undefined,
        roomId: inverse['roomId'] as string | undefined,
        type: inverse['type'] as SlotType | undefined,
        batchId: inverse['batchId'] as string | undefined,
        span: inverse['span'] as number | undefined,
      },
      context,
    );
  }
}
