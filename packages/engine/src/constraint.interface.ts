// Core implementation for constraint.interface in packages/engine/src.
import type { Move, Violation } from './types';
import type { ScheduleState } from './schedule-state';

/** Interface defining structure for constraint. */
export interface IConstraint {
  readonly id: string;
  readonly name: string;
  readonly type: 'hard' | 'soft';
  readonly weight: number;

  /**
   * Check schedule state (or hypothetical move) for violations.
   * If move is supplied, only evaluates if the move causes or alters violations of this constraint.
   */
  check(state: ScheduleState, move?: Move): Violation[];

  /**
   * Computes penalty or reward score for soft optimization (0 = perfect, negative = penalties).
   * For hard constraints, returns 0 if valid or -1000 * violationCount.
   */
  score(state: ScheduleState): number;

  /**
   * Explains a violation in human-readable terms.
   */
  explain(violation: Violation): string;
}
