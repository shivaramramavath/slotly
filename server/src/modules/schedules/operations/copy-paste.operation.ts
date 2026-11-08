// Command implementation for copying and pasting cell attributes across schedule slots.
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
import type { SlotType } from '@slotly/contracts';

/** Parameters defining copy paste execution. */
export interface CopyPasteParams {
  sourceSlotIds: string[];
  targetSlotIds: string[];
  mode: 'full' | 'subject_only' | 'faculty_only' | 'room_only';
}

/** Command implementing copy paste mutations with inverse compensation. */
@Injectable()
export class CopyPasteOperation implements IScheduleCommand<
  CopyPasteParams,
  ScheduleEntry[]
> {
  readonly type = 'copy_paste';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: CopyPasteParams,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    if (
      params.sourceSlotIds.length === 0 ||
      params.targetSlotIds.length === 0
    ) {
      throw new BadRequestException(
        'Source and target slot arrays must both contain at least one slot',
      );
    }

    const sourceEntries = await Promise.all(
      params.sourceSlotIds.map((id) => this.entryRepo.findById(id)),
    );
    const validSource = sourceEntries.find((e) => e !== null);
    if (!validSource) {
      throw new NotFoundException('No valid source slot found');
    }

    const targetEntries = await Promise.all(
      params.targetSlotIds.map((id) => this.entryRepo.findById(id)),
    );

    const previousStates = targetEntries.map((t) => ({
      slotId: t!._id,
      subjectId: t!.subjectId,
      facultyId: t!.facultyId,
      roomId: t!.roomId,
      type: t!.type,
    }));

    const updatedEntries: ScheduleEntry[] = [];

    for (let i = 0; i < targetEntries.length; i++) {
      const target = targetEntries[i]!;
      const source = sourceEntries[i % sourceEntries.length] || validSource;

      const update: Partial<ScheduleEntry> = {
        revision: target.revision + 1,
      };

      if (params.mode === 'full') {
        update.subjectId = source.subjectId;
        update.facultyId = source.facultyId;
        update.roomId = source.roomId;
        update.type = source.type;
      } else if (params.mode === 'subject_only') {
        update.subjectId = source.subjectId;
        update.type = source.type;
      } else if (params.mode === 'faculty_only') {
        update.facultyId = source.facultyId;
      } else if (params.mode === 'room_only') {
        update.roomId = source.roomId;
      }

      const updated = await this.entryRepo.update(
        target._id,
        update,
        context.session,
      );
      updatedEntries.push(updated!);

      // Re-sync occupancy
      await this.occupancyRepo.deleteByEntryId(target._id, context.session);
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
    const states = inverse['states'] as Array<{
      slotId: string;
      subjectId?: string;
      facultyId?: string;
      roomId?: string;
      type: SlotType;
    }>;

    const restored: ScheduleEntry[] = [];
    for (const s of states) {
      const updated = await this.entryRepo.update(
        s.slotId,
        {
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
          type: s.type,
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
