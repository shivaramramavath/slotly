import type { IConstraint } from '../../constraint.interface';
import type { Move, Violation, Slot } from '../../types';
import type { ScheduleState } from '../../schedule-state';

export class RoomNoDoubleBookingConstraint implements IConstraint {
  readonly id = 'room-no-double-booking';
  readonly name = 'Room No Double Booking';
  readonly type = 'hard' as const;
  readonly weight = 100;

  check(state: ScheduleState, move?: Move): Violation[] {
    const currentState = move ? state.cloneWithMove(move) : state;
    const violations: Violation[] = [];
    const seen = new Map<string, Slot[]>();

    for (const slot of currentState.slots) {
      if (!slot.roomId || slot.type === 'break' || slot.type === 'free' || slot.type === 'empty') {
        continue;
      }

      const span = slot.span || 1;
      for (let p = 0; p < span; p++) {
        const period = slot.period + p;
        const key = `${slot.roomId}:${slot.day}:${period}`;
        const list = seen.get(key) || [];
        list.push(slot);
        seen.set(key, list);
      }
    }

    for (const [key, slots] of seen.entries()) {
      if (slots.length > 1) {
        const [roomId, dayStr, periodStr] = key.split(':');
        const day = parseInt(dayStr!, 10);
        const period = parseInt(periodStr!, 10);
        const room = currentState.findRoom(roomId!);
        const roomName = room?.name || roomId;
        const dayName = currentState.input.settings.days[day] || `Day ${day + 1}`;

        violations.push({
          id: `viol:room-double-book:${roomId}:${day}:${period}`,
          constraintId: this.id,
          severity: 'error',
          type: 'hard',
          roomId,
          slotRefs: slots.map((s) => s.id),
          message: `Room ${roomName} is double-booked on ${dayName} at Period ${period}.`,
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
