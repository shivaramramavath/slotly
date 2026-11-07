// Core implementation for min-breaks.constraint in server/src/modules/engine/core/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing min breaks constraint. */
export class MinBreaksConstraint implements IConstraint {
  readonly id = 'min-breaks';
  readonly name = 'Minimum Breaks';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const breaks = currentState.input.settings.breaks || [];

    if (breaks.length === 0) return violations;

    for (const slot of currentState.slots) {
      if (
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        // Check if (slot.day, period) is a break period
        const isBreak = breaks.some(
          (b) =>
            (b.day === undefined || b.day === slot.day) && b.period === period,
        );

        if (isBreak) {
          const dayName =
            currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
          violations.push({
            id: `viol:min-breaks:${slot.sectionId}:${slot.day}:${period}:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            sectionId: slot.sectionId,
            slotRefs: [slot.id],
            message: `Class is scheduled during the mandatory break at Period ${period} on ${dayName}.`,
            suggestions: [],
          });
        }
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const viols = this.check(state);
    return viols.length === 0 ? 0 : -1000 * viols.length;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
