// Core implementation for min-hours-per-week.constraint in packages/engine/src/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing min hours per week constraint. */
export class MinHoursPerWeekConstraint implements IConstraint {
  readonly id = 'min-hours-per-week';
  readonly name = 'Min Hours Per Week';
  readonly type = 'hard' as const;
  readonly weight = 50;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
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

    for (const faculty of currentState.input.faculty) {
      if (!faculty.minHoursPerWeek || faculty.minHoursPerWeek <= 0) continue;

      const slots = facultySlots.get(faculty.id) || [];
      const totalHours = slots.reduce((acc, s) => acc + (s.span || 1), 0);

      if (totalHours < faculty.minHoursPerWeek) {
        violations.push({
          id: `viol:min-hours-per-week:${faculty.id}`,
          constraintId: this.id,
          severity: 'warning',
          type: 'hard',
          facultyId: faculty.id,
          slotRefs: slots.map((s) => s.id),
          message: `Faculty ${faculty.name} is assigned only ${totalHours} hours, below the required minimum of ${faculty.minHoursPerWeek} hours/week.`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const viols = this.check(state);
    return viols.length === 0 ? 0 : -500 * viols.length;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
