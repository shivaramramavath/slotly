import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class RoomCapacityFitsSectionConstraint implements IConstraint {
  readonly id = 'room-capacity-fits-section';
  readonly name = 'Room Capacity Fits Section';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (
        !slot.roomId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      const room = currentState.findRoom(slot.roomId);
      if (!room) continue;

      // Determine required capacity
      const subject = slot.subjectId
        ? currentState.findSubject(slot.subjectId)
        : undefined;
      let requiredCapacity = subject?.requirements?.minCapacity || 0;
      if (!requiredCapacity) {
        if (slot.batchId) {
          const batch = currentState.findBatch(slot.batchId);
          requiredCapacity = batch?.size || 30;
        } else if (subject?.electiveGroupId) {
          const group = currentState.input.electiveGroups.find(
            (eg) => eg.id === subject.electiveGroupId,
          );
          const divisor = Math.max(1, group?.subjectIds.length || 1);
          const section = currentState.findSection(slot.sectionId);
          requiredCapacity = Math.ceil((section?.strength || 60) / divisor);
        } else {
          const section = currentState.findSection(slot.sectionId);
          requiredCapacity = section?.strength || 60;
        }
      }

      if (room.capacity < requiredCapacity) {
        const entityLabel = slot.batchId
          ? `Batch ${currentState.findBatch(slot.batchId)?.name || slot.batchId} (${requiredCapacity} students)`
          : `Section ${currentState.findSection(slot.sectionId)?.name || slot.sectionId} (${requiredCapacity} students)`;

        violations.push({
          id: `viol:room-capacity:${slot.roomId}:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          roomId: slot.roomId,
          sectionId: slot.sectionId,
          slotRefs: [slot.id],
          message: `Room ${room.name} capacity (${room.capacity}) is too small for ${entityLabel}.`,
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
