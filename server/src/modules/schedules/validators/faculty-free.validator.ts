// Chain-of-responsibility validator checking if faculty is free at target time.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting faculty is not double booked at the target time. */
export class FacultyFreeValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const facultyId = context.target.facultyId ?? context.entry.facultyId;
    if (!facultyId) return null;

    const span = context.target.span ?? context.entry.span ?? 1;
    const targetStart = context.target.startPeriod;
    const targetEnd = targetStart + span - 1;

    const collision = context.existingEntries.find((other) => {
      if (other._id === context.entry._id) return false;
      if (
        context.isSwap &&
        context.swapWithEntry &&
        other._id === context.swapWithEntry._id
      ) {
        return false;
      }
      if (other.facultyId !== facultyId) return false;
      if (other.day !== context.target.day) return false;

      const otherStart = other.startPeriod;
      const otherEnd = otherStart + other.span - 1;
      return targetStart <= otherEnd && otherStart <= targetEnd;
    });

    if (collision) {
      const faculty = context.engineInput.faculty.find(
        (f) => f.id === facultyId,
      );
      const facultyName = faculty?.name || facultyId;
      return {
        valid: false,
        code: 'FACULTY_DOUBLE_BOOKED',
        reason: `${facultyName} is already teaching section ${collision.sectionId} on day ${context.target.day}, period ${targetStart}.`,
        suggestions: [
          {
            type: 'faculty',
            description:
              'Assign a different qualified faculty member for this session.',
          },
        ],
      };
    }

    return null;
  }
}
