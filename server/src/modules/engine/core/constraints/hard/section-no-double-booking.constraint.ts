import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class SectionNoDoubleBookingConstraint implements IConstraint {
  readonly id = 'section-no-double-booking';
  readonly name = 'Section No Double Booking';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    // Key: sectionId:day:period -> Slot[]
    const sectionSlots = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        const key = `${slot.sectionId}:${slot.day}:${period}`;
        const list = sectionSlots.get(key) || [];
        list.push(slot);
        sectionSlots.set(key, list);
      }
    }

    for (const [key, slots] of sectionSlots.entries()) {
      if (slots.length <= 1) continue;

      const [sectionId, dayStr, periodStr] = key.split(':');
      const day = parseInt(dayStr!, 10);
      const period = parseInt(periodStr!, 10);
      const section = currentState.findSection(sectionId!);
      const sectionName = section?.name || sectionId;
      const dayName = currentState.input.settings.days[day] || `Day ${day + 1}`;

      // Check if there is a conflict:
      // A whole section class (batchId is null/undefined) conflicts with ANY other class in that period,
      // EXCEPT when all slots belong to the same simultaneous elective group (parallel elective classes).
      let hasConflict = false;
      const wholeSectionSlots = slots.filter((s) => !s.batchId);

      const areParallelElectives =
        slots.length > 1 &&
        slots.every((s) => {
          if (!s.subjectId) return false;
          const sub = currentState.findSubject(s.subjectId);
          if (!sub?.electiveGroupId) return false;
          const group = currentState.input.electiveGroups.find(
            (eg) => eg.id === sub.electiveGroupId,
          );
          return group?.mustBeSimultaneous === true;
        }) &&
        new Set(
          slots.map((s) =>
            s.subjectId
              ? currentState.findSubject(s.subjectId)?.electiveGroupId
              : undefined,
          ),
        ).size === 1;

      if (areParallelElectives) {
        hasConflict = false;
      } else if (wholeSectionSlots.length > 1) {
        hasConflict = true;
      } else if (wholeSectionSlots.length === 1 && slots.length > 1) {
        hasConflict = true;
      } else {
        // All slots have batchId: check for duplicate batchId
        const batchIds = slots.map((s) => s.batchId);
        const uniqueBatches = new Set(batchIds);
        if (uniqueBatches.size < batchIds.length) {
          hasConflict = true;
        }
      }

      if (hasConflict) {
        violations.push({
          id: `viol:section-double-book:${sectionId}:${day}:${period}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          sectionId,
          slotRefs: slots.map((s) => s.id),
          message: `Section ${sectionName} has conflicting simultaneous classes on ${dayName} at Period ${period}.`,
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
