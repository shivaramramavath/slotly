// Command implementation for splitting a multi-period slot into individual period slots.
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
import type { SplitSlotDto } from '@slotly/contracts';

/** Command implementing slot splitting mutation with inverse compensation. */
@Injectable()
export class SplitSlotOperation implements IScheduleCommand<
  SplitSlotDto & { slotId: string },
  ScheduleEntry[]
> {
  readonly type = 'split';

  constructor(
    private readonly entryRepo: ScheduleEntryRepository,
    private readonly occupancyRepo: ScheduleOccupancyRepository,
  ) {}

  async apply(
    params: SplitSlotDto & { slotId: string },
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    const entry = await this.entryRepo.findById(params.slotId);
    if (!entry || entry.versionId !== context.versionId) {
      throw new NotFoundException(
        `Slot '${params.slotId}' not found in version '${context.versionId}'`,
      );
    }

    if (entry.span <= 1) {
      throw new BadRequestException(
        `Cannot split slot '${params.slotId}' because its span is already 1`,
      );
    }

    const previousSpan = entry.span;
    // Determine spans: default to array of 1s
    const spans =
      params.splitIntoSpans && params.splitIntoSpans.length > 0
        ? params.splitIntoSpans
        : Array.from({ length: entry.span }, () => 1);

    const totalSpan = spans.reduce((sum, s) => sum + s, 0);
    if (totalSpan !== entry.span) {
      throw new BadRequestException(
        `Split spans sum (${totalSpan}) does not match entry span (${entry.span})`,
      );
    }

    // Shrink the primary entry to the first split span
    const firstSpan = spans[0]!;
    const updatedFirst = await this.entryRepo.update(
      entry._id,
      {
        span: firstSpan,
        revision: entry.revision + 1,
      },
      context.session,
    );

    // Create new entries for the remaining spans
    const createdEntries: ScheduleEntry[] = [];
    let currentPeriod = entry.startPeriod + firstSpan;

    for (let i = 1; i < spans.length; i++) {
      const s = spans[i]!;
      const newEntry = await this.entryRepo.create(
        {
          _id: randomUUID(),
          versionId: context.versionId,
          sectionId: entry.sectionId,
          batchId: entry.batchId,
          day: entry.day,
          startPeriod: currentPeriod,
          span: s,
          type: entry.type,
          subjectId: entry.subjectId,
          facultyId: entry.facultyId,
          roomId: entry.roomId,
          locked: entry.locked,
          revision: 1,
        },
        context.session,
      );
      createdEntries.push(newEntry);
      currentPeriod += s;
    }

    // Re-sync occupancies for all resulting entries
    await this.occupancyRepo.deleteByEntryId(entry._id, context.session);
    const allResulting = [updatedFirst!, ...createdEntries];
    const newOccupancies = [];

    for (const e of allResulting) {
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
      inverse: {
        primarySlotId: entry._id,
        originalSpan: previousSpan,
        createdSlotIds: createdEntries.map((e) => e._id),
      },
      affectedEntries: allResulting,
      resultData: allResulting,
    };
  }

  async revert(
    inverse: Record<string, unknown>,
    context: ScheduleOperationContext,
  ): Promise<ScheduleOperationResult<ScheduleEntry[]>> {
    const primarySlotId = inverse['primarySlotId'] as string;
    const originalSpan = inverse['originalSpan'] as number;
    const createdSlotIds = (inverse['createdSlotIds'] as string[]) || [];

    // Delete created entries
    for (const cid of createdSlotIds) {
      await this.entryRepo.delete(cid, context.session);
      await this.occupancyRepo.deleteByEntryId(cid, context.session);
    }

    // Restore primary entry span
    const restored = await this.entryRepo.update(
      primarySlotId,
      { span: originalSpan },
      context.session,
    );

    // Re-sync occupancy for restored span
    await this.occupancyRepo.deleteByEntryId(primarySlotId, context.session);
    const newOccupancies = [];
    for (
      let p = restored!.startPeriod;
      p < restored!.startPeriod + originalSpan;
      p++
    ) {
      newOccupancies.push({
        _id: randomUUID(),
        versionId: context.versionId,
        resourceType: 'section' as const,
        resourceId: restored!.sectionId,
        day: restored!.day,
        period: p,
        entryId: restored!._id,
      });
      if (restored!.facultyId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'faculty' as const,
          resourceId: restored!.facultyId,
          day: restored!.day,
          period: p,
          entryId: restored!._id,
        });
      }
      if (restored!.roomId) {
        newOccupancies.push({
          _id: randomUUID(),
          versionId: context.versionId,
          resourceType: 'room' as const,
          resourceId: restored!.roomId,
          day: restored!.day,
          period: p,
          entryId: restored!._id,
        });
      }
    }
    await this.occupancyRepo.createMany(newOccupancies, context.session);

    return {
      type: this.type,
      forward: inverse,
      inverse: { primarySlotId },
      affectedEntries: [restored!],
      resultData: [restored!],
    };
  }
}
