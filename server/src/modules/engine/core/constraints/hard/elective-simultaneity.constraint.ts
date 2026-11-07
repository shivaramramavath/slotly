import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class ElectiveSimultaneityConstraint implements IConstraint {
  readonly id = 'elective-simultaneity';
  readonly name = 'Elective Simultaneity';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const simultaneousGroups = (currentState.input.electiveGroups || []).filter(
      (g) => g.mustBeSimultaneous,
    );

    if (simultaneousGroups.length === 0) return violations;

    for (const group of simultaneousGroups) {
      const groupSubjectIds = new Set(group.subjectIds);

      // Find all scheduled slots for subjects in this elective group
      const electiveSlots = currentState.slots.filter(
        (s) => s.subjectId && groupSubjectIds.has(s.subjectId),
      );

      if (electiveSlots.length === 0) continue;

      // Group by Section
      const bySection = new Map<string, Slot[]>();
      for (const slot of electiveSlots) {
        const list = bySection.get(slot.sectionId) || [];
        list.push(slot);
        bySection.set(slot.sectionId, list);
      }

      for (const [sectionId, slots] of bySection.entries()) {
        // Group by (day, period)
        const bySlotTime = new Map<string, Set<string>>();
        for (const s of slots) {
          const timeKey = `${s.day}:${s.period}`;
          const subs = bySlotTime.get(timeKey) || new Set<string>();
          if (s.subjectId) subs.add(s.subjectId);
          bySlotTime.set(timeKey, subs);
        }

        // Check if there are slots at times where not all active group subjects run
        // In other words, if an elective subject runs at (day, period), other subjects from the group
        // scheduled for this section must run at that same (day, period).
        for (const [timeKey, scheduledSubjectIds] of bySlotTime.entries()) {
          const [dayStr, periodStr] = timeKey.split(':');
          const day = parseInt(dayStr!, 10);
          const period = parseInt(periodStr!, 10);

          // Find subjects in this group that have hours assigned to this section
          const sectionGroupSubjects = currentState.input.subjects.filter(
            (sub) => groupSubjectIds.has(sub.id),
          );

          // If some group subjects are scheduled at this time but others are scheduled at a different time
          if (scheduledSubjectIds.size < sectionGroupSubjects.length && sectionGroupSubjects.length > 1) {
            const dayName = currentState.input.settings.days[day] || `Day ${day + 1}`;
            violations.push({
              id: `viol:elective-simultaneity:${group.id}:${sectionId}:${timeKey}`,
              constraintId: this.id,
              severity: 'error',
              type: 'hard',
              sectionId,
              slotRefs: slots.filter((s) => s.day === day && s.period === period).map((s) => s.id),
              message: `Elective group '${group.name}' subjects must run simultaneously, but only ${scheduledSubjectIds.size}/${sectionGroupSubjects.length} subjects are scheduled on ${dayName} at Period ${period}.`,
              suggestions: [],
            });
          }
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
