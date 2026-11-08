// Chain-of-responsibility validator checking room operating hours availability.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting room is available according to its availability matrix. */
export class RoomAvailabilityValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const roomId = context.target.roomId ?? context.entry.roomId;
    if (!roomId) return null;

    const room = context.engineInput.rooms.find((r) => r.id === roomId);
    if (!room || !room.availability) return null;

    const span = context.target.span ?? context.entry.span ?? 1;
    const start = context.target.startPeriod;
    const day = context.target.day;

    for (let p = start; p < start + span; p++) {
      const dayAvail = room.availability[day];
      const isAvailable = dayAvail ? (dayAvail[p - 1] ?? dayAvail[p]) : true;
      if (isAvailable === false) {
        return {
          valid: false,
          code: 'ROOM_UNAVAILABLE',
          reason: `Room ${room.name} is closed or reserved on day ${day}, period ${p}.`,
          suggestions: [
            {
              type: 'room',
              description:
                'Select an open room or reschedule for an operating period.',
            },
          ],
        };
      }
    }

    return null;
  }
}
