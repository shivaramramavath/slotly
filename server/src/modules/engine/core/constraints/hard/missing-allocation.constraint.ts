import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class MissingAllocationConstraint implements IConstraint {
  readonly id = 'missing-allocation';
  readonly name = 'Missing Allocation';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (slot.type === 'break' || slot.type === 'free' || slot.type === 'empty') {
        continue;
      }

      if (slot.subjectId) {
        const subject = currentState.findSubject(slot.subjectId);
        const subjectName = subject?.name || 'Class';

        if (!slot.facultyId) {
          violations.push({
            id: `viol:missing-faculty:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            slotRefs: [slot.id],
            message: `Scheduled slot for ${subjectName} in Section ${currentState.findSection(slot.sectionId)?.name || slot.sectionId} has no faculty assigned.`,
            suggestions: [],
          });
        }

        if (!slot.roomId) {
          violations.push({
            id: `viol:missing-room:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            slotRefs: [slot.id],
            message: `Scheduled slot for ${subjectName} in Section ${currentState.findSection(slot.sectionId)?.name || slot.sectionId} has no classroom or lab assigned.`,
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
