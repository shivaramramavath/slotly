// Chain-of-responsibility validator checking if the target section slot is free.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting section slot is unoccupied unless a swap is requested. */
export class TargetFreeValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    if (context.isSwap) {
      return null;
    }

    const span = context.target.span ?? context.entry.span ?? 1;
    const targetStart = context.target.startPeriod;
    const targetEnd = targetStart + span - 1;

    // Check collision in the same section
    const collision = context.existingEntries.find((other) => {
      if (other._id === context.entry._id) return false;
      if (other.sectionId !== context.entry.sectionId) return false;
      if (other.day !== context.target.day) return false;

      const otherStart = other.startPeriod;
      const otherEnd = otherStart + other.span - 1;
      return targetStart <= otherEnd && otherStart <= targetEnd;
    });

    if (collision) {
      return {
        valid: false,
        code: 'SECTION_DOUBLE_BOOKED',
        reason: `Target slot on day ${context.target.day}, period ${targetStart} is already occupied by another class.`,
        suggestions: [
          {
            type: 'swap',
            description: `Swap with ${collision.subjectId || 'current class'}.`,
          },
        ],
      };
    }

    return null;
  }
}
