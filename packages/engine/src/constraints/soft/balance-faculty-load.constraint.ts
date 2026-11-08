// Core implementation for balance-faculty-load.constraint in packages/engine/src/constraints/soft.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing balance faculty load constraint. */
export class BalanceFacultyLoadConstraint implements IConstraint {
  readonly id = 'balance-faculty-load';
  readonly name = 'Balance Faculty Load';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 5) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const daysCount = currentState.input.settings.days.length;
    if (daysCount <= 1) return violations;

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
      const dailyHours = new Array<number>(daysCount).fill(0);
      slots.forEach((s) => {
        if (s.day >= 0 && s.day < daysCount) {
          const current = dailyHours[s.day] ?? 0;
          dailyHours[s.day] = current + (s.span || 1);
        }
      });

      const maxDay = Math.max(...dailyHours);
      const minDay = Math.min(...dailyHours);

      // If discrepancy across working days is greater than 3 hours
      if (maxDay - minDay > 3 && slots.length >= 6) {
        const faculty = currentState.findFaculty(facultyId);
        violations.push({
          id: `viol:soft:balance-load:${facultyId}`,
          constraintId: this.id,
          severity: 'info',
          type: 'soft',
          facultyId,
          slotRefs: slots.map((s) => s.id),
          message: `Faculty ${faculty?.name || facultyId} workload is unevenly distributed across days (${minDay}h min vs ${maxDay}h max).`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const violations = this.check(state);
    return -violations.length * this.weight * 8;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
