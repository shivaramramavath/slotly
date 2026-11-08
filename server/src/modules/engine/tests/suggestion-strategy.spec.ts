// Unit tests validating SuggestionStrategy ranking and conflict resolution in @slotly/engine.
import {
  ScheduleState,
  ConstraintRegistry,
  SuggestionStrategy,
  FacultyNoDoubleBookingConstraint,
  RoomNoDoubleBookingConstraint,
  MinBreaksConstraint,
  RoomCapacityFitsSectionConstraint,
} from '@slotly/engine';
import type { EngineInput, Slot } from '@slotly/engine';

describe('SuggestionStrategy', () => {
  const baseInput: EngineInput = {
    settings: {
      days: ['Monday', 'Tuesday', 'Wednesday'],
      periodsPerDay: 5,
      periodDuration: 50,
      breaks: [{ period: 3, name: 'Break' }],
    },
    calendar: { holidays: [] },
    sections: [
      { id: 'sec_1', name: 'Section A', strength: 60 },
      { id: 'sec_2', name: 'Section B', strength: 30 },
    ],
    batches: [],
    faculty: [
      { id: 'fac_1', name: 'Dr. Turing', code: 'TUR', maxHoursPerDay: 4 },
      { id: 'fac_2', name: 'Prof. Hopper', code: 'HOP', maxHoursPerDay: 4 },
    ],
    rooms: [
      { id: 'room_101', name: 'Hall A', type: 'lecture', capacity: 70 },
      { id: 'room_102', name: 'Hall B', type: 'lecture', capacity: 70 },
      { id: 'room_small', name: 'Small Room', type: 'lecture', capacity: 25 },
    ],
    subjects: [
      {
        id: 'sub_1',
        code: 'CS101',
        name: 'Algorithms',
        type: 'theory',
        weeklyHours: 3,
      },
    ],
    electiveGroups: [],
    lockedSlots: [],
  };

  it('suggests conflict-free alternative periods when double-booked', () => {
    const registry = new ConstraintRegistry();
    registry.register(new FacultyNoDoubleBookingConstraint());
    registry.register(new RoomNoDoubleBookingConstraint());
    registry.register(new MinBreaksConstraint());

    const strategy = new SuggestionStrategy(registry);

    // Slot 1 and Slot 2 are double-booked at day 0, period 1 with fac_1
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_2',
        day: 0,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_102',
        span: 1,
        isLocked: false,
      },
    ];

    const state = new ScheduleState(baseInput, slots);
    const violations = registry.get('faculty-no-double-booking')!.check(state);
    expect(violations.length).toBe(1);

    const suggestions = strategy.generateSuggestions(state, violations[0]!);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.type).toBe('period');
    // Ensure suggested period is not period 3 (break) or period 1 (double-booked)
    expect(suggestions[0]?.period).not.toBe(1);
    expect(suggestions[0]?.period).not.toBe(3);
  });

  it('suggests alternative room when current room capacity is exceeded', () => {
    const registry = new ConstraintRegistry();
    registry.register(new RoomCapacityFitsSectionConstraint());
    registry.register(new RoomNoDoubleBookingConstraint());

    const strategy = new SuggestionStrategy(registry);

    // Section A (60 students) placed in room_small (capacity 25)
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        roomId: 'room_small',
        span: 1,
        isLocked: false,
      },
    ];

    const state = new ScheduleState(baseInput, slots);
    const violations = registry.get('room-capacity-fits-section')!.check(state);
    expect(violations.length).toBe(1);

    const suggestions = strategy.generateSuggestions(state, violations[0]!);
    expect(suggestions.length).toBeGreaterThan(0);
    // Should suggest room_101 or room_102
    expect(suggestions[0]?.type).toBe('room');
    expect(['room_101', 'room_102']).toContain(suggestions[0]?.roomId);
  });
});
