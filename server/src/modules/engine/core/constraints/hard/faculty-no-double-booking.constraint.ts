import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class FacultyNoDoubleBookingConstraint implements IConstraint {
  readonly id = 'faculty-no-double-booking';
  readonly name = 'Faculty No Double Booking';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const seen = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        !slot.facultyId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      // Check slot period span
      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        const key = `${slot.facultyId}:${slot.day}:${period}`;
        const list = seen.get(key) || [];
        list.push(slot);
        seen.set(key, list);
      }
    }

    for (const [key, slots] of seen.entries()) {
      if (slots.length > 1) {
        const [facultyId, dayStr, periodStr] = key.split(':');
        const day = parseInt(dayStr!, 10);
        const period = parseInt(periodStr!, 10);
        const faculty = currentState.findFaculty(facultyId!);
        const facultyName = faculty?.name || facultyId;

        const dayName =
          currentState.input.settings.days[day] || `Day ${day + 1}`;

        violations.push({
          id: `viol:faculty-double-book:${facultyId}:${day}:${period}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          facultyId,
          slotRefs: slots.map((s) => s.id),
          message: `Faculty ${facultyName} is double-booked on ${dayName} at Period ${period}.`,
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
