import {
  AcademicYearCompletionRule,
  BatchCompletionRule,
  DepartmentCompletionRule,
  ElectiveGroupCompletionRule,
  FacultyCompletionRule,
  InstitutionCompletionRule,
  ProgramCompletionRule,
  RoomCompletionRule,
  SectionCompletionRule,
  SemesterCompletionRule,
  SubjectAssignmentCompletionRule,
} from '../model/rules/blueprint-completion.rules';

describe('Blueprint Completion Rules', () => {
  describe('InstitutionCompletionRule', () => {
    const rule = new InstitutionCompletionRule();

    it('should be complete with valid name, code, working days, and period config', () => {
      const res = rule.compute({
        name: 'Oxford College',
        code: 'OXF',
        workingDays: [1, 2, 3, 4, 5],
        periodConfig: {
          startTime: '09:00',
          periodsPerDay: 7,
          periodDuration: 50,
        },
      });
      expect(res.status).toBe('complete');
      expect(res.missing).toHaveLength(0);
    });

    it('should report missing fields when incomplete', () => {
      const res = rule.compute({ name: 'O' });
      expect(res.status).toBe('incomplete');
      expect(res.missing.some((m) => m.field === 'name')).toBe(true);
      expect(res.missing.some((m) => m.field === 'code')).toBe(true);
      expect(res.missing.some((m) => m.field === 'workingDays')).toBe(true);
      expect(res.missing.some((m) => m.field === 'periodConfig')).toBe(true);
    });

    it('should return empty when data is empty', () => {
      const res = rule.compute({});
      expect(res.status).toBe('empty');
    });
  });

  describe('DepartmentCompletionRule', () => {
    const rule = new DepartmentCompletionRule();

    it('should be complete when name and code are valid', () => {
      const res = rule.compute({ name: 'Computer Science', code: 'CS' });
      expect(res.status).toBe('complete');
      expect(res.missing).toHaveLength(0);
    });

    it('should be incomplete when code is missing', () => {
      const res = rule.compute({ name: 'Computer Science' });
      expect(res.status).toBe('incomplete');
      expect(res.missing[0]?.field).toBe('code');
    });
  });

  describe('ProgramCompletionRule', () => {
    const rule = new ProgramCompletionRule();

    it('should be complete when name and durationYears > 0', () => {
      const res = rule.compute({ name: 'B.Tech CS', durationYears: 4 });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when duration is 0 or negative', () => {
      const res = rule.compute({ name: 'B.Tech CS', durationYears: 0 });
      expect(res.status).toBe('incomplete');
      expect(res.missing[0]?.field).toBe('durationYears');
    });
  });

  describe('AcademicYearCompletionRule', () => {
    const rule = new AcademicYearCompletionRule();

    it('should be complete when yearNumber > 0 and label provided', () => {
      const res = rule.compute({ yearNumber: 1, label: 'Year 1' });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when label is missing', () => {
      const res = rule.compute({ yearNumber: 1 });
      expect(res.status).toBe('incomplete');
      expect(res.missing[0]?.field).toBe('label');
    });
  });

  describe('SemesterCompletionRule', () => {
    const rule = new SemesterCompletionRule();

    it('should be complete with semester number and start/end dates', () => {
      const res = rule.compute({
        semesterNumber: 1,
        startDate: '2026-08-01',
        endDate: '2026-12-15',
      });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when dates are missing', () => {
      const res = rule.compute({ semesterNumber: 1 });
      expect(res.status).toBe('incomplete');
      expect(res.missing.length).toBeGreaterThan(0);
    });
  });

  describe('SectionCompletionRule', () => {
    const rule = new SectionCompletionRule();

    it('should be complete when name is set and strength > 0', () => {
      const res = rule.compute({ name: 'Section A', strength: 60 });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when strength is 0', () => {
      const res = rule.compute({ name: 'Section A', strength: 0 });
      expect(res.status).toBe('incomplete');
      expect(res.missing[0]?.field).toBe('strength');
    });
  });

  describe('BatchCompletionRule', () => {
    const rule = new BatchCompletionRule();

    it('should be complete with valid name and size within section strength', () => {
      const res = rule.compute(
        { name: 'Batch 1', size: 30 },
        {
          parentNode: { type: 'section', data: { strength: 60 } },
          siblingNodes: [{ type: 'batch', data: { size: 20 } }],
        },
      );
      expect(res.status).toBe('complete');
    });

    it('should fail when sum of batch sizes exceeds section strength', () => {
      const res = rule.compute(
        { name: 'Batch 2', size: 35 },
        {
          parentNode: { type: 'section', data: { strength: 60 } },
          siblingNodes: [{ type: 'batch', data: { size: 30 } }],
        },
      );
      expect(res.status).toBe('incomplete');
      expect(res.missing.some((m) => m.field === 'size')).toBe(true);
    });
  });

  describe('SubjectAssignmentCompletionRule', () => {
    const rule = new SubjectAssignmentCompletionRule();

    it('should be complete when subject, type, weeklyHours, faculty, roomType are set', () => {
      const res = rule.compute({
        subjectId: 'sub_algo',
        type: 'theory',
        weeklyHours: 4,
        facultyId: 'fac_smith',
        roomType: 'lecture',
      });
      expect(res.status).toBe('complete');
    });

    it('should report missing faculty when facultyId is omitted', () => {
      const res = rule.compute({
        subjectId: 'sub_algo',
        type: 'theory',
        weeklyHours: 4,
        roomType: 'lecture',
      });
      expect(res.status).toBe('incomplete');
      expect(res.missing.some((m) => m.field === 'facultyId')).toBe(true);
    });
  });

  describe('ElectiveGroupCompletionRule', () => {
    const rule = new ElectiveGroupCompletionRule();

    it('should be complete with name, at least 2 subjects and simultaneity flag', () => {
      const res = rule.compute({
        name: 'Open Elective 1',
        subjectIds: ['sub_ai', 'sub_ml'],
        mustBeSimultaneous: true,
      });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when less than 2 subjects are attached', () => {
      const res = rule.compute({
        name: 'Open Elective 1',
        subjectIds: ['sub_ai'],
        mustBeSimultaneous: true,
      });
      expect(res.status).toBe('incomplete');
      expect(res.missing.some((m) => m.field === 'subjectIds')).toBe(true);
    });
  });

  describe('FacultyCompletionRule', () => {
    const rule = new FacultyCompletionRule();

    it('should be complete when availability and hours bounds are set', () => {
      const res = rule.compute({
        availability: [[true], [true]],
        maxHoursPerDay: 4,
        maxHoursPerWeek: 16,
      });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when maxHoursPerDay is 0', () => {
      const res = rule.compute({
        availability: [[true]],
        maxHoursPerDay: 0,
        maxHoursPerWeek: 16,
      });
      expect(res.status).toBe('incomplete');
    });
  });

  describe('RoomCompletionRule', () => {
    const rule = new RoomCompletionRule();

    it('should be complete with type and capacity', () => {
      const res = rule.compute({ type: 'lecture', capacity: 60 });
      expect(res.status).toBe('complete');
    });

    it('should be incomplete when capacity is 0', () => {
      const res = rule.compute({ type: 'lecture', capacity: 0 });
      expect(res.status).toBe('incomplete');
    });
  });
});
