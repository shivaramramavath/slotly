// Command implementation for clearing an assigned slot cell.
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../repositories/schedule-occupancy.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { SlotType } from '@slotly/contracts';

/** Command implementing slot clearing with inverse compensation. */
@Injectable()
export class ClearSlotOperation implements IScheduleCommand<
  { slotId: string },
  ScheduleEntry
> {
  readonly type = 'clear';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: { slotId: string },
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
      subjectId: entry.subjectId,
      facultyId: entry.facultyId,
      roomId: entry.roomId,
      type: entry.type,
      batchId: entry.batchId,
      locked: entry.locked,
    };

    const updated = await this.entryRepo.update(
      entry._id,
      {
        subjectId: undefined,
        facultyId: undefined,
        roomId: undefined,
        type: 'theory',
        batchId: undefined,
        revision: entry.revision + 1,
      },
      context.session,
    );

    // Delete occupancies
    await this.occupancyRepo.deleteByEntryId(entry._id, context.session);

    return {
      type: this.type,
      forward: params,
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
    const entry = await this.entryRepo.findById(slotId);
    if (!entry) throw new NotFoundException(`Slot '${slotId}' not found`);

    const updated = await this.entryRepo.update(
      slotId,
      {
        subjectId: inverse['subjectId'] as string | undefined,
        facultyId: inverse['facultyId'] as string | undefined,
        roomId: inverse['roomId'] as string | undefined,
        type: (inverse['type'] as SlotType) || 'theory',
        batchId: inverse['batchId'] as string | undefined,
        locked: Boolean(inverse['locked']),
        revision: entry.revision + 1,
      },
      context.session,
    );

    return {
      type: this.type,
      forward: inverse,
      inverse: { slotId },
      affectedEntries: [updated!],
      resultData: updated!,
    };
  }
}
