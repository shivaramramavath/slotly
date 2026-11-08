// Core implementation for lab-consecutive-block.constraint in packages/engine/src/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing lab consecutive block constraint. */
export class LabConsecutiveBlockConstraint implements IConstraint {
  readonly id = 'lab-consecutive-block';
  readonly name = 'Lab Consecutive Block';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const maxPeriod = currentState.input.settings.periodsPerDay;
    const breaks = currentState.input.settings.breaks || [];

    for (const slot of currentState.slots) {
      if (slot.type !== 'lab') continue;

      const subject = slot.subjectId
        ? currentState.findSubject(slot.subjectId)
        : undefined;
      const requiredConsecutive =
        subject?.consecutivePeriods ||
        (slot.span && slot.span > 1 ? slot.span : 2);

      const span = slot.span || 1;

      // 1. Check if slot exceeds daily periods
      if (slot.period + span - 1 > maxPeriod) {
        violations.push({
          id: `viol:lab-block-overflow:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId: slot.sectionId,
          subjectId: slot.subjectId,
          slotRefs: [slot.id],
          message: `Lab session extends beyond the last period of the day (Period ${slot.period + span - 1} > ${maxPeriod}).`,
          suggestions: [],
        });
      }

      // 2. Check if lab block is split across a designated break
      for (let p = 0; p < span; p++) {
        const currentPeriod = slot.period + p;
        const isBreak = breaks.some(
          (b) =>
            (b.day === undefined || b.day === slot.day) &&
            b.period === currentPeriod,
        );
        if (isBreak) {
          violations.push({
            id: `viol:lab-block-break-crossing:${slot.id}:${currentPeriod}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            slotRefs: [slot.id],
            message: `Lab block of ${span} periods crosses mandatory break at Period ${currentPeriod}.`,
            suggestions: [],
          });
        }
      }

      // 3. Check if single-period lab when subject requires consecutive
      if (span < requiredConsecutive) {
        // Look for consecutive companion lab slots on the same day for this section & subject
        const sectionDayLabs = currentState.slots.filter(
          (s) =>
            s.id !== slot.id &&
            s.type === 'lab' &&
            s.sectionId === slot.sectionId &&
            s.subjectId === slot.subjectId &&
            s.day === slot.day,
        );

        const hasAdjacent = sectionDayLabs.some(
          (s) => s.period === slot.period + 1 || s.period === slot.period - 1,
        );

        if (!hasAdjacent) {
          violations.push({
            id: `viol:lab-isolated-period:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            sectionId: slot.sectionId,
            subjectId: slot.subjectId,
            slotRefs: [slot.id],
            message: `Lab subject ${subject?.name || 'Practical'} requires ${requiredConsecutive} consecutive periods but is scheduled as an isolated single period.`,
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
