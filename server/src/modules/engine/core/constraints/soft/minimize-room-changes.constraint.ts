// Core implementation for minimize-room-changes.constraint in server/src/modules/engine/core/constraints/soft.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing minimize room changes constraint. */
export class MinimizeRoomChangesConstraint implements IConstraint {
  readonly id = 'minimize-room-changes';
  readonly name = 'Minimize Room Changes';
  readonly type = 'soft' as const;
  readonly weight: number;

  constructor(weight = 4) {
    this.weight = weight;
  }

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    // Group theory slots by section and day
    const sectionDayTheory = new Map<string, Slot[]>();
    for (const slot of currentState.slots) {
      if (slot.type !== 'theory' || !slot.roomId) {
        continue;
      }
      const key = `${slot.sectionId}:${slot.day}`;
      const list = sectionDayTheory.get(key) || [];
      list.push(slot);
      sectionDayTheory.set(key, list);
    }

    for (const [key, slots] of sectionDayTheory.entries()) {
      const [sectionId, dayStr] = key.split(':');
      const day = parseInt(dayStr!, 10);
      slots.sort((a, b) => a.period - b.period);

      for (let i = 1; i < slots.length; i++) {
        const prev = slots[i - 1]!;
        const curr = slots[i]!;

        // If consecutive periods with different classrooms
        if (
          curr.period === prev.period + (prev.span || 1) &&
          curr.roomId !== prev.roomId
        ) {
          const prevRoom = currentState.findRoom(prev.roomId!);
          const currRoom = currentState.findRoom(curr.roomId!);
          const section = currentState.findSection(sectionId!);
          const dayName =
            currentState.input.settings.days[day] || `Day ${day + 1}`;

          violations.push({
            id: `viol:soft:room-change:${sectionId}:${day}:${curr.period}`,
            constraintId: this.id,
            severity: 'info',
            type: 'soft',
            sectionId,
            roomId: curr.roomId,
            slotRefs: [prev.id, curr.id],
            message: `Section ${section?.name || sectionId} switches classrooms from ${prevRoom?.name || prev.roomId} to ${currRoom?.name || curr.roomId} on ${dayName} between Periods ${prev.period} and ${curr.period}.`,
            suggestions: [],
          });
        }
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
