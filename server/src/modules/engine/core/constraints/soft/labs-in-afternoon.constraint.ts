// Core implementation for labs-in-afternoon.constraint in server/src/modules/engine/core/constraints/soft.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing labs in afternoon constraint. */
export class LabsInAfternoonConstraint implements IConstraint {
  readonly id = 'labs-in-afternoon';
  readonly name = 'Labs In Afternoon';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 7) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const periodsPerDay = currentState.input.settings.periodsPerDay;
    // Afternoon threshold: halfway through the day or after the first scheduled break
    const breaks = currentState.input.settings.breaks || [];
    const lunchBreak = breaks[0]?.period || Math.ceil(periodsPerDay / 2);

    for (const slot of currentState.slots) {
      if (slot.type !== 'lab') continue;

      // If scheduled in early morning periods before lunch break
      if (slot.period < lunchBreak) {
        const subject = slot.subjectId
          ? currentState.findSubject(slot.subjectId)
          : undefined;
        const dayName =
          currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;

        violations.push({
          id: `viol:soft:morning-lab:${slot.id}`,
          constraintId: this.id,
          severity: 'info',
          type: 'soft',
          sectionId: slot.sectionId,
          subjectId: slot.subjectId,
          slotRefs: [slot.id],
          message: `Laboratory block for ${subject?.name || 'Practical'} is scheduled in the morning (Period ${slot.period}) on ${dayName}. Afternoon periods are preferred.`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const violations = this.check(state);
    return -violations.length * this.weight * 6;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
