// Core implementation for room-type-matches-subject.constraint in packages/engine/src/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing room type matches subject constraint. */
export class RoomTypeMatchesSubjectConstraint implements IConstraint {
  readonly id = 'room-type-matches-subject';
  readonly name = 'Room Type Matches Subject';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (
        !slot.roomId ||
        !slot.subjectId ||
        slot.type === 'break' ||
        slot.type === 'free' ||
        slot.type === 'empty'
      ) {
        continue;
      }

      const room = currentState.findRoom(slot.roomId);
      const subject = currentState.findSubject(slot.subjectId);
      if (!room || !subject) continue;

      const isLab = subject.type === 'lab' || slot.type === 'lab';
      if (isLab && room.type !== 'lab') {
        violations.push({
          id: `viol:room-type-mismatch:${slot.roomId}:${slot.subjectId}:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          roomId: slot.roomId,
          subjectId: slot.subjectId,
          slotRefs: [slot.id],
          message: `Subject ${subject.name} is a laboratory practical but is assigned to non-lab room ${room.name} (${room.type}).`,
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
