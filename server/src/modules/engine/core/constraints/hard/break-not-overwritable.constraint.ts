import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class BreakNotOverwritableConstraint implements IConstraint {
  readonly id = 'break-not-overwritable';
  readonly name = 'Break Not Overwritable';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const breaks = currentState.input.settings.breaks || [];

    // If move targets a break slot
    if (move) {
      const isTargetBreak = breaks.some(
        (b) =>
          (b.day === undefined || b.day === move.target.day) &&
          b.period === move.target.period,
      );

      if (isTargetBreak && move.slot.type !== 'break') {
        violations.push({
          id: `viol:break-overwrite:${move.slot.id}:${move.target.day}:${move.target.period}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: move.slot.sectionId,
          slotRefs: [move.slot.id],
          message: `Cannot move class into break slot at Period ${move.target.period}.`,
          suggestions: [],
        });
      }
    }

    // Also check static state for any class slot sharing period with break
    for (const slot of currentState.slots) {
      if (slot.type === 'break') continue;

      const isBreak = breaks.some(
        (b) =>
          (b.day === undefined || b.day === slot.day) &&
          b.period === slot.period,
      );

      if (isBreak) {
        violations.push({
          id: `viol:break-overwritten:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: slot.sectionId,
          slotRefs: [slot.id],
          message: `Break period ${slot.period} is occupied by an overwriting ${slot.type} class.`,
          suggestions: [],
        });
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
