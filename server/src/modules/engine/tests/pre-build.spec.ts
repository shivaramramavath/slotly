// Unit tests validating PreBuildChecker rules in @slotly/engine.
import { PreBuildChecker } from '@slotly/engine';
import type { EngineInput } from '@slotly/engine';

describe('PreBuildChecker', () => {
  const checker = new PreBuildChecker();

  it('detects INSUFFICIENT_LAB_CAPACITY when no lab rooms exist for lab subjects', () => {
    const input: EngineInput = {
      settings: {
        days: ['Mon', 'Tue'],
        periodsPerDay: 5,
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_1', name: 'CSE A', strength: 60 }],
      batches: [],
      faculty: [],
      rooms: [{ id: 'r1', name: 'Lecture 1', type: 'lecture', capacity: 60 }],
      subjects: [
        {
          id: 'sub_lab',
          code: 'CSL',
          name: 'Operating Systems Lab',
          type: 'lab',
          weeklyHours: 3,
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const errors = checker.check(input);
    const labError = errors.find((e) => e.code === 'INSUFFICIENT_LAB_CAPACITY');
    expect(labError).toBeDefined();
    expect(labError?.message).toContain('no Laboratory rooms exist');
  });

  it('detects MISSING_ALLOCATION when a subject has no faculty assigned', () => {
    const input: EngineInput = {
      settings: {
        days: ['Mon'],
        periodsPerDay: 4,
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_1', name: 'CSE A', strength: 60 }],
      batches: [],
      faculty: [],
      rooms: [],
      subjects: [
        {
          id: 'sub_1',
          code: 'CS1',
          name: 'Data Structures',
          type: 'theory',
          weeklyHours: 3,
          facultyIds: [],
        },
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const errors = checker.check(input);
    const missingAlloc = errors.find((e) => e.code === 'MISSING_ALLOCATION');
    expect(missingAlloc).toBeDefined();
    expect(missingAlloc?.message).toContain('no faculty instructor assigned');
    expect(missingAlloc?.fixHint?.field).toBe('facultyId');
  });

  it('detects FACULTY_OVERLOAD when faculty assigned hours exceed maxHoursPerWeek', () => {
    const input: EngineInput = {
      settings: {
        days: ['Mon'],
        periodsPerDay: 4,
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [{ id: 'sec_1', name: 'CSE A', strength: 60 }],
      batches: [],
      faculty: [
        { id: 'fac_1', name: 'Dr. Turing', code: 'TUR', maxHoursPerWeek: 10 },
      ],
      rooms: [],
      subjects: [
        {
          id: 'sub_1',
          code: 'CS1',
          name: 'AI',
          type: 'theory',
          weeklyHours: 6,
          facultyIds: ['fac_1'],
        },
        {
          id: 'sub_2',
          code: 'CS2',
          name: 'ML',
          type: 'theory',
          weeklyHours: 6,
          facultyIds: ['fac_1'],
        }, // 12 hours > 10
      ],
      electiveGroups: [],
      lockedSlots: [],
    };

    const errors = checker.check(input);
    const overload = errors.find((e) => e.code === 'FACULTY_OVERLOAD');
    expect(overload).toBeDefined();
    expect(overload?.message).toContain('exceeding their maximum workload');
    expect(overload?.details?.['totalHours']).toBe(12);
  });

  it('detects INVALID_GRAPH when section count is zero', () => {
    const input: EngineInput = {
      settings: {
        days: ['Mon'],
        periodsPerDay: 4,
        periodDuration: 50,
        breaks: [],
      },
      calendar: { holidays: [] },
      sections: [],
      batches: [],
      faculty: [],
      rooms: [],
      subjects: [],
      electiveGroups: [],
      lockedSlots: [],
    };

    const errors = checker.check(input);
    const invalidGraph = errors.find((e) => e.code === 'INVALID_GRAPH');
    expect(invalidGraph).toBeDefined();
    expect(invalidGraph?.message).toContain('contains no sections');
  });
});
