import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class FacultyPreferredPeriodsConstraint implements IConstraint {
  readonly id = 'faculty-preferred-periods';
  readonly name = 'Faculty Preferred Periods';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 5) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (
        !slot.facultyId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      const faculty = currentState.findFaculty(slot.facultyId);
      if (!faculty?.preferredPeriods || faculty.preferredPeriods.length === 0)
        continue;

      const isPreferred = faculty.preferredPeriods.some(
        (pref) => pref.day === slot.day && pref.period === slot.period,
      );

      if (!isPreferred) {
        const dayName =
          currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
        violations.push({
          id: `viol:soft:faculty-preferred:${slot.facultyId}:${slot.id}`,
          constraintId: this.id,
          severity: 'info',
          type: 'soft',
          facultyId: slot.facultyId,
          slotRefs: [slot.id],
          message: `Faculty ${faculty.name} is scheduled on ${dayName} at Period ${slot.period}, which is outside their preferred time slots.`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const violations = this.check(state);
    return -violations.length * this.weight * 5;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
