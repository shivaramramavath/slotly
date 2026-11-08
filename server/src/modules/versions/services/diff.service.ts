// Domain service computing structural and analytical differences between timetable versions.
import { Injectable } from '@nestjs/common';
import type {
  ConflictDelta,
  FacultyWorkloadDelta,
  ScoreDelta,
  SlotChangeDetail,
  SlotDiffItem,
  VersionDiffDto,
} from '@slotly/contracts';
import {
  ChangeSummaryService,
  type SummaryLookups,
} from './change-summary.service';

/** Minimal slot representation required for comparison diff computation. */
export interface DiffableSlot {
  id?: string | undefined;
  sectionId: string;
  batchId?: string | undefined;
  subjectId?: string | undefined;
  facultyId?: string | undefined;
  roomId?: string | undefined;
  day: number;
  period?: number | undefined;
  startPeriod?: number | undefined;
  span?: number | undefined;
  type?: string | undefined;
}

/** Minimal schedule version representation required for diffing. */
export interface DiffableVersion {
  id: string;
  slots: DiffableSlot[];
  conflicts?: Array<{ severity?: string }> | undefined;
  score?: number | undefined;
}

/** Optional lookup dictionaries for human-readable labels in diff summaries. */
export type DiffLookups = SummaryLookups;

/** Extracts start period cleanly regardless of whether slot uses period or startPeriod. */
function getStartPeriod(slot: DiffableSlot): number {
  return slot.startPeriod ?? slot.period ?? 1;
}

/** Injectable service providing pure timetable version comparison and diff computation. */
@Injectable()
export class DiffService {
  constructor(private readonly changeSummaryService: ChangeSummaryService) {}

  /**
   * Computes added, removed, and changed slots, workload deltas, conflict deltas, and summaries.
   */
  compare(
    leftVersion: DiffableVersion,
    rightVersion: DiffableVersion,
    lookups?: DiffLookups,
  ): VersionDiffDto {
    const leftSlots = [...(leftVersion.slots || [])];
    const rightSlots = [...(rightVersion.slots || [])];

    const matchedLeftIndices = new Set<number>();
    const matchedRightIndices = new Set<number>();

    const changed: SlotDiffItem[] = [];

    // Pass 1: Match by explicit slot id if present on both sides
    for (let l = 0; l < leftSlots.length; l++) {
      const left = leftSlots[l];
      if (!left || !left.id) continue;
      const r = rightSlots.findIndex(
        (right, rIdx) =>
          !matchedRightIndices.has(rIdx) && right?.id === left.id,
      );
      const rightSlot = r !== -1 ? rightSlots[r] : undefined;
      if (rightSlot) {
        matchedLeftIndices.add(l);
        matchedRightIndices.add(r);
        this.evaluateSlotDiff(left, rightSlot, changed);
      }
    }

    // Pass 2: Match remaining slots by (sectionId, subjectId, batchId)
    for (let l = 0; l < leftSlots.length; l++) {
      if (matchedLeftIndices.has(l)) continue;
      const left = leftSlots[l];
      if (!left) continue;

      const r = rightSlots.findIndex(
        (right, rIdx) =>
          !matchedRightIndices.has(rIdx) &&
          right &&
          right.sectionId === left.sectionId &&
          right.subjectId === left.subjectId &&
          (right.batchId || '') === (left.batchId || ''),
      );

      const rightSlot = r !== -1 ? rightSlots[r] : undefined;
      if (rightSlot) {
        matchedLeftIndices.add(l);
        matchedRightIndices.add(r);
        this.evaluateSlotDiff(left, rightSlot, changed);
      }
    }

    // Pass 3: Match remaining slots by (sectionId, day, startPeriod)
    for (let l = 0; l < leftSlots.length; l++) {
      if (matchedLeftIndices.has(l)) continue;
      const left = leftSlots[l];
      if (!left) continue;

      const r = rightSlots.findIndex(
        (right, rIdx) =>
          !matchedRightIndices.has(rIdx) &&
          right &&
          right.sectionId === left.sectionId &&
          right.day === left.day &&
          getStartPeriod(right) === getStartPeriod(left),
      );

      const rightSlot = r !== -1 ? rightSlots[r] : undefined;
      if (rightSlot) {
        matchedLeftIndices.add(l);
        matchedRightIndices.add(r);
        this.evaluateSlotDiff(left, rightSlot, changed);
      }
    }

    // Leftover left slots are removed
    const removed: SlotDiffItem[] = [];
    for (let l = 0; l < leftSlots.length; l++) {
      if (!matchedLeftIndices.has(l)) {
        const slot = leftSlots[l];
        if (slot) {
          removed.push({
            slotId: slot.id,
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            facultyId: slot.facultyId,
            roomId: slot.roomId,
            day: slot.day,
            startPeriod: getStartPeriod(slot),
            span: slot.span || 1,
            type: slot.type,
          });
        }
      }
    }

    // Leftover right slots are added
    const added: SlotDiffItem[] = [];
    for (let r = 0; r < rightSlots.length; r++) {
      if (!matchedRightIndices.has(r)) {
        const slot = rightSlots[r];
        if (slot) {
          added.push({
            slotId: slot.id,
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            facultyId: slot.facultyId,
            roomId: slot.roomId,
            day: slot.day,
            startPeriod: getStartPeriod(slot),
            span: slot.span || 1,
            type: slot.type,
          });
        }
      }
    }

    // Workload deltas
    const workloadDeltas = this.computeWorkloadDeltas(
      leftSlots,
      rightSlots,
      lookups,
    );

    // Conflict deltas
    const leftConflicts = leftVersion.conflicts || [];
    const rightConflicts = rightVersion.conflicts || [];
    const conflictDelta: ConflictDelta = {
      fromCount: leftConflicts.length,
      toCount: rightConflicts.length,
      delta: rightConflicts.length - leftConflicts.length,
    };

    // Score deltas
    const fromScore = leftVersion.score ?? 100;
    const toScore = rightVersion.score ?? 100;
    const scoreDelta: ScoreDelta = {
      fromScore,
      toScore,
      delta: toScore - fromScore,
    };

    // Generate natural text summaries
    const summaries = this.changeSummaryService.generateSummaries(
      added,
      removed,
      changed,
      workloadDeltas,
      conflictDelta,
      scoreDelta,
      lookups,
    );

    return {
      leftVersionId: leftVersion.id,
      rightVersionId: rightVersion.id,
      added,
      removed,
      changed,
      workloadDeltas,
      conflictDelta,
      scoreDelta,
      summaries,
    };
  }

  /** Checks differences between matched left and right slots. */
  private evaluateSlotDiff(
    left: DiffableSlot,
    right: DiffableSlot,
    changedList: SlotDiffItem[],
  ): void {
    const changes: SlotChangeDetail[] = [];
    const leftStartPeriod = getStartPeriod(left);
    const rightStartPeriod = getStartPeriod(right);

    // Check time change
    if (left.day !== right.day || leftStartPeriod !== rightStartPeriod) {
      changes.push({
        field: 'time',
        from: {
          day: left.day,
          startPeriod: leftStartPeriod,
          span: left.span || 1,
        },
        to: {
          day: right.day,
          startPeriod: rightStartPeriod,
          span: right.span || 1,
        },
      });
    }

    // Check span
    if ((left.span || 1) !== (right.span || 1)) {
      changes.push({
        field: 'span',
        from: left.span || 1,
        to: right.span || 1,
      });
    }

    // Check subject
    if (left.subjectId !== right.subjectId) {
      changes.push({
        field: 'subject',
        from: left.subjectId,
        to: right.subjectId,
      });
    }

    // Check faculty
    if (left.facultyId !== right.facultyId) {
      changes.push({
        field: 'faculty',
        from: left.facultyId,
        to: right.facultyId,
      });
    }

    // Check room
    if (left.roomId !== right.roomId) {
      changes.push({
        field: 'room',
        from: left.roomId,
        to: right.roomId,
      });
    }

    // Check type
    if (left.type !== right.type) {
      changes.push({
        field: 'type',
        from: left.type,
        to: right.type,
      });
    }

    if (changes.length > 0) {
      changedList.push({
        slotId: right.id || left.id,
        sectionId: right.sectionId,
        subjectId: right.subjectId || left.subjectId,
        facultyId: right.facultyId || left.facultyId,
        roomId: right.roomId || left.roomId,
        day: right.day,
        startPeriod: rightStartPeriod,
        span: right.span || left.span || 1,
        type: right.type || left.type,
        changes,
      });
    }
  }

  /** Computes workload delta per faculty between two sets of slots. */
  private computeWorkloadDeltas(
    leftSlots: DiffableSlot[],
    rightSlots: DiffableSlot[],
    lookups?: DiffLookups,
  ): FacultyWorkloadDelta[] {
    const facultyLoads = new Map<string, { from: number; to: number }>();

    for (const slot of leftSlots) {
      if (slot && slot.facultyId) {
        const span = slot.span || 1;
        const current = facultyLoads.get(slot.facultyId) || { from: 0, to: 0 };
        current.from += span;
        facultyLoads.set(slot.facultyId, current);
      }
    }

    for (const slot of rightSlots) {
      if (slot && slot.facultyId) {
        const span = slot.span || 1;
        const current = facultyLoads.get(slot.facultyId) || { from: 0, to: 0 };
        current.to += span;
        facultyLoads.set(slot.facultyId, current);
      }
    }

    const deltas: FacultyWorkloadDelta[] = [];
    for (const [facultyId, load] of facultyLoads.entries()) {
      const delta = load.to - load.from;
      if (delta !== 0) {
        deltas.push({
          facultyId,
          facultyName: lookups?.faculties?.[facultyId],
          fromPeriods: load.from,
          toPeriods: load.to,
          delta,
        });
      }
    }

    return deltas;
  }
}
