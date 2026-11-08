// Chain-of-responsibility validator checking if room is free at target time.
import {
  BaseMoveValidator,
  MoveValidationContext,
} from './move-validator.interface';
import type { MoveValidationResultDto } from '@slotly/contracts';

/** Validator asserting room is not double booked at the target time. */
export class RoomFreeValidator extends BaseMoveValidator {
  protected check(
    context: MoveValidationContext,
  ): MoveValidationResultDto | null {
    const roomId = context.target.roomId ?? context.entry.roomId;
    if (!roomId) return null;

    const span = context.target.span ?? context.entry.span ?? 1;
    const targetStart = context.target.startPeriod;
    const targetEnd = targetStart + span - 1;

    const collision = context.existingEntries.find((other) => {
      if (other._id === context.entry._id) return false;
      if (
        context.isSwap &&
        context.swapWithEntry &&
        other._id === context.swapWithEntry._id
      ) {
        return false;
      }
      if (other.roomId !== roomId) return false;
      if (other.day !== context.target.day) return false;

      const otherStart = other.startPeriod;
      const otherEnd = otherStart + other.span - 1;
      return targetStart <= otherEnd && otherStart <= targetEnd;
    });

    if (collision) {
      const room = context.engineInput.rooms.find((r) => r.id === roomId);
      const roomName = room?.name || roomId;
      return {
        valid: false,
        code: 'ROOM_DOUBLE_BOOKED',
        reason: `Room ${roomName} is already booked on day ${context.target.day}, period ${targetStart}.`,
        suggestions: [
          {
            type: 'room',
            description:
              'Select an alternate available room with compatible capacity.',
          },
        ],
      };
    }

    return null;
  }
}
