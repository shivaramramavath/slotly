import { ValidationService } from '../core/validation.service';
import type { EngineInput, Slot } from '../core/types';

describe('ValidationService Pipeline', () => {
  const validator = new ValidationService();

  const validProjectInput: EngineInput = {
    settings: {
      days: ['Monday', 'Tuesday', 'Wednesday'],
      periodsPerDay: 4,
      periodDuration: 50,
      breaks: [{ period: 3, name: 'Break' }],
    },
    calendar: { holidays: [] },
    sections: [{ id: 'sec_1', name: 'Section 1', strength: 50 }],
    batches: [],
    faculty: [
      {
        id: 'fac_1',
        name: 'Dr. Turing',
        code: 'TUR',
        maxHoursPerDay: 4,
        maxHoursPerWeek: 18,
      },
    ],
    rooms: [
      { id: 'room_1', name: 'Lecture Hall 1', type: 'lecture', capacity: 60 },
    ],
    subjects: [
      {
        id: 'sub_1',
        code: 'CS101',
        name: 'Intro',
        type: 'theory',
        weeklyHours: 2,
        facultyIds: ['fac_1'],
      },
    ],
    electiveGroups: [],
    lockedSlots: [],
  };

  it('reports valid with 100 score for a clean schedule', () => {
    const slots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        facultyId: 'fac_1',
        roomId: 'room_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 1,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        facultyId: 'fac_1',
        roomId: 'room_1',
        span: 1,
        isLocked: false,
      },
    ];

    const report = validator.validate(validProjectInput, slots);
    expect(report.valid).toBe(true);
    expect(report.hardViolationsCount).toBe(0);
    expect(report.preBuildErrors.length).toBe(0);
    expect(report.score).toBe(100);
  });

  it('reports invalid with attached suggestions on a broken schedule', () => {
    // Both slots double-booked on same faculty at day 0, period 1
    const brokenSlots: Slot[] = [
      {
        id: 's1',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        facultyId: 'fac_1',
        roomId: 'room_1',
        span: 1,
        isLocked: false,
      },
      {
        id: 's2',
        sectionId: 'sec_1',
        day: 0,
        period: 1,
        type: 'theory',
        subjectId: 'sub_1',
        facultyId: 'fac_1',
        roomId: 'room_1',
        span: 1,
        isLocked: false,
      },
    ];

    const report = validator.validate(validProjectInput, brokenSlots);
    expect(report.valid).toBe(false);
    expect(report.hardViolationsCount).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);

    const doubleBookViol = report.violations.find(
      (v) => v.constraintId === 'faculty-no-double-booking',
    );
    expect(doubleBookViol).toBeDefined();
    expect(doubleBookViol?.suggestions.length).toBeGreaterThan(0);
  });
});
