// Chain-of-responsibility validator checking if target period falls on a scheduled break.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting slot does not overwrite a scheduled break. */
export class BreakValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const breaks = context.engineInput.settings.breaks || [];
    const span = context.target.span ?? context.entry.span ?? 1;
    const start = context.target.startPeriod;
    const end = start + span - 1;

    for (const b of breaks) {
      if (b.period >= start && b.period <= end) {
        return {
          valid: false,
          code: 'BREAK_NOT_OVERWRITABLE',
          reason: `Target period ${b.period} is designated as ${b.name || 'Break'} and cannot be overwritten.`,
          suggestions: [
            {
              type: 'period',
              description: `Move after the break to period ${b.period + 1}.`,
              day: context.target.day,
              period: b.period + 1,
            },
          ],
        };
      }
    }
    return null;
  }
}
