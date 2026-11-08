// Domain service generating natural-language change summaries from version diffs without AI.
import { Injectable } from '@nestjs/common';
import type {
  ConflictDelta,
  FacultyWorkloadDelta,
  ScoreDelta,
  SlotDiffItem,
} from '@slotly/contracts';

/** Day name lookup table for standard weekday indices (1=Mon..7=Sun). */
const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

/** Minimal payload shape for time changes in slot diff details. */
interface TimeChangePayload {
  day: number;
  startPeriod: number;
  span?: number | undefined;
}

/** Lookup dictionary structure for human-readable labels in change summaries. */
export interface SummaryLookups {
  subjects?: Record<string, string> | undefined;
  faculties?: Record<string, string> | undefined;
  rooms?: Record<string, string> | undefined;
  sections?: Record<string, string> | undefined;
}

/** Formats day number into abbreviated day name. */
function formatDay(day: number): string {
  return DAY_NAMES[day] || `Day ${day}`;
}

/** Formats period and span into human-readable period label (e.g. P1 or P1-P2). */
function formatPeriod(startPeriod: number, span?: number): string {
  if (!span || span <= 1) {
    return `P${startPeriod}`;
  }
  return `P${startPeriod}-P${startPeriod + span - 1}`;
}

/** Injectable service providing human-readable change summaries from version diff items. */
@Injectable()
export class ChangeSummaryService {
  /**
   * Generates readable summary sentences from added, removed, and changed slot items and deltas.
   */
  generateSummaries(
    added: SlotDiffItem[],
    removed: SlotDiffItem[],
    changed: SlotDiffItem[],
    workloadDeltas?: FacultyWorkloadDelta[],
    conflictDelta?: ConflictDelta,
    scoreDelta?: ScoreDelta,
    lookups?: SummaryLookups,
  ): string[] {
    const summaries: string[] = [];
    const subjects = lookups?.subjects || {};
    const faculties = lookups?.faculties || {};
    const rooms = lookups?.rooms || {};

    const resolveSubject = (id?: string) =>
      (id && subjects[id]) || id || 'Class';
    const resolveFaculty = (id?: string) =>
      (id && faculties[id]) || id || 'Unassigned';
    const resolveRoom = (id?: string) =>
      (id && rooms[id]) || id || 'Unassigned Room';

    // 1. Changed slots
    for (const item of changed) {
      const subjectName = resolveSubject(item.subjectId);
      const changes = item.changes || [];

      // Check if time moved
      const timeChange = changes.find((c) => c.field === 'time');
      if (timeChange && timeChange.from && timeChange.to) {
        const fromTime = timeChange.from as TimeChangePayload;
        const toTime = timeChange.to as TimeChangePayload;
        const fromDay = formatDay(fromTime.day);
        const fromP = formatPeriod(fromTime.startPeriod, fromTime.span);
        const toDay = formatDay(toTime.day);
        const toP = formatPeriod(toTime.startPeriod, toTime.span);
        summaries.push(
          `${subjectName} moved from ${fromDay} ${fromP} to ${toDay} ${toP}`,
        );
      }

      // Check faculty change
      const facultyChange = changes.find((c) => c.field === 'faculty');
      if (facultyChange) {
        const fromF = resolveFaculty(
          typeof facultyChange.from === 'string'
            ? facultyChange.from
            : undefined,
        );
        const toF = resolveFaculty(
          typeof facultyChange.to === 'string' ? facultyChange.to : undefined,
        );
        summaries.push(
          `${subjectName} faculty changed from ${fromF} to ${toF}`,
        );
      }

      // Check room change
      const roomChange = changes.find((c) => c.field === 'room');
      if (roomChange) {
        const fromR = resolveRoom(
          typeof roomChange.from === 'string' ? roomChange.from : undefined,
        );
        const toR = resolveRoom(
          typeof roomChange.to === 'string' ? roomChange.to : undefined,
        );
        summaries.push(`${subjectName} room changed from ${fromR} to ${toR}`);
      }

      // Check subject change
      const subjectChange = changes.find((c) => c.field === 'subject');
      if (subjectChange) {
        const fromS = resolveSubject(
          typeof subjectChange.from === 'string'
            ? subjectChange.from
            : undefined,
        );
        const toS = resolveSubject(
          typeof subjectChange.to === 'string' ? subjectChange.to : undefined,
        );
        const day = formatDay(item.day);
        const period = formatPeriod(item.startPeriod, item.span);
        summaries.push(
          `Slot at ${day} ${period} changed subject from ${fromS} to ${toS}`,
        );
      }
    }

    // 2. Added slots
    for (const item of added) {
      const subjectName = resolveSubject(item.subjectId);
      const day = formatDay(item.day);
      const period = formatPeriod(item.startPeriod, item.span);
      summaries.push(`${subjectName} added at ${day} ${period}`);
    }

    // 3. Removed slots
    for (const item of removed) {
      const subjectName = resolveSubject(item.subjectId);
      const day = formatDay(item.day);
      const period = formatPeriod(item.startPeriod, item.span);
      summaries.push(`${subjectName} removed from ${day} ${period}`);
    }

    // 4. Faculty workload deltas
    if (workloadDeltas && workloadDeltas.length > 0) {
      for (const wl of workloadDeltas) {
        if (wl.delta !== 0) {
          const facultyName = wl.facultyName || resolveFaculty(wl.facultyId);
          const dir = wl.delta > 0 ? 'increased' : 'decreased';
          const count = Math.abs(wl.delta);
          const unit = count === 1 ? 'period' : 'periods';
          summaries.push(
            `${facultyName} workload ${dir} by ${count} ${unit} (${wl.fromPeriods} -> ${wl.toPeriods})`,
          );
        }
      }
    }

    // 5. Conflict delta
    if (conflictDelta && conflictDelta.delta !== 0) {
      const dir = conflictDelta.delta > 0 ? 'increased' : 'decreased';
      const count = Math.abs(conflictDelta.delta);
      summaries.push(
        `Total conflicts ${dir} by ${count} (${conflictDelta.fromCount} -> ${conflictDelta.toCount})`,
      );
    }

    // 6. Score delta
    if (scoreDelta && scoreDelta.delta !== 0) {
      const sign = scoreDelta.delta > 0 ? '+' : '';
      summaries.push(
        `Timetable score changed from ${scoreDelta.fromScore} to ${scoreDelta.toScore} (${sign}${scoreDelta.delta})`,
      );
    }

    return summaries;
  }
}
