// Command implementation for applying constraint solver suggestions to resolve conflicts.
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { MoveSlotOperation } from './move-slot.operation';
import { EditSlotOperation } from './edit-slot.operation';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type { ViolationSuggestion } from '@slotly/contracts';

/** Command applying a conflict-resolution suggestion to a slot. */
@Injectable()
export class ApplySuggestionOperation implements IScheduleCommand<
  { slotId: string; suggestion: ViolationSuggestion },
  ScheduleEntry
> {
  readonly type = 'apply_suggestion';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly moveOp: MoveSlotOperation,
    private readonly editOp: EditSlotOperation,
  ) {}

  async apply(
    params: { slotId: string; suggestion: ViolationSuggestion },
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    const entry = await this.entryRepo.findById(params.slotId);
    if (!entry || entry.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot '${params.slotId}' not found in version '${context.versionId}'`,
      );
    }

    const { suggestion } = params;

    if (
      suggestion.type === 'period' &&
      suggestion.day !== undefined &&
      suggestion.period !== undefined
    ) {
      const res = await this.moveOp.apply(
        {
          slotId: entry._id,
          targetDay: suggestion.day,
          targetStartPeriod: suggestion.period,
          targetRoomId: suggestion.roomId,
          targetFacultyId: suggestion.facultyId,
        },
        context,
      );
      return {
        type: this.type,
        forward: params as unknown as Record<string, unknown>,
        inverse: res.inverse,
        affectedEntries: res.affectedEntries,
        resultData: res.resultData,
      };
    }

    if (suggestion.type === 'room' && suggestion.roomId) {
      const res = await this.editOp.apply(
        {
          slotId: entry._id,
          roomId: suggestion.roomId,
        },
        context,
      );
      return {
        type: this.type,
        forward: params as unknown as Record<string, unknown>,
        inverse: res.inverse,
        affectedEntries: res.affectedEntries,
        resultData: res.resultData,
      };
    }

    if (suggestion.type === 'faculty' && suggestion.facultyId) {
      const res = await this.editOp.apply(
        {
          slotId: entry._id,
          facultyId: suggestion.facultyId,
        },
        context,
      );
      return {
        type: this.type,
        forward: params as unknown as Record<string, unknown>,
        inverse: res.inverse,
        affectedEntries: res.affectedEntries,
        resultData: res.resultData,
      };
    }

    // Default fallback
    return {
      type: this.type,
      forward: params as unknown as Record<string, unknown>,
      inverse: {},
      affectedEntries: [entry],
      resultData: entry,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry>> {
    return this.moveOp.revert(inverse, context);
  }
}
