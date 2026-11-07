import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class SpreadSubjectsAcrossDaysConstraint implements IConstraint {
  readonly id = 'spread-subjects-across-days';
  readonly name = 'Spread Subjects Across Days';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 8) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    // sectionId:subjectId:day -> Slot[]
    const sectionSubjectDaySlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        !slot.subjectId ||
        slot.type === 'lab' ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }
      const key = `${slot.sectionId}:${slot.subjectId}:${slot.day}`;
      const list = sectionSubjectDaySlots.get(key) || [];
      list.push(slot);
      sectionSubjectDaySlots.set(key, list);
    }

    for (const [key, slots] of sectionSubjectDaySlots.entries()) {
      if (slots.length > 1) {
        const [sectionId, subjectId, dayStr] = key.split(':');
        const day = parseInt(dayStr!, 10);
        const section = currentState.findSection(sectionId!);
        const subject = currentState.findSubject(subjectId!);
        const dayName =
          currentState.input.settings.days[day] || `Day ${day + 1}`;

        violations.push({
          id: `viol:soft:spread-subjects:${sectionId}:${subjectId}:${day}`,
          constraintId: this.id,
          severity: 'info',
          type: 'soft',
          sectionId,
          subjectId,
          slotRefs: slots.map((s) => s.id),
          message: `Subject ${subject?.name || subjectId} has ${slots.length} theory classes scheduled on ${dayName} for Section ${section?.name || sectionId}. Spreading across days is preferred.`,
          suggestions: [],
        });
      }
    }

    return violations;
  }

  score(state: ScheduleState): number {
    const violations = this.check(state);
    return -violations.length * this.weight * 10;
  }

  explain(violation: Violation): string {
    return violation.message;
  }
}
