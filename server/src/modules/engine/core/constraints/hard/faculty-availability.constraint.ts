import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class FacultyAvailabilityConstraint implements IConstraint {
  readonly id = 'faculty-availability';
  readonly name = 'Faculty Availability';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (!slot.facultyId || slot.type === 'break' || slot.type === 'free' || slot.type === 'empty') {
        continue;
      }

      const faculty = currentState.findFaculty(slot.facultyId);
      if (!faculty) continue;

      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        let isUnavailable = false;

        // Check unavailableSlots list
        if (faculty.unavailableSlots) {
          isUnavailable = faculty.unavailableSlots.some(
            (u) => u.day === slot.day && u.period === period,
          );
        }

        // Check availability matrix [day][period - 1]
        if (!isUnavailable && faculty.availability && faculty.availability[slot.day]) {
          const dayAvailability = faculty.availability[slot.day];
          if (dayAvailability && dayAvailability[period - 1] === false) {
            isUnavailable = true;
          }
        }

        if (isUnavailable) {
          const dayName = currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
          violations.push({
            id: `viol:faculty-avail:${slot.facultyId}:${slot.day}:${period}:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            facultyId: slot.facultyId,
            slotRefs: [slot.id],
            message: `Faculty ${faculty.name} is not available on ${dayName} at Period ${period}.`,
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
