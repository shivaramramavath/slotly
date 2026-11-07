import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class DepartmentRulesConstraint implements IConstraint {
  readonly id = 'department-rules';
  readonly name = 'Department Rules';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 5) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    // Core department subjects preferred in prime morning periods (periods 1-3)
    for (const slot of currentState.slots) {
      if (slot.type !== 'theory' || !slot.subjectId) continue;

      const subject = currentState.findSubject(slot.subjectId);
      const section = currentState.findSection(slot.sectionId);

      // Core subject belonging directly to the section's department
      const isCore =
        subject?.departmentId &&
        section?.departmentId &&
        subject.departmentId === section.departmentId &&
        !subject.isElective;

      if (isCore && slot.period > 4) {
        const dayName =
          currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
        violations.push({
          id: `viol:soft:dept-rules:${slot.id}`,
          constraintId: this.id,
          severity: 'info',
          type: 'soft',
          sectionId: slot.sectionId,
          subjectId: slot.subjectId,
          slotRefs: [slot.id],
          message: `Core department subject ${subject.name} is scheduled late in the day (Period ${slot.period}) on ${dayName}. Morning periods are preferred.`,
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
