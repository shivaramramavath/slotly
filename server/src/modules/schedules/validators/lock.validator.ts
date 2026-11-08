// Chain-of-responsibility validator checking if slot is locked.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting entry is not locked. */
export class LockValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    if (context.entry.locked) {
      return {
        valid: false,
        code: 'SLOT_LOCKED',
        reason: 'This slot is locked and cannot be moved, edited, or cleared.',
        suggestions: [
          {
            type: 'swap',
            description:
              'Unlock this slot first to edit its timing or placement.',
          },
        ],
      };
    }
    return null;
  }
}
