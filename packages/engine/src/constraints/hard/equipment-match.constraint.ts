// Core implementation for equipment-match.constraint in packages/engine/src/constraints/hard.
import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

/** Class implementing equipment match constraint. */
export class EquipmentMatchConstraint implements IConstraint {
  readonly id = 'equipment-match';
  readonly name = 'Equipment Match';
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

      const requiredEquipment = subject.requirements?.equipment || [];
      if (requiredEquipment.length === 0) continue;

      const roomEquipment = new Set(
        room.equipment?.map((e) => e.toLowerCase()) || [],
      );
      const missingEquipment = requiredEquipment.filter(
        (req) => !roomEquipment.has(req.toLowerCase()),
      );

      if (missingEquipment.length > 0) {
        violations.push({
          id: `viol:equipment-mismatch:${slot.roomId}:${slot.subjectId}:${slot.id}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          roomId: slot.roomId,
          subjectId: slot.subjectId,
          slotRefs: [slot.id],
          message: `Room ${room.name} lacks required equipment (${missingEquipment.join(', ')}) for ${subject.name}.`,
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
