import { ScheduleState } from '../core/schedule-state';
import type { EngineInput, Slot } from '../core/types';
import {
  FacultyPreferredPeriodsConstraint,
  SpreadSubjectsAcrossDaysConstraint,
  LimitConsecutiveSameSubjectConstraint,
  BalanceFacultyLoadConstraint,
  LabsInAfternoonConstraint,
  MinimizeRoomChangesConstraint,
  DepartmentRulesConstraint,
} from '../core/constraints/soft';

describe('Soft Constraints Suite (7 Constraints)', () => {
  const baseInput: EngineInput = {
    settings: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: 7,
      periodDuration: 50,
      breaks: [{ period: 4, name: 'Lunch' }],
    },
    calendar: { holidays: [] },
    sections: [
      { id: 'sec_1', name: 'Section A', strength: 60, departmentId: 'dept_cs' },
    ],
    batches: [],
    faculty: [
      {
        id: 'fac_1',
        name: 'Dr. Turing',
        code: 'TUR',
        preferredPeriods: [{ day: 1, period: 2 }],
      },
    ],
    rooms: [
      { id: 'room_101', name: 'Lecture 101', type: 'lecture', capacity: 60 },
      { id: 'room_102', name: 'Lecture 102', type: 'lecture', capacity: 60 },
    ],
    subjects: [
      {
        id: 'sub_1',
        code: 'CS101',
        name: 'Intro CS',
        type: 'theory',
        weeklyHours: 3,
        departmentId: 'dept_cs',
      },
      {
        id: 'sub_lab',
        code: 'CS102L',
        name: 'CS Lab',
        type: 'lab',
        weeklyHours: 2,
      },
    ],
    electiveGroups: [],
    lockedSlots: [],
  };

  // 1. FacultyPreferredPeriods
  it('1. FacultyPreferredPeriods: penalizes slots outside preferred periods', () => {
    const constraint = new FacultyPreferredPeriodsConstraint(5);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 5,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(constraint.score(new ScheduleState(baseInput, slots))).toBeLessThan(
      0,
    );
  });

  // 2. SpreadSubjectsAcrossDays
  it('2. SpreadSubjectsAcrossDays: penalizes clustering theory hours on the same day', () => {
    const constraint = new SpreadSubjectsAcrossDaysConstraint(8);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('Spreading across days is preferred');
  });

  // 3. LimitConsecutiveSameSubject
  it('3. LimitConsecutiveSameSubject: penalizes > 2 consecutive theory classes', () => {
    const constraint = new LimitConsecutiveSameSubjectConstraint(6);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's3',
        sectionId: 'sec_1',
        day: 1,
        period: 3,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('3 consecutive periods');
  });

  // 4. BalanceFacultyLoad
  it('4. BalanceFacultyLoad: penalizes uneven faculty daily workloads', () => {
    const constraint = new BalanceFacultyLoadConstraint(5);
    const slots: Slot[] = [
      // 5 hours on Monday
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 0,
        period: 2,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's3',
        sectionId: 'sec_1',
        day: 0,
        period: 3,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's4',
        sectionId: 'sec_1',
        day: 0,
        period: 5,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's5',
        sectionId: 'sec_1',
        day: 0,
        period: 6,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
      // 1 hour on Tuesday
      {
        id: 's6',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        facultyId: 'fac_1',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('unevenly distributed');
  });

  // 5. LabsInAfternoon
  it('5. LabsInAfternoon: penalizes lab blocks scheduled in early morning periods', () => {
    const constraint = new LabsInAfternoonConstraint(7);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'lab',
        subjectId: 'sub_lab',
        span: 2,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('Afternoon periods are preferred');
  });

  // 6. MinimizeRoomChanges
  it('6. MinimizeRoomChanges: penalizes classroom changes between consecutive theory periods', () => {
    const constraint = new MinimizeRoomChangesConstraint(4);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        roomId: 'room_101',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 2,
        type: 'theory',
        roomId: 'room_102',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('switches classrooms');
  });

  // 7. DepartmentRules
  it('7. DepartmentRules: penalizes core department subjects scheduled late in the day', () => {
    const constraint = new DepartmentRulesConstraint(5);
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 1,
        period: 6,
        type: 'theory',
        subjectId: 'sub_1',
        span: 1,
        isLocked: false,
      },
    ];
    const viols = constraint.check(new ScheduleState(baseInput, slots));
    expect(viols.length).toBe(1);
    expect(viols[0]?.message).toContain('Morning periods are preferred');
  });
});
