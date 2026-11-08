// Unit tests validating TimetableSolver heuristics, backtracking, and alternatives generation.
import { TimetableSolver } from '../core/solver/timetable-solver';
import { generateAlternatives } from '../core/solver/alternatives-generator';
import type { EngineInput, Slot } from '@slotly/engine';

describe('TimetableSolver (Pure Engine)', () => {
  // Common base settings
  const baseSettings = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 6,
    periodDuration: 50,
    startTime: '09:00',
    breaks: [{ period: 3, name: 'Lunch' }],
  };

  // ---------------------------------------------------------------------------
  // 1. Small School Fixture
  // ---------------------------------------------------------------------------
  it('solves small school timetable with 0 hard violations', () => {
    const input: EngineInput = {
      settings: baseSettings,
      calendar: { holidays: [] },
      sections: [{ id: 'sec_10a', name: 'Grade 10-A', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_alice',
          name: 'Alice',
          code: 'ALC',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_bob',
          name: 'Bob',
          code: 'BOB',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_charlie',
          name: 'Charlie',
          code: 'CHR',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        { id: 'rm_c1', name: 'Classroom 1', type: 'lecture', capacity: 40 },
        { id: 'rm_lab1', name: 'Computer Lab', type: 'lab', capacity: 35 },
      ],
      subjects: [
        {
          id: 'sub_math',
          name: 'Mathematics',
          code: 'MATH',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_alice'],
          sectionId: 'sec_10a',
        },
        {
          id: 'sub_eng',
          name: 'English',
          code: 'ENG',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_bob'],
          sectionId: 'sec_10a',
        },
        {
          id: 'sub_sci',
          name: 'Science',
          code: 'SCI',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_charlie'],
          sectionId: 'sec_10a',
        },
        {
          id: 'sub_cs_lab',
          name: 'CS Lab',
          code: 'CSLAB',
          type: 'lab',
          weeklyHours: 2,
          consecutivePeriods: 2,
          facultyIds: ['fac_alice'],
          requirements: { roomType: 'lab', minCapacity: 25 },
          sectionId: 'sec_10a',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 42 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    expect(result.unplacedTasksCount).toBe(0);
    const hardViolations = result.violations.filter((v) => v.type === 'hard');
    expect(hardViolations).toHaveLength(0);

    // Verify CS Lab is scheduled in the lab room
    const labSlot = result.slots.find((s) => s.subjectId === 'sub_cs_lab');
    expect(labSlot).toBeDefined();
    expect(labSlot?.roomId).toBe('rm_lab1');
    expect(labSlot?.span).toBe(2);

    // Verify no classes scheduled during lunch break (period 3)
    const breakSlot = result.slots.find((s) => s.period === 3);
    expect(breakSlot).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // 2. 3-Section College Fixture (Shared Faculty and Rooms)
  // ---------------------------------------------------------------------------
  it('solves 3-section college schedule ensuring shared resources never double-book', () => {
    const input: EngineInput = {
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 7,
        periodDuration: 50,
        breaks: [{ period: 3, name: 'Lunch' }],
      },
      calendar: { holidays: [] },
      sections: [
        { id: 'sec_cse_a', name: 'CSE A', strength: 50 },
        { id: 'sec_cse_b', name: 'CSE B', strength: 50 },
        { id: 'sec_cse_c', name: 'CSE C', strength: 50 },
      ],
      batches: [],
      faculty: [
        {
          id: 'fac_dr_smith',
          name: 'Dr. Smith',
          code: 'SMT',
          maxHoursPerDay: 4,
          maxHoursPerWeek: 18,
        },
        {
          id: 'fac_prof_jones',
          name: 'Prof. Jones',
          code: 'JNS',
          maxHoursPerDay: 4,
          maxHoursPerWeek: 18,
        },
        {
          id: 'fac_dr_patel',
          name: 'Dr. Patel',
          code: 'PTL',
          maxHoursPerDay: 4,
          maxHoursPerWeek: 18,
        },
      ],
      rooms: [
        { id: 'hall_1', name: 'Lecture Hall 1', type: 'lecture', capacity: 60 },
        { id: 'hall_2', name: 'Lecture Hall 2', type: 'lecture', capacity: 60 },
      ],
      subjects: [
        // Dr. Smith teaches OS in all 3 sections
        {
          id: 'sub_os_a',
          name: 'Operating Systems',
          code: 'OS',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_dr_smith'],
          sectionId: 'sec_cse_a',
        },
        {
          id: 'sub_os_b',
          name: 'Operating Systems',
          code: 'OS',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_dr_smith'],
          sectionId: 'sec_cse_b',
        },
        {
          id: 'sub_os_c',
          name: 'Operating Systems',
          code: 'OS',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_dr_smith'],
          sectionId: 'sec_cse_c',
        },
        // Prof. Jones teaches DBMS in CSE A and B
        {
          id: 'sub_dbms_a',
          name: 'DBMS',
          code: 'DBMS',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_prof_jones'],
          sectionId: 'sec_cse_a',
        },
        {
          id: 'sub_dbms_b',
          name: 'DBMS',
          code: 'DBMS',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_prof_jones'],
          sectionId: 'sec_cse_b',
        },
        // Dr. Patel teaches Networks in CSE B and C
        {
          id: 'sub_net_b',
          name: 'Networks',
          code: 'NET',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_dr_patel'],
          sectionId: 'sec_cse_b',
        },
        {
          id: 'sub_net_c',
          name: 'Networks',
          code: 'NET',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_dr_patel'],
          sectionId: 'sec_cse_c',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 101 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    const hardViolations = result.violations.filter((v) => v.type === 'hard');
    expect(hardViolations).toHaveLength(0);

    // Verify Dr. Smith is never double-booked
    const smithSlots = result.slots.filter(
      (s) => s.facultyId === 'fac_dr_smith',
    );
    const smithCoordinates = new Set<string>();
    for (const s of smithSlots) {
      const key = `${s.day}:${s.period}`;
      expect(smithCoordinates.has(key)).toBe(false);
      smithCoordinates.add(key);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Department with Shared Faculty Fixture
  // ---------------------------------------------------------------------------
  it('solves cross-department curriculum with shared faculty', () => {
    const input: EngineInput = {
      settings: baseSettings,
      calendar: { holidays: [] },
      sections: [
        {
          id: 'sec_cse_1',
          name: 'CSE Year 1',
          strength: 40,
          departmentId: 'dept_cse',
        },
        {
          id: 'sec_ece_1',
          name: 'ECE Year 1',
          strength: 40,
          departmentId: 'dept_ece',
        },
      ],
      batches: [],
      faculty: [
        // Shared Mathematics professor teaching both departments
        {
          id: 'fac_math_prof',
          name: 'Math Prof',
          code: 'MTH',
          departmentId: 'dept_math',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_cs_prof',
          name: 'CS Prof',
          code: 'CSP',
          departmentId: 'dept_cse',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_ece_prof',
          name: 'ECE Prof',
          code: 'ECP',
          departmentId: 'dept_ece',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        { id: 'rm_cse', name: 'CSE Room', type: 'lecture', capacity: 50 },
        { id: 'rm_ece', name: 'ECE Room', type: 'lecture', capacity: 50 },
      ],
      subjects: [
        {
          id: 'sub_mth_cse',
          name: 'Linear Algebra',
          code: 'M1',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_math_prof'],
          sectionId: 'sec_cse_1',
        },
        {
          id: 'sub_mth_ece',
          name: 'Calculus',
          code: 'M2',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_math_prof'],
          sectionId: 'sec_ece_1',
        },
        {
          id: 'sub_dsa',
          name: 'Data Structures',
          code: 'DSA',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_cs_prof'],
          sectionId: 'sec_cse_1',
        },
        {
          id: 'sub_circuits',
          name: 'Circuits',
          code: 'CIR',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_ece_prof'],
          sectionId: 'sec_ece_1',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 777 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    const hardViolations = result.violations.filter((v) => v.type === 'hard');
    expect(hardViolations).toHaveLength(0);

    const mathSlots = result.slots.filter(
      (s) => s.facultyId === 'fac_math_prof',
    );
    expect(mathSlots.length).toBe(6); // 3 hrs CSE + 3 hrs ECE
  });

  // ---------------------------------------------------------------------------
  // 4. Lab-Heavy Fixture (Multi-Hour Blocks with Equipment)
  // ---------------------------------------------------------------------------
  it('solves lab-heavy requirements with multi-period contiguous blocks', () => {
    const input: EngineInput = {
      settings: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 8,
        periodDuration: 50,
        breaks: [{ period: 4, name: 'Lunch' }],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_chem_1', name: 'Chemistry Year 1', strength: 25 }],
      batches: [],
      faculty: [
        {
          id: 'fac_lab_head',
          name: 'Lab Head',
          code: 'LH',
          maxHoursPerDay: 6,
          maxHoursPerWeek: 25,
        },
        {
          id: 'fac_lecturer',
          name: 'Lecturer',
          code: 'LEC',
          maxHoursPerDay: 6,
          maxHoursPerWeek: 25,
        },
      ],
      rooms: [
        { id: 'rm_lec', name: 'Lecture Room', type: 'lecture', capacity: 40 },
        {
          id: 'rm_wet_lab',
          name: 'Advanced Wet Lab',
          type: 'lab',
          capacity: 30,
          equipment: ['fume_hood', 'microscopes'],
        },
      ],
      subjects: [
        {
          id: 'sub_organic_lab',
          name: 'Organic Chem Lab',
          code: 'OCHEML',
          type: 'lab',
          weeklyHours: 3,
          consecutivePeriods: 3, // 3-hour contiguous block
          facultyIds: ['fac_lab_head'],
          requirements: { roomType: 'lab', equipment: ['fume_hood'] },
          sectionId: 'sec_chem_1',
        },
        {
          id: 'sub_theory',
          name: 'Inorganic Chem',
          code: 'ICHEM',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: ['fac_lecturer'],
          sectionId: 'sec_chem_1',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 555 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    const labSlot = result.slots.find((s) => s.subjectId === 'sub_organic_lab');
    expect(labSlot).toBeDefined();
    expect(labSlot?.span).toBe(3);
    expect(labSlot?.roomId).toBe('rm_wet_lab');

    // Ensure 3-hour lab doesn't overlap with lunch break (period 4)
    // If period is 0, span 3 ends at 2 (0, 1, 2)
    // If period is 5, span 3 ends at 7 (5, 6, 7)
    const overlapsBreak = labSlot!.period <= 4 && labSlot!.period + 3 > 4;
    expect(overlapsBreak).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 5. Electives Fixture (Simultaneous Group Scheduling)
  // ---------------------------------------------------------------------------
  it('solves simultaneous elective groups at identical day and period', () => {
    const input: EngineInput = {
      settings: baseSettings,
      calendar: { holidays: [] },
      sections: [{ id: 'sec_sem_6', name: 'Semester 6', strength: 60 }],
      batches: [],
      faculty: [
        {
          id: 'fac_ai_expert',
          name: 'AI Expert',
          code: 'AI',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_cloud_expert',
          name: 'Cloud Expert',
          code: 'CLD',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        { id: 'rm_hall_a', name: 'Hall A', type: 'lecture', capacity: 35 },
        { id: 'rm_hall_b', name: 'Hall B', type: 'lecture', capacity: 35 },
      ],
      subjects: [
        {
          id: 'sub_ai',
          name: 'Artificial Intelligence',
          code: 'AI101',
          type: 'theory',
          weeklyHours: 2,
          isElective: true,
          electiveGroupId: 'grp_elec_1',
          facultyIds: ['fac_ai_expert'],
          sectionId: 'sec_sem_6',
        },
        {
          id: 'sub_cloud',
          name: 'Cloud Computing',
          code: 'CLD101',
          type: 'theory',
          weeklyHours: 2,
          isElective: true,
          electiveGroupId: 'grp_elec_1',
          facultyIds: ['fac_cloud_expert'],
          sectionId: 'sec_sem_6',
        },
      ],
      electiveGroups: [
        {
          id: 'grp_elec_1',
          name: 'Professional Elective 1',
          subjectIds: ['sub_ai', 'sub_cloud'],
          mustBeSimultaneous: true,
        },
      ],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 888 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    const aiSlots = result.slots.filter((s) => s.subjectId === 'sub_ai');
    const cloudSlots = result.slots.filter((s) => s.subjectId === 'sub_cloud');

    expect(aiSlots).toHaveLength(2);
    expect(cloudSlots).toHaveLength(2);

    // Verify both electives are scheduled at identical day & period
    for (let i = 0; i < aiSlots.length; i++) {
      const ai = aiSlots[i]!;
      const matchingCloud = cloudSlots.find(
        (c) => c.day === ai.day && c.period === ai.period,
      );
      expect(matchingCloud).toBeDefined();
      expect(matchingCloud?.roomId).not.toBe(ai.roomId); // Different rooms
      expect(matchingCloud?.facultyId).not.toBe(ai.facultyId); // Different faculty
    }
  });

  // ---------------------------------------------------------------------------
  // 6. Impossible Case (Graceful Termination & Best-So-Far)
  // ---------------------------------------------------------------------------
  it('terminates gracefully when problem is mathematically impossible and returns best-so-far', () => {
    const input: EngineInput = {
      settings: {
        days: ['Monday'],
        periodsPerDay: 2, // Only 2 periods total in the entire week!
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_overload', name: 'Overloaded', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_solo',
          name: 'Solo',
          code: 'SOLO',
          maxHoursPerDay: 2,
          maxHoursPerWeek: 2,
        },
      ],
      rooms: [
        { id: 'rm_solo', name: 'Solo Room', type: 'lecture', capacity: 40 },
      ],
      subjects: [
        // Requires 10 hours in a 2-period week -> impossible!
        {
          id: 'sub_huge',
          name: 'Huge Subject',
          code: 'HUGE',
          type: 'theory',
          weeklyHours: 10,
          facultyIds: ['fac_solo'],
          sectionId: 'sec_overload',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const solver = new TimetableSolver({ seed: 42, timeLimitMs: 1500 });
    const result = solver.solve(input);

    // Must not crash or hang
    expect(result).toBeDefined();
    expect(result.isFeasible).toBe(false);
    expect(result.unplacedTasksCount).toBeGreaterThan(0);
    expect(result.slots.length).toBeLessThanOrEqual(2);
  });

  // ---------------------------------------------------------------------------
  // 7. Locked Slots Fixture (Preservation of User-Pinned Slots)
  // ---------------------------------------------------------------------------
  it('preserves pre-locked slots exactly and schedules remaining classes around them', () => {
    const lockedSlot: Slot = {
      id: 'slot_fixed_monday_p1',
      sectionId: 'sec_locked_demo',
      day: 0,
      period: 1,
      type: 'theory',
      subjectId: 'sub_fixed_seminar',
      facultyId: 'fac_guest',
      roomId: 'rm_auditorium',
      span: 1,
      isLocked: true,
    };

    const input: EngineInput = {
      settings: baseSettings,
      calendar: { holidays: [] },
      sections: [{ id: 'sec_locked_demo', name: 'Demo Section', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_guest',
          name: 'Guest Lecturer',
          code: 'GST',
          maxHoursPerDay: 2,
          maxHoursPerWeek: 5,
        },
        {
          id: 'fac_regular',
          name: 'Regular Prof',
          code: 'REG',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        {
          id: 'rm_auditorium',
          name: 'Auditorium',
          type: 'lecture',
          capacity: 100,
        },
        { id: 'rm_std', name: 'Standard Room', type: 'lecture', capacity: 40 },
      ],
      subjects: [
        {
          id: 'sub_regular_math',
          name: 'Regular Math',
          code: 'RMATH',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_regular'],
          sectionId: 'sec_locked_demo',
        },
      ],
      electiveGroups: [],
      lockedSlots: [lockedSlot],
    };

    const solver = new TimetableSolver({ seed: 999 });
    const result = solver.solve(input);

    expect(result.isFeasible).toBe(true);
    // Locked slot must still be present at day 0, period 1
    const foundLocked = result.slots.find((s) => s.id === lockedSlot.id);
    expect(foundLocked).toBeDefined();
    expect(foundLocked?.day).toBe(0);
    expect(foundLocked?.period).toBe(1);
    expect(foundLocked?.subjectId).toBe('sub_fixed_seminar');
    expect(foundLocked?.roomId).toBe('rm_auditorium');

    // No other slot should collide with the locked slot
    const colliders = result.slots.filter(
      (s) => s.id !== lockedSlot.id && s.day === 0 && s.period === 1,
    );
    expect(colliders).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // 8. generateAlternatives() API
  // ---------------------------------------------------------------------------
  it('generates ranked, deduplicated alternatives with different profile weights', () => {
    const input: EngineInput = {
      settings: baseSettings,
      calendar: { holidays: [] },
      sections: [{ id: 'sec_alt_test', name: 'Alt Section', strength: 30 }],
      batches: [],
      faculty: [
        {
          id: 'fac_a',
          name: 'Faculty A',
          code: 'FA',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
        {
          id: 'fac_b',
          name: 'Faculty B',
          code: 'FB',
          maxHoursPerDay: 5,
          maxHoursPerWeek: 20,
        },
      ],
      rooms: [
        { id: 'rm_1', name: 'Room 1', type: 'lecture', capacity: 40 },
        { id: 'rm_2', name: 'Room 2', type: 'lecture', capacity: 40 },
      ],
      subjects: [
        {
          id: 'sub_1',
          name: 'Subject 1',
          code: 'S1',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_a'],
          sectionId: 'sec_alt_test',
        },
        {
          id: 'sub_2',
          name: 'Subject 2',
          code: 'S2',
          type: 'theory',
          weeklyHours: 4,
          facultyIds: ['fac_b'],
          sectionId: 'sec_alt_test',
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const alternatives = generateAlternatives(input, 3, { seed: 1001 });

    expect(alternatives).toHaveLength(3);
    // Verify ranking
    expect(alternatives[0]?.versionNo).toBe(1);
    expect(alternatives[0]?.label).toContain('Recommended');
    expect(alternatives[0]?.score).toBeGreaterThanOrEqual(
      alternatives[1]?.score || 0,
    );
    expect(alternatives[1]?.score).toBeGreaterThanOrEqual(
      alternatives[2]?.score || 0,
    );

    // Verify stats
    for (const alt of alternatives) {
      expect(alt.stats.occupiedSlots).toBe(8); // 4 + 4 hours
      expect(alt.slots).toHaveLength(8);
      const hardViols = alt.conflicts.filter((c) => c.type === 'hard');
      expect(hardViols).toHaveLength(0);
    }
  });
});
