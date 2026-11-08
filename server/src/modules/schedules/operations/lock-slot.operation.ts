// Command implementation for locking and unlocking slots by cell, row, day, or whole timetable.
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { LockSlotDto } from '@slotly/contracts';

/** Command implementing scoped lock and unlock operations. */
@Injectable()
export class LockSlotOperation implements IScheduleCommand<
  LockSlotDto,
  ScheduleEntry[]
> {
  readonly type = 'lock';

  constructor(private readonly entryRepo: ScheduleEntryRepository) {}

  async apply(
    params: LockSlotDto,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    let targetEntries: ScheduleEntry[] = [];

    if (params.scope === 'cell') {
      if (!params.slotId) {
        throw new BadRequestException('slotId is required for cell-level lock');
      }
      const entry = await this.entryRepo.findById(params.slotId);
      if (entry && entry.versionId === context.versionId) {
        targetEntries = [entry];
      }
    } else if (params.scope === 'row') {
      if (params.period === undefined) {
        throw new BadRequestException('period is required for row-level lock');
      }
      const all = await this.entryRepo.findByVersion(context.versionId);
      targetEntries = all.filter(
        (e) =>
          e.startPeriod <= params.period! &&
          params.period! < e.startPeriod + e.span,
      );
    } else if (params.scope === 'day') {
      if (params.day === undefined) {
        throw new BadRequestException('day is required for day-level lock');
      }
      targetEntries = await this.entryRepo.findByFilter({
        versionId: context.versionId,
        day: params.day,
      });
    } else if (params.scope === 'timetable') {
      targetEntries = await this.entryRepo.findByVersion(context.versionId);
    }

    const previousLockStates = targetEntries.map((e) => ({
      slotId: e._id,
      locked: e.locked,
    }));

    const updatedEntries: ScheduleEntry[] = [];
    for (const e of targetEntries) {
      const updated = await this.entryRepo.update(
        e._id,
        {
          locked: params.locked,
          revision: e.revision + 1,
        },
        context.session,
      );
      if (updated) updatedEntries.push(updated);
    }

    return {
      type: this.type,
      forward: params as unknown as Record<string, unknown>,
      inverse: { states: previousLockStates },
      affectedEntries: updatedEntries,
      resultData: updatedEntries,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    const states =
      (inverse['states'] as Array<{ slotId: string; locked: boolean }>) || [];
    const restoredEntries: ScheduleEntry[] = [];

    for (const s of states) {
      const updated = await this.entryRepo.update(
        s.slotId,
        { locked: s.locked },
        context.session,
      );
      if (updated) restoredEntries.push(updated);
    }

    return {
      type: this.type,
      forward: inverse,
      inverse: {},
      affectedEntries: restoredEntries,
      resultData: restoredEntries,
    };
  }
}
