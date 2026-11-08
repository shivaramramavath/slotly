// Chain-of-responsibility validator checking faculty working hours availability.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting faculty is available according to their availability matrix. */
export class FacultyAvailabilityValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const facultyId = context.target.facultyId ?? context.entry.facultyId;
    if (!facultyId) return null;

    const faculty = context.engineInput.faculty.find((f) => f.id === facultyId);
    if (!faculty || !faculty.availability) return null;

    const span = context.target.span ?? context.entry.span ?? 1;
    const start = context.target.startPeriod;
    const day = context.target.day;

    for (let p = start; p < start + span; p++) {
      const dayAvail = faculty.availability[day];
      // period index: if 1-based, period 1 is index 0 or index 1
      const isAvailable = dayAvail ? (dayAvail[p - 1] ?? dayAvail[p]) : true;
      if (isAvailable === false) {
        return {
          valid: false,
          code: 'FACULTY_UNAVAILABLE',
          reason: `${faculty.name} is unavailable on day ${day}, period ${p} due to personal availability preferences.`,
          suggestions: [
            {
              type: 'period',
              description: `Move to an available time slot for ${faculty.name}.`,
            },
          ],
        };
      }
    }

    return null;
  }
}
