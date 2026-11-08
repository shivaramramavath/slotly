// Core implementation for limit-consecutive-same-subject.constraint in packages/engine/src/constraints/soft.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing limit consecutive same subject constraint. */
export class LimitConsecutiveSameSubjectConstraint implements IConstraint {
  readonly id = 'limit-consecutive-same-subject';
  readonly name = 'Limit Consecutive Same Subject';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 6) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    // Group theory slots by section and day
    const sectionDaySlots = new Map<string, Slot[]>();
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
      const key = `${slot.sectionId}:${slot.day}`;
      const list = sectionDaySlots.get(key) || [];
      list.push(slot);
      sectionDaySlots.set(key, list);
    }

    for (const [key, slots] of sectionDaySlots.entries()) {
      const [sectionId, dayStr] = key.split(':');
      const day = parseInt(dayStr!, 10);
      slots.sort((a, b) => a.period - b.period);

      let runCount = 1;
      let currentSubjectId: string | undefined = slots[0]?.subjectId;

      for (let i = 1; i < slots.length; i++) {
        const prev = slots[i - 1]!;
        const curr = slots[i]!;

        if (
          curr.subjectId === currentSubjectId &&
          curr.period === prev.period + 1
        ) {
          runCount++;
          if (runCount > 2) {
            const subject = currentState.findSubject(currentSubjectId!);
            const section = currentState.findSection(sectionId!);
            const dayName =
              currentState.input.settings.days[day] || `Day ${day + 1}`;

            violations.push({
              id: `viol:soft:consecutive-subject:${sectionId}:${currentSubjectId}:${day}:${curr.period}`,
              constraintId: this.id,
              severity: 'info',
              type: 'soft',
              sectionId,
              subjectId: currentSubjectId,
              slotRefs: [prev.id, curr.id],
              message: `Section ${section?.name || sectionId} has ${runCount} consecutive periods of ${subject?.name || currentSubjectId} on ${dayName}.`,
              suggestions: [],
            });
          }
        } else {
          currentSubjectId = curr.subjectId;
          runCount = 1;
        }
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
