// Core implementation for max-hours-per-day.constraint in server/src/modules/engine/core/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing max hours per day constraint. */
export class MaxHoursPerDayConstraint implements IConstraint {
  readonly id = 'max-hours-per-day';
  readonly name = 'Max Hours Per Day';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const defaultMax =
      currentState.input.effectiveConstraints?.maxHoursPerDay ?? 4;

    // Faculty -> Day -> Slots
    const facultyDaySlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        !slot.facultyId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }
      const key = `${slot.facultyId}:${slot.day}`;
      const list = facultyDaySlots.get(key) || [];
      list.push(slot);
      facultyDaySlots.set(key, list);
    }

    for (const [key, slots] of facultyDaySlots.entries()) {
      const [facultyId, dayStr] = key.split(':');
      const day = parseInt(dayStr!, 10);
      const faculty = currentState.findFaculty(facultyId!);
      const limit = faculty?.maxHoursPerDay ?? defaultMax;

      const totalHours = slots.reduce((acc, s) => acc + (s.span || 1), 0);

      if (totalHours > limit) {
        const dayName =
          currentState.input.settings.days[day] || `Day ${day + 1}`;
        violations.push({
          id: `viol:max-hours-per-day:${facultyId}:${day}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          facultyId,
          slotRefs: slots.map((s) => s.id),
          message: `Faculty ${faculty?.name || facultyId} has ${totalHours} teaching hours on ${dayName}, exceeding the daily maximum of ${limit} hours.`,
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
