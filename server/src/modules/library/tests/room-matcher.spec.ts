import { StandardRoomMatcher } from '../strategies/room-matcher.strategy';
import { Room } from '../schemas/room.schema';

describe('StandardRoomMatcher Strategy', () => {
  let matcher: StandardRoomMatcher;

  beforeEach(() => {
    matcher = new StandardRoomMatcher();
  });

  const baseRoom: Room = {
    id: 'room-1',
    institutionId: 'inst-1',
    name: 'Lab 101',
    code: 'L101',
    type: 'lab',
    capacity: 40,
    building: 'CS Block',
    equipment: ['Computers', 'Projector'],
    shared: true,
    availability: [
      [true, true, true, false, true], // Day 0
      [true, true, true, true, true], // Day 1
    ],
    labFor: ['CS101'],
    archived: false,
    isDeleted: false,
  };

  it('should match a room meeting type, capacity, and equipment', () => {
    const res = matcher.match(baseRoom, {
      requiredType: 'lab',
      minCapacity: 35,
      requiredEquipment: ['computers', 'projector'],
      day: 1,
      period: 2,
    });

    expect(res.matched).toBe(true);
    expect(res.capacityFit).toBe(true);
    expect(res.typeFit).toBe(true);
    expect(res.equipmentFit).toBe(true);
    expect(res.availabilityFit).toBe(true);
    expect(res.missingEquipment).toHaveLength(0);
    expect(res.score).toBeGreaterThan(80);
  });

  it('should fail match when capacity is insufficient', () => {
    const res = matcher.match(baseRoom, {
      minCapacity: 60,
    });

    expect(res.matched).toBe(false);
    expect(res.capacityFit).toBe(false);
  });

  it('should fail match when room type does not match', () => {
    const res = matcher.match(baseRoom, {
      requiredType: 'lecture',
    });

    expect(res.matched).toBe(false);
    expect(res.typeFit).toBe(false);
  });

  it('should fail match when required equipment is missing', () => {
    const res = matcher.match(baseRoom, {
      requiredEquipment: ['Smartboard', 'Computers'],
    });

    expect(res.matched).toBe(false);
    expect(res.equipmentFit).toBe(false);
    expect(res.missingEquipment).toEqual(['Smartboard']);
  });

  it('should fail match when slot is unavailable in matrix', () => {
    const res = matcher.match(baseRoom, {
      day: 0,
      period: 3, // false in availability matrix
    });

    expect(res.matched).toBe(false);
    expect(res.availabilityFit).toBe(false);
  });

  it('should filter and rank matching rooms by score', () => {
    const room1: Room = {
      ...baseRoom,
      id: 'room-1',
      code: 'L101',
      capacity: 60, // medium fit
    };
    const room2: Room = {
      ...baseRoom,
      id: 'room-2',
      code: 'L102',
      capacity: 36, // optimal tight fit for 35 (ratio 1.02 <= 1.3 -> score 100)
    };
    const room3: Room = {
      ...baseRoom,
      id: 'room-3',
      code: 'L103',
      capacity: 100, // oversized (ratio 2.85 > 2.5 -> score 70)
    };

    const results = matcher.findMatchingRooms([room1, room2, room3], {
      requiredType: 'lab',
      minCapacity: 35,
    });

    expect(results.length).toBe(3);
    // room2 has optimal capacity ratio, so it has the highest score
    expect(results[0]!.roomId).toBe('room-2');
    expect(results[0]!.score).toBe(100);
    expect(results[1]!.roomId).toBe('room-1');
    expect(results[1]!.score).toBe(90);
    expect(results[2]!.roomId).toBe('room-3');
    expect(results[2]!.score).toBe(70);
  });
});
