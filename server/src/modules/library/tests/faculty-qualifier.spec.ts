import { StandardFacultyQualifier } from '../strategies/faculty-qualifier.strategy';
import { Faculty } from '../schemas/faculty.schema';

describe('StandardFacultyQualifier Strategy', () => {
  let qualifier: StandardFacultyQualifier;

  beforeEach(() => {
    qualifier = new StandardFacultyQualifier();
  });

  const baseFaculty: Faculty = {
    id: 'fac-1',
    institutionId: 'inst-1',
    departmentId: 'dept-1',
    name: 'Dr. Alan Turing',
    email: 'alan@slotly.edu',
    code: 'TUR',
    designation: 'Professor',
    availability: [
      [true, true, true, false, true], // Day 0
      [true, true, true, true, true], // Day 1
    ],
    preferredPeriods: [{ day: 1, period: 1 }],
    unavailableSlots: [{ day: 0, period: 4 }],
    minHoursPerWeek: 4,
    maxHoursPerDay: 4,
    maxHoursPerWeek: 16,
    subjectIds: ['sub-cs101', 'sub-cs102'],
    archived: false,
    isDeleted: false,
  };

  it('should qualify faculty when subject qualification and availability match', () => {
    const res = qualifier.qualify(baseFaculty, {
      subjectId: 'sub-cs101',
      day: 1,
      period: 1,
      currentDailyHours: 2,
      currentWeeklyHours: 8,
    });

    expect(res.qualified).toBe(true);
    expect(res.hasSubjectQualification).toBe(true);
    expect(res.availabilityFit).toBe(true);
    expect(res.workloadWithinLimits).toBe(true);
    expect(res.isPreferredSlot).toBe(true); // Gets preferred slot bonus
    expect(res.score).toBeGreaterThan(90);
  });

  it('should disqualify when faculty is not qualified for subject', () => {
    const res = qualifier.qualify(baseFaculty, {
      subjectId: 'sub-bio201',
    });

    expect(res.qualified).toBe(false);
    expect(res.hasSubjectQualification).toBe(false);
    expect(res.reasons).toContain('NOT_QUALIFIED_FOR_SUBJECT');
  });

  it('should disqualify when slot is in unavailableSlots list', () => {
    const res = qualifier.qualify(baseFaculty, {
      subjectId: 'sub-cs101',
      day: 0,
      period: 4,
    });

    expect(res.qualified).toBe(false);
    expect(res.availabilityFit).toBe(false);
    expect(res.reasons).toContain('FACULTY_UNAVAILABLE_SLOT_RESTRICTION');
  });

  it('should disqualify when workload exceeds max daily or weekly hours', () => {
    const resDaily = qualifier.qualify(baseFaculty, {
      subjectId: 'sub-cs101',
      currentDailyHours: 4, // Max is 4
    });
    expect(resDaily.qualified).toBe(false);
    expect(resDaily.workloadWithinLimits).toBe(false);
    expect(resDaily.reasons).toContain('EXCEEDS_DAILY_HOURS_LIMIT');

    const resWeekly = qualifier.qualify(baseFaculty, {
      subjectId: 'sub-cs101',
      currentWeeklyHours: 16, // Max is 16
    });
    expect(resWeekly.qualified).toBe(false);
    expect(resWeekly.workloadWithinLimits).toBe(false);
    expect(resWeekly.reasons).toContain('EXCEEDS_WEEKLY_HOURS_LIMIT');
  });
});
