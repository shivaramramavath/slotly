import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class HolidayExclusionConstraint implements IConstraint {
  readonly id = 'holiday-exclusion';
  readonly name = 'Holiday Exclusion';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const holidays = currentState.input.calendar?.holidays || [];

    if (holidays.length === 0) return violations;

    // Check if slots are scheduled on days labeled as holidays
    // Also, if calendar holiday dates map to days of the week, or if holiday entries contain day indices
    for (const slot of currentState.slots) {
      if (slot.type === 'break' || slot.type === 'free' || slot.type === 'empty') {
        continue;
      }

      const dayName = currentState.input.settings.days[slot.day]?.toLowerCase() || '';

      // Check if holiday name or date matches the day name or index
      const matchingHoliday = holidays.find((h) => {
        const nameMatch = h.name.toLowerCase().includes(dayName);
        let dateDayMatch = false;
        try {
          const d = new Date(h.date);
          if (!isNaN(d.getTime())) {
            // Sunday = 0, Monday = 1 ...
            const dayOfWeek = (d.getDay() + 6) % 7; // Convert to Mon=0
            dateDayMatch = dayOfWeek === slot.day;
          }
        } catch {
          // ignore date parse errors
        }
        return nameMatch || dateDayMatch;
      });

      if (matchingHoliday) {
        violations.push({
          id: `viol:holiday:${slot.id}:${matchingHoliday.name}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: slot.sectionId,
          slotRefs: [slot.id],
          message: `Class scheduled on ${currentState.input.settings.days[slot.day]} which coincides with calendar holiday '${matchingHoliday.name}'.`,
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
