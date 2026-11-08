// Unit tests validating all 20 hard scheduling constraints in @slotly/engine.
import {
  ScheduleState,
  FacultyNoDoubleBookingConstraint,
  RoomNoDoubleBookingConstraint,
  SectionNoDoubleBookingConstraint,
  FacultyAvailabilityConstraint,
  RoomAvailabilityConstraint,
  SectionAvailabilityConstraint,
  MaxHoursPerDayConstraint,
  MaxHoursPerWeekConstraint,
  MinHoursPerWeekConstraint,
  MaxClassesPerDayConstraint,
  MinBreaksConstraint,
  RoomCapacityFitsSectionConstraint,
  RoomTypeMatchesSubjectConstraint,
  EquipmentMatchConstraint,
  LabConsecutiveBlockConstraint,
  ElectiveSimultaneityConstraint,
  HolidayExclusionConstraint,
  WeeklyHoursMetConstraint,
  MissingAllocationConstraint,
  BreakNotOverwritableConstraint,
} from '@slotly/engine';
import type { EngineInput, Slot } from '@slotly/engine';

describe('Hard Constraints Suite (20 Constraints)', () => {
  const baseInput: EngineInput = {
    settings: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: 7,
      periodDuration: 50,
      breaks: [{ period: 4, name: 'Lunch' }],
    },
    calendar: {
      holidays: [{ date: '2026-11-09', name: 'Monday Holiday' }],
    },
    sections: [
      { id: 'sec_1', name: 'Section A', strength: 60 },
      { id: 'sec_2', name: 'Section B', strength: 40 },
    ],
    batches: [
      { id: 'batch_1', sectionId: 'sec_1', name: 'Batch A1', size: 30 },
      { id: 'batch_2', sectionId: 'sec_1', name: 'Batch A2', size: 30 },
    ],
    faculty: [
      {
        id: 'fac_1',
        name: 'Dr. Turing',
        code: 'TUR',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
        minHoursPerWeek: 10,
        unavailableSlots: [{ day: 0, period: 1 }],
      },
      {
        id: 'fac_2',
        name: 'Prof. Hopper',
        code: 'HOP',
        maxHoursPerDay: 3,
        maxHoursPerWeek: 15,
        minHoursPerWeek: 8,
      },
    ],
    rooms: [
      {
        id: 'room_101',
        name: 'Lecture 101',
        type: 'lecture',
        capacity: 60,
        equipment: ['Projector'],
      },
      {
        id: 'room_lab',
        name: 'CS Lab 1',
        type: 'lab',
        capacity: 40,
        equipment: ['Projector', 'GPU'],
      },
      {
        id: 'room_small',
        name: 'Tutorial Room',
        type: 'lecture',
        capacity: 25,
        equipment: [],
      },
    ],
    subjects: [
      {
        id: 'sub_cs101',
        code: 'CS101',
        name: 'Intro to CS',
        type: 'theory',
        weeklyHours: 3,
        facultyIds: ['fac_1'],
      },
      {
        id: 'sub_lab',
        code: 'CS102L',
        name: 'CS Lab',
        type: 'lab',
        weeklyHours: 2,
        consecutivePeriods: 2,
        facultyIds: ['fac_1'],
        requirements: { roomType: 'lab', minCapacity: 30, equipment: ['GPU'] },
      },
      {
        id: 'sub_elec1',
        code: 'ELE1',
        name: 'AI Ethics',
        type: 'theory',
        weeklyHours: 2,
        isElective: true,
        electiveGroupId: 'grp_1',
        facultyIds: ['fac_1'],
      },
      {
        id: 'sub_elec2',
        code: 'ELE2',
        name: 'Robotics',
        type: 'theory',
        weeklyHours: 2,
        isElective: true,
        electiveGroupId: 'grp_1',
        facultyIds: ['fac_2'],
      },
    ],
    electiveGroups: [
      {
        id: 'grp_1',
        name: 'Semester Elective',
        mustBeSimultaneous: true,
        subjectIds: ['sub_elec1', 'sub_elec2'],
      },
    ],
    lockedSlots: [],
  };

  // 1. FacultyNoDoubleBooking
  it('1. FacultyNoDoubleBooking: flags duplicate booking at same day & period', () => {
    const constraint = new FacultyNoDoubleBookingConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_2',
        day: 1,
        period: 2,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_lab',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('double-booked');
  });

  // 2. RoomNoDoubleBooking
  it('2. RoomNoDoubleBooking: flags room double-booked at same day & period', () => {
    const constraint = new RoomNoDoubleBookingConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 3,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_2',
        day: 1,
        period: 3,
        type: 'theory',
        facultyId: 'fac_2',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('Room Lecture 101 is double-booked');
  });

  // 3. SectionNoDoubleBooking
  it('3. SectionNoDoubleBooking: flags section having two simultaneous whole-section classes', () => {
    const constraint = new SectionNoDoubleBookingConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        facultyId: 'fac_2',
        roomId: 'room_lab',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('conflicting simultaneous classes');
  });

  // 4. FacultyAvailability
  it('4. FacultyAvailability: flags slot scheduled during faculty unavailable period', () => {
    const constraint = new FacultyAvailabilityConstraint();
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
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('not available');
  });

  // 5. RoomAvailability
  it('5. RoomAvailability: flags slot scheduled when room has unavailable slots', () => {
    const constraint = new RoomAvailabilityConstraint();
    const inputWithUnavailableRoom: EngineInput = {
      ...baseInput,
      rooms: [
        { ...baseInput.rooms[0]!, unavailableSlots: [{ day: 1, period: 2 }] },
      ],
    };
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(
      new ScheduleState(inputWithUnavailableRoom, slots),
    );
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('unavailable');
  });

  // 6. SectionAvailability
  it('6. SectionAvailability: flags slot on non-working day index', () => {
    const constraint = new SectionAvailabilityConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 6,
        period: 1,
        type: 'theory',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('non-working day');
  });

  // 7. MaxHoursPerDay
  it('7. MaxHoursPerDay: flags faculty teaching more than maxHoursPerDay', () => {
    const constraint = new MaxHoursPerDayConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's3',
        sectionId: 'sec_1',
        day: 1,
        period: 3,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's4',
        sectionId: 'sec_1',
        day: 1,
        period: 5,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's5',
        sectionId: 'sec_1',
        day: 1,
        period: 6,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      }, // 5 hours > 4
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('exceeding the daily maximum');
  });

  // 8. MaxHoursPerWeek
  it('8. MaxHoursPerWeek: flags faculty exceeding maxHoursPerWeek', () => {
    const constraint = new MaxHoursPerWeekConstraint();
    const slots: Slot[] = [];
    for (let i = 1; i <= 16; i++) {
      slots.push({
        id: `s_${i}`,
        sectionId: 'sec_1',
        day: i % 5,
        period: (i % 6) + 1,
        type: 'theory',
        facultyId: 'fac_2', // max is 15
        span: 1,
        isLocked: false,
      });
    }
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('exceeding the weekly maximum');
  });

  // 9. MinHoursPerWeek
  it('9. MinHoursPerWeek: warns when assigned hours is below minHoursPerWeek', () => {
    const constraint = new MinHoursPerWeekConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
    ]; // 1 hour < 10
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(2); // fac_1 has 1h, fac_2 has 0h
    expect(viols[0]?.severity).toBe('warning');
  });

  // 10. MaxClassesPerDay
  it('10. MaxClassesPerDay: flags section with > 5 classes in a day', () => {
    const constraint = new MaxClassesPerDayConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
      {
        id: 's3',
        sectionId: 'sec_1',
        day: 1,
        period: 3,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
      {
        id: 's4',
        sectionId: 'sec_1',
        day: 1,
        period: 5,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
      {
        id: 's5',
        sectionId: 'sec_1',
        day: 1,
        period: 6,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
      {
        id: 's6',
        sectionId: 'sec_1',
        day: 1,
        period: 7,
        type: 'theory',
        span: 1,
        isLocked: false,
      }, // 6 periods > 5
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('exceeding the daily limit');
  });

  // 11. MinBreaks
  it('11. MinBreaks: flags classes scheduled on mandatory break period', () => {
    const constraint = new MinBreaksConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 4,
        type: 'theory',
        span: 1,
        isLocked: false,
      }, // period 4 is lunch break
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('mandatory break');
  });

  // 12. RoomCapacityFitsSection
  it('12. RoomCapacityFitsSection: flags room capacity smaller than section strength', () => {
    const constraint = new RoomCapacityFitsSectionConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        roomId: 'room_small',
        span: 1,
        isLocked: false,
      }, // room_small capacity 25 < section 60
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('too small');
  });

  // 13. RoomTypeMatchesSubject
  it('13. RoomTypeMatchesSubject: flags lab subject assigned to lecture room', () => {
    const constraint = new RoomTypeMatchesSubjectConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'lab',
        subjectId: 'sub_lab',
        roomId: 'room_101',
        span: 2,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('assigned to non-lab room');
  });

  // 14. EquipmentMatch
  it('14. EquipmentMatch: flags room lacking required equipment', () => {
    const constraint = new EquipmentMatchConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'lab',
        subjectId: 'sub_lab',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      }, // lacks GPU
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('lacks required equipment');
  });

  // 15. LabConsecutiveBlock
  it('15. LabConsecutiveBlock: flags lab session crossing over break period', () => {
    const constraint = new LabConsecutiveBlockConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 3,
        type: 'lab',
        subjectId: 'sub_lab',
        span: 2,
        isLocked: false,
      }, // period 3 & 4 (crosses lunch)
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('crosses mandatory break');
  });

  // 16. ElectiveSimultaneity
  it('16. ElectiveSimultaneity: flags elective subjects in group not running at the same time', () => {
    const constraint = new ElectiveSimultaneityConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_elec1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 2,
        period: 2,
        type: 'theory',
        subjectId: 'sub_elec2',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBeGreaterThan(0);
    expect(viols[0]?.message).toContain('must run simultaneously');
  });

  // 17. HolidayExclusion
  it('17. HolidayExclusion: flags class scheduled on a calendar holiday', () => {
    const constraint = new HolidayExclusionConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 2,
        type: 'theory',
        span: 1,
        isLocked: false,
      }, // Monday
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('Monday Holiday');
  });

  // 18. WeeklyHoursMet
  it('18. WeeklyHoursMet: flags under-scheduled subject hours', () => {
    const constraint = new WeeklyHoursMetConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_cs101',
        span: 1,
        isLocked: false,
      }, // 1h of 3h
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.some((v) => v.message.includes('under-scheduled'))).toBe(true);
  });

  // 19. MissingAllocation
  it('19. MissingAllocation: flags slot with missing faculty or missing room', () => {
    const constraint = new MissingAllocationConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_cs101',
        span: 1,
        isLocked: false,
      }, // no faculty, no room
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(2); // missing faculty and missing room
  });

  // 20. BreakNotOverwritable
  it('20. BreakNotOverwritable: flags regular class slot placed over a break period', () => {
    const constraint = new BreakNotOverwritableConstraint();
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 4,
        type: 'theory',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain(
      'occupied by an overwriting theory class',
    );
  });
});
