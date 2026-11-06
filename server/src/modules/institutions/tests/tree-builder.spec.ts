import { TreeBuilderService } from '../services/tree-builder.service';
import type { Institution } from '../schemas/institution.schema';
import type { Department } from '../schemas/department.schema';
import type { Program } from '../schemas/program.schema';
import type { AcademicYear } from '../schemas/academic-year.schema';
import type { Semester } from '../schemas/semester.schema';
import type { Section } from '../schemas/section.schema';
import type { Holiday } from '../schemas/holiday.schema';
import { Types } from 'mongoose';

describe('TreeBuilderService', () => {
  let service: TreeBuilderService;

  beforeEach(() => {
    service = new TreeBuilderService();
  });

  it('should assemble a complete nested academic hierarchy and calculate statistics', () => {
    const instId = new Types.ObjectId();
    const deptId = new Types.ObjectId();
    const progId = new Types.ObjectId();
    const ayId = new Types.ObjectId();
    const semId = new Types.ObjectId();
    const secId = new Types.ObjectId();

    const institution: Institution = {
      _id: instId,
      name: 'Massachusetts Institute of Technology',
      code: 'MIT',
      address: '77 Massachusetts Ave, Cambridge, MA',
      workingDays: [1, 2, 3, 4, 5],
      defaultPeriodConfig: {
        startTime: '08:30',
        periodDuration: 55,
        periodsPerDay: 8,
        breaks: [{ name: 'Lunch', afterPeriod: 4, durationMinutes: 45 }],
      },
      isComplete: true,
      isDeleted: false,
    };

    const departments: Department[] = [
      {
        _id: deptId,
        institutionId: instId,
        name: 'Electrical Engineering & Computer Science',
        code: 'EECS',
        isDeleted: false,
      },
    ];

    const programs: Program[] = [
      {
        _id: progId,
        institutionId: instId,
        departmentId: deptId,
        name: 'Computer Science & Engineering',
        code: 'CSE',
        durationYears: 4,
        isDeleted: false,
      },
    ];

    const academicYears: AcademicYear[] = [
      {
        _id: ayId,
        institutionId: instId,
        programId: progId,
        yearNumber: 1,
        label: 'First Year',
        isDeleted: false,
      },
    ];

    const semesters: Semester[] = [
      {
        _id: semId,
        institutionId: instId,
        programId: progId,
        academicYearId: ayId,
        name: 'Fall 2026',
        number: 1,
        startDate: '2026-09-01',
        endDate: '2026-12-15',
        academicYearLabel: 'First Year',
        active: true,
        isDeleted: false,
      },
    ];

    const sections: Section[] = [
      {
        _id: secId,
        institutionId: instId,
        semesterId: semId,
        academicYearId: ayId,
        name: 'Section A',
        strength: 60,
        batches: [
          { name: 'Batch A1', size: 30 },
          { name: 'Batch A2', size: 30 },
        ],
        isDeleted: false,
      },
    ];

    const holidays: Holiday[] = [
      {
        _id: new Types.ObjectId(),
        institutionId: instId,
        name: 'Thanksgiving Break',
        startDate: '2026-11-26',
        endDate: '2026-11-28',
        type: 'break',
        isDeleted: false,
      },
    ];

    const tree = service.build(
      institution,
      departments,
      programs,
      academicYears,
      semesters,
      sections,
      holidays,
    );

    // Verify root & stats
    expect(tree.institution.name).toBe('Massachusetts Institute of Technology');
    expect(tree.institution.code).toBe('MIT');
    expect(tree.stats.totalDepartments).toBe(1);
    expect(tree.stats.totalPrograms).toBe(1);
    expect(tree.stats.totalAcademicYears).toBe(1);
    expect(tree.stats.totalSemesters).toBe(1);
    expect(tree.stats.totalSections).toBe(1);
    expect(tree.stats.totalStudents).toBe(60);

    // Verify nesting depth
    expect(tree.departments).toHaveLength(1);
    const deptNode = tree.departments[0]!;
    expect(deptNode.code).toBe('EECS');
    expect(deptNode.programs).toHaveLength(1);

    const progNode = deptNode.programs[0]!;
    expect(progNode.code).toBe('CSE');
    expect(progNode.academicYears).toHaveLength(1);

    const ayNode = progNode.academicYears[0]!;
    expect(ayNode.yearNumber).toBe(1);
    expect(ayNode.semesters).toHaveLength(1);

    const semNode = ayNode.semesters[0]!;
    expect(semNode.name).toBe('Fall 2026');
    expect(semNode.sections).toHaveLength(1);

    const secNode = semNode.sections[0]!;
    expect(secNode.name).toBe('Section A');
    expect(secNode.strength).toBe(60);
    expect(secNode.batches).toHaveLength(2);

    // Verify holidays
    expect(tree.holidays).toHaveLength(1);
    expect(tree.holidays[0]!.name).toBe('Thanksgiving Break');
  });
});
