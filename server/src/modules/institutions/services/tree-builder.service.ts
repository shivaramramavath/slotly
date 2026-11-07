// Domain service orchestrating tree-builder.service business logic.
import { Injectable } from '@nestjs/common';
import type {
  InstitutionDto,
  HolidayDto,
  InstitutionStructureDto,
  DepartmentNode,
  ProgramNode,
  AcademicYearNode,
  SemesterNode,
  SectionNode,
} from '@slotly/contracts';
import type { Institution } from '../schemas/institution.schema';
import type { Department } from '../schemas/department.schema';
import type { Program } from '../schemas/program.schema';
import type { AcademicYear } from '../schemas/academic-year.schema';
import type { Semester } from '../schemas/semester.schema';
import type { Section } from '../schemas/section.schema';
import type { Holiday } from '../schemas/holiday.schema';

/** Injectable service providing tree builder service logic. */
@Injectable()
export class TreeBuilderService {
  private toId(entity: { id?: string | undefined; _id?: unknown }): string {
    return (entity.id || entity._id)?.toString() || '';
  }

  build(
    institution: Institution,
    departments: Department[],
    programs: Program[],
    academicYears: AcademicYear[],
    semesters: Semester[],
    sections: Section[],
    holidays: Holiday[],
  ): InstitutionStructureDto {
    const instId = this.toId(institution);

    // 1. Map Sections
    const sectionNodes: SectionNode[] = sections.map((sec) => ({
      type: 'Section',
      id: this.toId(sec),
      institutionId: instId,
      semesterId: sec.semesterId.toString(),
      academicYearId: sec.academicYearId.toString(),
      name: sec.name,
      strength: sec.strength,
      batches: sec.batches || [],
    }));

    // 2. Map Semesters with nested sections
    const semesterNodes: SemesterNode[] = semesters.map((sem) => {
      const semId = this.toId(sem);
      const childSections = sectionNodes.filter((s) => s.semesterId === semId);
      return {
        type: 'Semester',
        id: semId,
        institutionId: instId,
        programId: sem.programId.toString(),
        academicYearId: sem.academicYearId.toString(),
        name: sem.name,
        number: sem.number,
        startDate: sem.startDate,
        endDate: sem.endDate,
        academicYearLabel: sem.academicYearLabel,
        active: sem.active,
        sections: childSections,
      };
    });

    // 3. Map Academic Years with nested semesters
    const academicYearNodes: AcademicYearNode[] = academicYears.map((ay) => {
      const ayId = this.toId(ay);
      const childSemesters = semesterNodes.filter(
        (s) => s.academicYearId === ayId,
      );
      return {
        type: 'AcademicYear',
        id: ayId,
        institutionId: instId,
        programId: ay.programId.toString(),
        yearNumber: ay.yearNumber,
        label: ay.label,
        semesters: childSemesters,
      };
    });

    // 4. Map Programs with nested academic years
    const programNodes: ProgramNode[] = programs.map((prog) => {
      const progId = this.toId(prog);
      const childYears = academicYearNodes.filter(
        (y) => y.programId === progId,
      );
      return {
        type: 'Program',
        id: progId,
        institutionId: instId,
        departmentId: prog.departmentId.toString(),
        name: prog.name,
        code: prog.code,
        durationYears: prog.durationYears,
        academicYears: childYears,
      };
    });

    // 5. Map Departments with nested programs
    const departmentNodes: DepartmentNode[] = departments.map((dept) => {
      const deptId = this.toId(dept);
      const childPrograms = programNodes.filter(
        (p) => p.departmentId === deptId,
      );
      return {
        type: 'Department',
        id: deptId,
        institutionId: instId,
        name: dept.name,
        code: dept.code,
        headFacultyId: dept.headFacultyId?.toString(),
        programs: childPrograms,
      };
    });

    // 6. Map Holidays
    const holidayDtos: HolidayDto[] = holidays.map((h) => ({
      id: this.toId(h),
      institutionId: instId,
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
      type: h.type,
    }));

    // 7. Calculate aggregate stats
    const totalStudents = sectionNodes.reduce((acc, s) => acc + s.strength, 0);

    const institutionDto: InstitutionDto = {
      id: instId,
      name: institution.name,
      code: institution.code,
      address: institution.address || '',
      workingDays: institution.workingDays,
      defaultPeriodConfig: institution.defaultPeriodConfig,
      isComplete: institution.isComplete,
    };

    return {
      institution: institutionDto,
      departments: departmentNodes,
      holidays: holidayDtos,
      stats: {
        totalDepartments: departmentNodes.length,
        totalPrograms: programNodes.length,
        totalAcademicYears: academicYearNodes.length,
        totalSemesters: semesterNodes.length,
        totalSections: sectionNodes.length,
        totalStudents,
      },
    };
  }
}
