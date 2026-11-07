import { Injectable } from '@nestjs/common';
import type { RoomMatchRequest, RoomMatchResult } from '@slotly/contracts';
import { Room } from '../schemas/room.schema';

export const ROOM_MATCHER = Symbol('ROOM_MATCHER');

export interface IRoomMatcher {
  match(room: Room, req: RoomMatchRequest): RoomMatchResult;
  findMatchingRooms(rooms: Room[], req: RoomMatchRequest): RoomMatchResult[];
}

@Injectable()
export class StandardRoomMatcher implements IRoomMatcher {
  match(room: Room, req: RoomMatchRequest): RoomMatchResult {
    const roomId = room.id ?? (room._id as string)?.toString() ?? '';
    const minCap = req.minCapacity ?? 0;
    const capacityFit = room.capacity >= minCap;

    const typeFit = !req.requiredType || room.type === req.requiredType;

    const requiredEquipment = req.requiredEquipment ?? [];
    const roomEqSet = new Set(
      room.equipment.map((e) => e.toLowerCase().trim()),
    );
    const missingEquipment = requiredEquipment.filter(
      (eq) => !roomEqSet.has(eq.toLowerCase().trim()),
    );
    const equipmentFit = missingEquipment.length === 0;

    let availabilityFit = true;
    if (typeof req.day === 'number' && typeof req.period === 'number') {
      const dayAvail = room.availability?.[req.day];
      if (dayAvail && dayAvail[req.period] === false) {
        availabilityFit = false;
      }
    }

    const matched =
      capacityFit &&
      typeFit &&
      equipmentFit &&
      availabilityFit &&
      !room.archived &&
      !room.isDeleted;

    let score = 90;
    if (!capacityFit) score -= 40;
    if (!typeFit) score -= 30;
    if (!equipmentFit) score -= 20 * missingEquipment.length;
    if (!availabilityFit) score -= 50;
    if (room.archived) score = 0;

    // Bonus/penalty for capacity sizing: prefer tight fit over wasteful assignment
    if (capacityFit && minCap > 0) {
      const ratio = room.capacity / minCap;
      if (ratio <= 1.3) {
        score += 10; // optimal tight size -> 100
      } else if (ratio > 2.5) {
        score -= 20; // overly large room -> 70
      }
    }

    return {
      roomId,
      roomName: room.name,
      roomCode: room.code,
      matched,
      capacityFit,
      typeFit,
      equipmentFit,
      availabilityFit,
      missingEquipment,
      score: Math.max(0, Math.min(100, score)),
    };
  }

  findMatchingRooms(rooms: Room[], req: RoomMatchRequest): RoomMatchResult[] {
    return rooms
      .map((r) => this.match(r, req))
      .filter((res) => res.matched)
      .sort((a, b) => b.score - a.score);
  }
}
