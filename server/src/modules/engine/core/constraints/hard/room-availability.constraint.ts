import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class RoomAvailabilityConstraint implements IConstraint {
  readonly id = 'room-availability';
  readonly name = 'Room Availability';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];

    for (const slot of currentState.slots) {
      if (!slot.roomId || slot.type === 'break' || slot.type === 'free' || slot.type === 'empty') {
        continue;
      }

      const room = currentState.findRoom(slot.roomId);
      if (!room) continue;

      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        let isUnavailable = false;

        if (room.unavailableSlots) {
          isUnavailable = room.unavailableSlots.some(
            (u) => u.day === slot.day && u.period === period,
          );
        }

        if (!isUnavailable && room.availability && room.availability[slot.day]) {
          const dayAvailability = room.availability[slot.day];
          if (dayAvailability && dayAvailability[period - 1] === false) {
            isUnavailable = true;
          }
        }

        if (isUnavailable) {
          const dayName = currentState.input.settings.days[slot.day] || `Day ${slot.day + 1}`;
          violations.push({
            id: `viol:room-avail:${slot.roomId}:${slot.day}:${period}:${slot.id}`,
            constraintId: this.id,
            severity: 'error',
            type: 'hard',
            roomId: slot.roomId,
            slotRefs: [slot.id],
            message: `Room ${room.name} is unavailable on ${dayName} at Period ${period}.`,
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
