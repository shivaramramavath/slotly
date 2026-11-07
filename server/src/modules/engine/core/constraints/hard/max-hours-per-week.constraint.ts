// Core implementation for max-hours-per-week.constraint in server/src/modules/engine/core/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing max hours per week constraint. */
export class MaxHoursPerWeekConstraint implements IConstraint {
  readonly id = 'max-hours-per-week';
  readonly name = 'Max Hours Per Week';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const defaultMax =
      currentState.input.effectiveConstraints?.maxHoursPerWeek ?? 18;

    const facultySlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        !slot.facultyId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }
      const list = facultySlots.get(slot.facultyId) || [];
      list.push(slot);
      facultySlots.set(slot.facultyId, list);
    }

    for (const [facultyId, slots] of facultySlots.entries()) {
      const faculty = currentState.findFaculty(facultyId);
      const limit = faculty?.maxHoursPerWeek ?? defaultMax;
      const totalHours = slots.reduce((acc, s) => acc + (s.span || 1), 0);

      if (totalHours > limit) {
        violations.push({
          id: `viol:max-hours-per-week:${facultyId}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          facultyId,
          slotRefs: slots.map((s) => s.id),
          message: `Faculty ${faculty?.name || facultyId} is assigned ${totalHours} hours this week, exceeding the weekly maximum of ${limit} hours.`,
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
