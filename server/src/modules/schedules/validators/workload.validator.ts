// Chain-of-responsibility validator checking daily and weekly faculty teaching limits.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting faculty daily and weekly teaching workloads remain within limits. */
export class WorkloadValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const facultyId = context.target.facultyId ?? context.entry.facultyId;
    if (!facultyId) return null;

    const faculty = context.engineInput.faculty.find((f) => f.id === facultyId);
    if (!faculty) return null;

    const maxDaily = faculty.maxHoursPerDay ?? 6;
    const maxWeekly = faculty.maxHoursPerWeek ?? 24;

    const span = context.target.span ?? context.entry.span ?? 1;
    const targetDay = context.target.day;

    // Calculate daily workload on target day
    let currentDailyHours = 0;
    let currentWeeklyHours = 0;

    for (const e of context.existingEntries) {
      if (e._id === context.entry._id) continue;
      if (e.facultyId !== facultyId) continue;

      currentWeeklyHours += e.span;
      if (e.day === targetDay) {
        currentDailyHours += e.span;
      }
    }

    if (currentDailyHours + span > maxDaily) {
      return {
        valid: false,
        code: 'FACULTY_MAX_HOURS_PER_DAY_EXCEEDED',
        reason: `${faculty.name} would exceed their maximum daily teaching limit of ${maxDaily} hours on day ${targetDay} (${currentDailyHours + span}/${maxDaily} hrs).`,
        suggestions: [
          {
            type: 'period',
            description: `Move this session to another day with lighter teaching load for ${faculty.name}.`,
          },
        ],
      };
    }

    if (currentWeeklyHours + span > maxWeekly) {
      return {
        valid: false,
        code: 'FACULTY_MAX_HOURS_PER_WEEK_EXCEEDED',
        reason: `${faculty.name} would exceed their weekly teaching limit of ${maxWeekly} hours (${currentWeeklyHours + span}/${maxWeekly} hrs).`,
        suggestions: [
          {
            type: 'faculty',
            description:
              'Assign another qualified instructor with available teaching capacity.',
          },
        ],
      };
    }

    return null;
  }
}
