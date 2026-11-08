// Chain-of-responsibility validator checking continuous lab block requirements.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting laboratory entries remain continuous and fit daily period dimensions. */
export class LabBlockValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const isLab = context.entry.type === 'lab';
    const span = context.target.span ?? context.entry.span ?? 1;
    const periodsPerDay = context.engineInput.settings.periodsPerDay || 7;
    const start = context.target.startPeriod;
    const end = start + span - 1;

    if (end > periodsPerDay) {
      return {
        valid: false,
        code: 'SLOT_EXCEEDS_PERIODS_PER_DAY',
        reason: `Target placement spans periods ${start}-${end}, which exceeds the maximum ${periodsPerDay} periods per day.`,
        suggestions: [
          {
            type: 'period',
            description: `Place earlier starting at period ${Math.max(1, periodsPerDay - span + 1)}.`,
            day: context.target.day,
            period: Math.max(1, periodsPerDay - span + 1),
          },
        ],
      };
    }

    if (isLab && span < 2) {
      return {
        valid: false,
        code: 'LAB_CONSECUTIVE_BLOCK_REQUIRED',
        reason:
          'Laboratory sessions require a consecutive block of at least 2 periods.',
        suggestions: [
          {
            type: 'period',
            description: 'Extend span to 2 or 3 periods for lab sessions.',
          },
        ],
      };
    }

    return null;
  }
}
