// Core implementation for max-classes-per-day.constraint in packages/engine/src/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing max classes per day constraint. */
export class MaxClassesPerDayConstraint implements IConstraint {
  readonly id = 'max-classes-per-day';
  readonly name = 'Max Classes Per Day';
  readonly type = 'hard' as const;
  readonly weight = 80;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const maxClasses =
      currentState.input.effectiveConstraints?.maxClassesPerDay ?? 5;

    // sectionId:day -> Slots
    const sectionDaySlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }
      const key = `${slot.sectionId}:${slot.day}`;
      const list = sectionDaySlots.get(key) || [];
      list.push(slot);
      sectionDaySlots.set(key, list);
    }

    for (const [key, slots] of sectionDaySlots.entries()) {
      const [sectionId, dayStr] = key.split(':');
      const day = parseInt(dayStr!, 10);
      const section = currentState.findSection(sectionId!);

      // Count distinct scheduled periods for this section on this day
      const periods = new Set<number>();
      for (const slot of slots) {
        const span = slot.span || 1;
        for (let p = 0; p < span; p++) {
          periods.add(slot.period + p);
        }
      }

      if (periods.size > maxClasses) {
        const dayName =
          currentState.input.settings.days[day] || `Day ${day + 1}`;
        violations.push({
          id: `viol:max-classes-per-day:${sectionId}:${day}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId,
          slotRefs: slots.map((s) => s.id),
          message: `Section ${section?.name || sectionId} has ${periods.size} classes on ${dayName}, exceeding the daily limit of ${maxClasses}.`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const viols = this.check(state);
    return viols.length === 0 ? 0 : -800 * viols.length;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
