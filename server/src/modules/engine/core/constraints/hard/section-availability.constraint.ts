// Core implementation for section-availability.constraint in server/src/modules/engine/core/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing section availability constraint. */
export class SectionAvailabilityConstraint implements IConstraint {
  readonly id = 'section-availability';
  readonly name = 'Section Availability';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const validDaysCount = currentState.input.settings.days.length;

    for (const slot of currentState.slots) {
      if (
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      // Check if day is beyond the active working days
      if (slot.day < 0 || slot.day >= validDaysCount) {
        violations.push({
          id: `viol:section-avail:day-out-of-bounds:${slot.sectionId}:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: slot.sectionId,
          slotRefs: [slot.id],
          message: `Slot is scheduled on an invalid non-working day index ${slot.day}.`,
          suggestions: [],
        });
        continue;
      }

      const section = currentState.findSection(slot.sectionId);
      if (section?.workingDays && !section.workingDays.includes(slot.day)) {
        const dayName =
          currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
        violations.push({
          id: `viol:section-avail:${slot.sectionId}:${slot.day}:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: slot.sectionId,
          slotRefs: [slot.id],
          message: `Section ${section.name} does not have classes on ${dayName}.`,
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
