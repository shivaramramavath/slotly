import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class WeeklyHoursMetConstraint implements IConstraint {
  readonly id = 'weekly-hours-met';
  readonly name = 'Weekly Hours Met';
  readonly type = 'hard' as const;
  readonly weight = 90;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    // sectionId:subjectId -> Slots
    const sectionSubjectSlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        !slot.subjectId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }
      const key = `${slot.sectionId}:${slot.subjectId}`;
      const list = sectionSubjectSlots.get(key) || [];
      list.push(slot);
      sectionSubjectSlots.set(key, list);
    }

    for (const subject of currentState.input.subjects) {
      if (!subject.weeklyHours || subject.weeklyHours <= 0) continue;

      const targetSections = subject.sectionId
        ? currentState.input.sections.filter((s) => s.id === subject.sectionId)
        : currentState.input.sections;

      for (const section of targetSections) {
        const key = `${section.id}:${subject.id}`;
        const slots = sectionSubjectSlots.get(key) || [];
        const scheduledHours = slots.reduce((acc, s) => acc + (s.span || 1), 0);

        if (scheduledHours !== subject.weeklyHours) {
          const diff = scheduledHours - subject.weeklyHours;
          const status =
            diff > 0
              ? `over-scheduled by ${diff}h`
              : `under-scheduled by ${Math.abs(diff)}h`;

          violations.push({
            id: `viol:weekly-hours:${section.id}:${subject.id}`,
            constraintId: this.id,
            severity: scheduledHours === 0 ? 'error' : 'warning',
            type: 'hard',
            sectionId: section.id,
            subjectId: subject.id,
            slotRefs: slots.map((s) => s.id),
            message: `Subject ${subject.name} for Section ${section.name} requires ${subject.weeklyHours}h/week, but is currently ${status} (${scheduledHours}h scheduled).`,
            suggestions: [],
          });
        }
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const viols = this.check(state);
    return viols.length === 0 ? 0 : -900 * viols.length;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
