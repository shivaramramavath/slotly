// Command implementation for updating timetable period configurations and detecting non-fitting entries.
import { Injectable } from '@nestjs/common';
import {
  IScheduleCommand,
  ScheduleOperationContext,
  ScheduleOperationResult,
} from './schedule-operation.interface';
import { ScheduleEntryRepository } from '../repositories/schedule-entry.repository';
import { ScheduleEntry } from '../schemas/schedule-entry.schema';
import type {
  UpdatePeriodsDto,
  PeriodsChangeResultDto,
} from '@slotly/contracts';

/** Command implementing period configuration adjustments and non-fitting slot detection. */
@Injectable()
export class ChangePeriodConfigOperation implements IScheduleCommand<
  UpdatePeriodsDto,
  PeriodsChangeResultDto
> {
  readonly type = 'change_period_config';

  constructor(private readonly entryRepo: ScheduleEntryRepository) {}

  async apply(
    params: UpdatePeriodsDto,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<PeriodsChangeResultDto>> {
    const allEntries = await this.entryRepo.findByVersion(context.versionId);
    const invalidEntries: Array<{
      id: string;
      day: number;
      startPeriod: number;
      span: number;
      reason: string;
    }> = [];

    const totalPeriods = params.periodsPerDay;

    for (const entry of allEntries) {
      if (entry.startPeriod + entry.span - 1 > totalPeriods) {
        invalidEntries.push({
          id: entry._id,
          day: entry.day,
          startPeriod: entry.startPeriod,
          span: entry.span,
          reason: `Slot extends beyond total periods (${totalPeriods})`,
        });
      }
    }

    if (params.dryRun) {
      return {
        type: this.type,
        forward: params as unknown as Record<string, unknown>,
        inverse: {},
        affectedEntries: [],
        resultData: {
          updated: false,
          invalidEntries,
          invalidEntriesCount: invalidEntries.length,
        },
      };
    }

    // If not dry-run and not fitting, remove invalid entries
    const affected: ScheduleEntry[] = [];
    for (const inv of invalidEntries) {
      await this.entryRepo.delete(inv.id, context.session);
    }

    return {
      type: this.type,
      forward: params as unknown as Record<string, unknown>,
      inverse: { removed: invalidEntries },
      affectedEntries: affected,
      resultData: {
        updated: true,
        invalidEntries,
        invalidEntriesCount: invalidEntries.length,
      },
    };
  }

  revert(): Promise<ScheduleOperationResult<PeriodsChangeResultDto>> {
    return Promise.resolve({
      type: this.type,
      forward: {},
      inverse: {},
      affectedEntries: [],
      resultData: {
        updated: true,
        invalidEntries: [],
        invalidEntriesCount: 0,
      },
    });
  }
}
