// Chain-of-responsibility validator checking timetable version mutability.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting version is not published or archived. */
export class VersionEditableValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    if (
      context.versionStatus === 'published' ||
      context.versionStatus === 'archived'
    ) {
      return {
        valid: false,
        code: 'VERSION_IMMUTABLE',
        reason:
          'Published versions are immutable. A new draft revision must be created to make changes.',
        suggestions: [
          {
            type: 'period',
            description: 'Create a new draft revision to modify this schedule.',
          },
        ],
      };
    }
    return null;
  }
}
