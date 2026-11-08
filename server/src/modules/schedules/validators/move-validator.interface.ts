// Core implementation for move-validator.interface in server/src/modules/schedules/validators.
import type { MoveValidationResultDto } from '@slotly/contracts';
import type { EngineInput } from '@slotly/engine';
import type { ScheduleEntry } from '../schemas/schedule-entry.schema';

/** Interface defining structure for move validation context. */
export interface MoveValidationContext {
  entry: ScheduleEntry;
  target: {
    day: number;
    startPeriod: number;
    roomId?: string | undefined;
    facultyId?: string | undefined;
    span?: number | undefined;
  };
  existingEntries: ScheduleEntry[];
  versionStatus: string;
  engineInput: EngineInput;
  isSwap?: boolean | undefined;
  swapWithEntry?: ScheduleEntry | undefined;
}

/** Interface defining structure for move validator. */
export interface IMoveValidator {
  setNext(validator: IMoveValidator): IMoveValidator;
  validate(
    context: MoveValidationContext,
  ): Promise<MoveValidationResultDto | null>;
}

/** Abstract base class implementing chain-of-responsibility validator. */
export abstract class BaseMoveValidator implements IMoveValidator {
  private nextValidator: IMoveValidator | null = null;

  setNext(validator: IMoveValidator): IMoveValidator {
    this.nextValidator = validator;
    return validator;
  }

  validate(
    context: MoveValidationContext,
  ): Promise<MoveValidationResultDto | null> {
    const error = this.check(context);
    if (error) {
      return Promise.resolve(error);
    }
    if (this.nextValidator) {
      return this.nextValidator.validate(context);
    }
    return Promise.resolve({ valid: true, suggestions: [] });
  }

  protected abstract check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null;
}
