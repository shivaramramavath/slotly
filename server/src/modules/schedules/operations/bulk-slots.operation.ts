// Command implementation for executing atomic bulk modifications across multiple schedule slots.
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
import type { BulkSlotsDto, SlotType } from '@slotly/contracts';

/** Command implementing atomic bulk multi-cell actions with full rollback on failure. */
@Injectable()
export class BulkSlotsOperation implements IScheduleCommand<
  BulkSlotsDto,
  ScheduleEntry[]
> {
  readonly type = 'bulk';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: BulkSlotsDto,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    const entries = await Promise.all(
      params.slotIds.map((id) => this.entryRepo.findById(id)),
    );

    const missingIndex = entries.findIndex(
      (e) => !e || e.versionId !== context.versionId,
    );
    if (missingIndex !== -1) {
      throw new NotFoundException(
        `Slot '${params.slotIds[missingIndex]}' not found in version '${context.versionId}'`,
      );
    }

    const previousStates = entries.map((e) => ({
      slotId: e!._id,
      subjectId: e!.subjectId,
      facultyId: e!.facultyId,
      roomId: e!.roomId,
      locked: e!.locked,
      type: e!.type,
    }));

    const updatedEntries: ScheduleEntry[] = [];

    for (const entry of entries as ScheduleEntry[]) {
      const update: Partial<ScheduleEntry> = {
        revision: entry.revision + 1,
      };

      if (params.action === 'assign_faculty') {
        if (!params.facultyId)
          throw new BadRequestException(
            'facultyId is required for assign_faculty action',
          );
        update.facultyId = params.facultyId;
      } else if (params.action === 'assign_room') {
        if (!params.roomId)
          throw new BadRequestException(
            'roomId is required for assign_room action',
          );
        update.roomId = params.roomId;
      } else if (params.action === 'change_subject') {
        if (!params.subjectId)
          throw new BadRequestException(
            'subjectId is required for change_subject action',
          );
        update.subjectId = params.subjectId;
      } else if (params.action === 'clear') {
        update.subjectId = undefined;
        update.facultyId = undefined;
        update.roomId = undefined;
        update.type = 'theory';
      } else if (params.action === 'lock') {
        update.locked = true;
      } else if (params.action === 'unlock') {
        update.locked = false;
      }

      const updated = await this.entryRepo.update(
        entry._id,
        update,
        context.session,
      );
      updatedEntries.push(updated!);

      // Re-sync occupancy
      await this.occupancyRepo.deleteByEntryId(entry._id, context.session);
      if (params.action !== 'clear') {
        const newOccupancies = [];
        for (
          let p = updated!.startPeriod;
          p < updated!.startPeriod + updated!.span;
          p++
        ) {
          newOccupancies.push({
            _id: randomUUID(),
            versionId: context.versionId,
            resourceType: 'section' as const,
            resourceId: updated!.sectionId,
            day: updated!.day,
            period: p,
            entryId: updated!._id,
          });
          if (updated!.facultyId) {
            newOccupancies.push({
              _id: randomUUID(),
              versionId: context.versionId,
              resourceType: 'faculty' as const,
              resourceId: updated!.facultyId,
              day: updated!.day,
              period: p,
              entryId: updated!._id,
            });
          }
          if (updated!.roomId) {
            newOccupancies.push({
              _id: randomUUID(),
              versionId: context.versionId,
              resourceType: 'room' as const,
              resourceId: updated!.roomId,
              day: updated!.day,
              period: p,
              entryId: updated!._id,
            });
          }
        }
        await this.occupancyRepo.createMany(newOccupancies, context.session);
      }
    }

    return {
      type: this.type,
      forward: params as unknown as Record<string, unknown>,
      inverse: { states: previousStates },
      affectedEntries: updatedEntries,
      resultData: updatedEntries,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    const states =
      (inverse['states'] as Array<{
        slotId: string;
        subjectId?: string;
        facultyId?: string;
        roomId?: string;
        locked?: boolean;
        type?: SlotType | undefined;
      }>) || [];

    const restored: ScheduleEntry[] = [];
    for (const s of states) {
      const updated = await this.entryRepo.update(
        s.slotId,
        {
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
          locked: Boolean(s.locked),
          type: s.type || 'theory',
        },
        context.session,
      );
      restored.push(updated!);
    }

    return {
      type: this.type,
      forward: inverse,
      inverse: {},
      affectedEntries: restored,
      resultData: restored,
    };
  }
}
