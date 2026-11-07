import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type {
  InstitutionDto,
  CreateInstitutionDto,
  UpdateInstitutionDto,
  DepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ProgramDto,
  CreateProgramDto,
  UpdateProgramDto,
  AcademicYearDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  SemesterDto,
  CreateSemesterDto,
  UpdateSemesterDto,
  SectionDto,
  CreateSectionDto,
  UpdateSectionDto,
  HolidayDto,
  CreateHolidayDto,
  InstitutionStructureDto,
} from '@slotly/contracts';
import { INSTITUTION_REPOSITORY } from '../repositories/institution.repository';
import type { InstitutionRepository } from '../repositories/institution.repository';
import { DEPARTMENT_REPOSITORY } from '../repositories/department.repository';
import type { DepartmentRepository } from '../repositories/department.repository';
import { PROGRAM_REPOSITORY } from '../repositories/program.repository';
import type { ProgramRepository } from '../repositories/program.repository';
import { ACADEMIC_YEAR_REPOSITORY } from '../repositories/academic-year.repository';
import type { AcademicYearRepository } from '../repositories/academic-year.repository';
import { SEMESTER_REPOSITORY } from '../repositories/semester.repository';
import type { SemesterRepository } from '../repositories/semester.repository';
import { SECTION_REPOSITORY } from '../repositories/section.repository';
import type { SectionRepository } from '../repositories/section.repository';
import { HOLIDAY_REPOSITORY } from '../repositories/holiday.repository';
import type { HolidayRepository } from '../repositories/holiday.repository';
import { DependencyCheckerService } from './dependency-checker.service';
import { TreeBuilderService } from './tree-builder.service';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { EventBus } from '../../../common/events/event-bus.service';
import { AuditService } from '../../../common/audit/audit.service';

export const INSTITUTIONS_SERVICE = Symbol('INSTITUTIONS_SERVICE');

export interface InstitutionsService {
  createInstitution(
    dto: CreateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionDto>;
  getInstitution(id: string): Promise<InstitutionDto>;
  updateInstitution(
    id: string,
    dto: UpdateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionDto>;
  getStructure(institutionId: string): Promise<InstitutionStructureDto>;

  // Departments
  listDepartments(institutionId: string): Promise<DepartmentDto[]>;
  createDepartment(
    institutionId: string,
    dto: CreateDepartmentDto,
    actorId: string,
  ): Promise<DepartmentDto>;
  updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
    actorId: string,
  ): Promise<DepartmentDto>;
  deleteDepartment(id: string, actorId: string): Promise<{ message: string }>;

  // Programs
  listPrograms(institutionId: string): Promise<ProgramDto[]>;
  createProgram(
    institutionId: string,
    dto: CreateProgramDto,
    actorId: string,
  ): Promise<ProgramDto>;
  updateProgram(
    id: string,
    dto: UpdateProgramDto,
    actorId: string,
  ): Promise<ProgramDto>;
  deleteProgram(id: string, actorId: string): Promise<{ message: string }>;

  // Academic Years
  listAcademicYears(institutionId: string): Promise<AcademicYearDto[]>;
  createAcademicYear(
    institutionId: string,
    dto: CreateAcademicYearDto,
    actorId: string,
  ): Promise<AcademicYearDto>;
  updateAcademicYear(
    id: string,
    dto: UpdateAcademicYearDto,
    actorId: string,
  ): Promise<AcademicYearDto>;
  deleteAcademicYear(id: string, actorId: string): Promise<{ message: string }>;

  // Semesters
  listSemesters(institutionId: string): Promise<SemesterDto[]>;
  createSemester(
    institutionId: string,
    dto: CreateSemesterDto,
    actorId: string,
  ): Promise<SemesterDto>;
  updateSemester(
    id: string,
    dto: UpdateSemesterDto,
    actorId: string,
  ): Promise<SemesterDto>;
  deleteSemester(id: string, actorId: string): Promise<{ message: string }>;

  // Sections
  listSections(institutionId: string): Promise<SectionDto[]>;
  createSection(
    institutionId: string,
    dto: CreateSectionDto,
    actorId: string,
  ): Promise<SectionDto>;
  updateSection(
    id: string,
    dto: UpdateSectionDto,
    actorId: string,
  ): Promise<SectionDto>;
  deleteSection(id: string, actorId: string): Promise<{ message: string }>;

  // Holidays
  listHolidays(institutionId: string): Promise<HolidayDto[]>;
  createHoliday(
    institutionId: string,
    dto: CreateHolidayDto,
    actorId: string,
  ): Promise<HolidayDto>;
  deleteHoliday(id: string, actorId: string): Promise<{ message: string }>;
}

@Injectable()
export class DefaultInstitutionsService implements InstitutionsService {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepository,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepo: ProgramRepository,
    @Inject(ACADEMIC_YEAR_REPOSITORY)
    private readonly yearRepo: AcademicYearRepository,
    @Inject(SEMESTER_REPOSITORY)
    private readonly semesterRepo: SemesterRepository,
    @Inject(SECTION_REPOSITORY)
    private readonly sectionRepo: SectionRepository,
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepo: HolidayRepository,
    private readonly dependencyChecker: DependencyCheckerService,
    private readonly treeBuilder: TreeBuilderService,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
  ) {}

  private toId(entity: { id?: string | undefined; _id?: unknown }): string {
    return (entity.id || entity._id)?.toString() || '';
  }

  private async notifyAcademicChanged(
    institutionId: string,
    actorId: string,
    action: string,
    details?: Record<string, unknown>,
  ) {
    await this.cache.invalidateTag(`institution:${institutionId}`);
    await this.eventBus.publish('academic.changed', {
      institutionId,
      action,
      details,
      timestamp: Date.now(),
    });
    await this.auditService.log(
      'ACADEMIC_UPDATED',
      actorId,
      {
        type: 'institution',
        id: institutionId,
      },
      {
        action,
        ...details,
      },
    );
  }

  // ==========================================
  // INSTITUTION
  // ==========================================
  async createInstitution(
    dto: CreateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionDto> {
    const existing = await this.institutionRepo.findByCode(dto.code);
    if (existing && !existing.isDeleted) {
      throw new BadRequestException(
        `Institution code "${dto.code}" is already in use.`,
      );
    }

    const created = await this.institutionRepo.create({
      name: dto.name.trim(),
      code: dto.code.trim().toUpperCase(),
      address: dto.address?.trim() || '',
      workingDays: dto.workingDays || [1, 2, 3, 4, 5],
      defaultPeriodConfig: dto.defaultPeriodConfig || {
        startTime: '09:00',
        periodDuration: 50,
        periodsPerDay: 7,
        breaks: [{ name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 }],
      },
      isComplete: true,
      isDeleted: false,
    });

    const instId = this.toId(created);
    await this.notifyAcademicChanged(instId, actorId, 'INSTITUTION_CREATED', {
      id: instId,
      name: created.name,
      code: created.code,
    });

    return this.getInstitution(instId);
  }

  async getInstitution(id: string): Promise<InstitutionDto> {
    const inst = await this.institutionRepo.findById(id);
    if (!inst || inst.isDeleted)
      throw new NotFoundException('Institution not found.');
    return {
      id: this.toId(inst),
      name: inst.name,
      code: inst.code,
      address: inst.address || '',
      workingDays: inst.workingDays,
      defaultPeriodConfig: inst.defaultPeriodConfig,
      isComplete: inst.isComplete,
    };
  }

  async updateInstitution(
    id: string,
    dto: UpdateInstitutionDto,
    actorId: string,
  ): Promise<InstitutionDto> {
    const inst = await this.institutionRepo.findById(id);
    if (!inst || inst.isDeleted)
      throw new NotFoundException('Institution not found.');

    await this.institutionRepo.update(id, {
      name: dto.name ?? inst.name,
      address: dto.address ?? inst.address,
      workingDays: dto.workingDays ?? inst.workingDays,
      defaultPeriodConfig: dto.defaultPeriodConfig ?? inst.defaultPeriodConfig,
    });

    await this.notifyAcademicChanged(id, actorId, 'INSTITUTION_UPDATED', {
      id,
    });
    return this.getInstitution(id);
  }

  async getStructure(institutionId: string): Promise<InstitutionStructureDto> {
    const cacheKey = `slotly:institution:${institutionId}:tree`;
    return this.cache.remember<InstitutionStructureDto>(
      cacheKey,
      86400,
      async () => {
        const inst = await this.institutionRepo.findById(institutionId);
        if (!inst || inst.isDeleted)
          throw new NotFoundException('Institution not found.');

        const [depts, progs, years, sems, secs, hols] = await Promise.all([
          this.departmentRepo.findByInstitution(institutionId),
          this.programRepo.findByInstitution(institutionId),
          this.yearRepo.findByInstitution(institutionId),
          this.semesterRepo.findByInstitution(institutionId),
          this.sectionRepo.findByInstitution(institutionId),
          this.holidayRepo.findByInstitution(institutionId),
        ]);

        return this.treeBuilder.build(
          inst,
          depts,
          progs,
          years,
          sems,
          secs,
          hols,
        );
      },
      [`institution:${institutionId}`],
    );
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  async listDepartments(institutionId: string): Promise<DepartmentDto[]> {
    const depts = await this.departmentRepo.findByInstitution(institutionId);
    return depts.map((d) => ({
      id: this.toId(d),
      institutionId,
      name: d.name,
      code: d.code,
      headFacultyId: d.headFacultyId?.toString(),
    }));
  }

  async createDepartment(
    institutionId: string,
    dto: CreateDepartmentDto,
    actorId: string,
  ): Promise<DepartmentDto> {
    const inst = await this.institutionRepo.findById(institutionId);
    this.dependencyChecker.assertParentActive(
      inst,
      'Institution',
      institutionId,
    );

    const existing = await this.departmentRepo.findByCode(
      institutionId,
      dto.code,
    );
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NAME',
        message: `Department code '${dto.code}' already exists in this institution.`,
      });
    }

    const created = await this.departmentRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      headFacultyId: dto.headFacultyId
        ? new Types.ObjectId(dto.headFacultyId)
        : undefined,
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'DEPARTMENT_CREATED',
      {
        departmentId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      name: created.name,
      code: created.code,
      headFacultyId: created.headFacultyId?.toString(),
    };
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
    actorId: string,
  ): Promise<DepartmentDto> {
    const dept = await this.departmentRepo.findById(id);
    if (!dept || dept.isDeleted)
      throw new NotFoundException('Department not found.');

    const instId = dept.institutionId.toString();

    if (dto.code && dto.code.toUpperCase().trim() !== dept.code) {
      const existing = await this.departmentRepo.findByCode(instId, dto.code);
      if (existing && this.toId(existing) !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_NAME',
          message: `Department code '${dto.code}' already exists.`,
        });
      }
    }

    const updated = await this.departmentRepo.update(id, {
      name: dto.name ? dto.name.trim() : dept.name,
      code: dto.code ? dto.code.toUpperCase().trim() : dept.code,
      headFacultyId: dto.headFacultyId
        ? new Types.ObjectId(dto.headFacultyId)
        : dept.headFacultyId,
    });

    await this.notifyAcademicChanged(instId, actorId, 'DEPARTMENT_UPDATED', {
      id,
    });
    return {
      id,
      institutionId: instId,
      name: updated?.name || dept.name,
      code: updated?.code || dept.code,
      headFacultyId: updated?.headFacultyId?.toString(),
    };
  }

  async deleteDepartment(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const dept = await this.departmentRepo.findById(id);
    if (!dept || dept.isDeleted)
      throw new NotFoundException('Department not found.');

    // Dependency check: Cannot delete department if active programs exist
    const activeProgramsCount =
      await this.programRepo.countActiveByDepartment(id);
    this.dependencyChecker.assertNoActiveChildren(
      activeProgramsCount,
      'Program',
      dept.name,
    );

    await this.departmentRepo.softDelete(id);
    await this.notifyAcademicChanged(
      dept.institutionId.toString(),
      actorId,
      'DEPARTMENT_DELETED',
      { id },
    );
    return { message: `Department '${dept.name}' deleted successfully.` };
  }

  // ==========================================
  // PROGRAMS
  // ==========================================
  async listPrograms(institutionId: string): Promise<ProgramDto[]> {
    const progs = await this.programRepo.findByInstitution(institutionId);
    return progs.map((p) => ({
      id: this.toId(p),
      institutionId,
      departmentId: p.departmentId.toString(),
      name: p.name,
      code: p.code,
      durationYears: p.durationYears,
    }));
  }

  async createProgram(
    institutionId: string,
    dto: CreateProgramDto,
    actorId: string,
  ): Promise<ProgramDto> {
    // Referential check: parent department must exist and not be deleted
    const parentDept = await this.departmentRepo.findById(dto.departmentId);
    this.dependencyChecker.assertParentActive(
      parentDept,
      'Department',
      dto.departmentId,
    );

    const existing = await this.programRepo.findByCode(
      dto.departmentId,
      dto.code,
    );
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NAME',
        message: `Program code '${dto.code}' already exists in this department.`,
      });
    }

    const created = await this.programRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      departmentId: new Types.ObjectId(dto.departmentId),
      name: dto.name.trim(),
      code: dto.code.toUpperCase().trim(),
      durationYears: dto.durationYears,
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'PROGRAM_CREATED',
      {
        programId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      departmentId: dto.departmentId,
      name: created.name,
      code: created.code,
      durationYears: created.durationYears,
    };
  }

  async updateProgram(
    id: string,
    dto: UpdateProgramDto,
    actorId: string,
  ): Promise<ProgramDto> {
    const prog = await this.programRepo.findById(id);
    if (!prog || prog.isDeleted)
      throw new NotFoundException('Program not found.');

    if (dto.code && dto.code.toUpperCase().trim() !== prog.code) {
      const existing = await this.programRepo.findByCode(
        prog.departmentId.toString(),
        dto.code,
      );
      if (existing && this.toId(existing) !== id) {
        throw new BadRequestException({
          code: 'DUPLICATE_NAME',
          message: `Program code '${dto.code}' already exists in this department.`,
        });
      }
    }

    const updated = await this.programRepo.update(id, {
      name: dto.name ? dto.name.trim() : prog.name,
      code: dto.code ? dto.code.toUpperCase().trim() : prog.code,
      durationYears: dto.durationYears ?? prog.durationYears,
    });

    const instId = prog.institutionId.toString();
    await this.notifyAcademicChanged(instId, actorId, 'PROGRAM_UPDATED', {
      id,
    });
    return {
      id,
      institutionId: instId,
      departmentId: prog.departmentId.toString(),
      name: updated?.name || prog.name,
      code: updated?.code || prog.code,
      durationYears: updated?.durationYears || prog.durationYears,
    };
  }

  async deleteProgram(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const prog = await this.programRepo.findById(id);
    if (!prog || prog.isDeleted)
      throw new NotFoundException('Program not found.');

    // Dependency check: Cannot delete program if active academic years exist
    const activeYearsCount = await this.yearRepo.countActiveByProgram(id);
    this.dependencyChecker.assertNoActiveChildren(
      activeYearsCount,
      'AcademicYear',
      prog.name,
    );

    await this.programRepo.softDelete(id);
    await this.notifyAcademicChanged(
      prog.institutionId.toString(),
      actorId,
      'PROGRAM_DELETED',
      { id },
    );
    return { message: `Program '${prog.name}' deleted successfully.` };
  }

  // ==========================================
  // ACADEMIC YEARS
  // ==========================================
  async listAcademicYears(institutionId: string): Promise<AcademicYearDto[]> {
    const years = await this.yearRepo.findByInstitution(institutionId);
    return years.map((y) => ({
      id: this.toId(y),
      institutionId,
      programId: y.programId.toString(),
      yearNumber: y.yearNumber,
      label: y.label,
    }));
  }

  async createAcademicYear(
    institutionId: string,
    dto: CreateAcademicYearDto,
    actorId: string,
  ): Promise<AcademicYearDto> {
    const parentProg = await this.programRepo.findById(dto.programId);
    this.dependencyChecker.assertParentActive(
      parentProg,
      'Program',
      dto.programId,
    );

    const existing = await this.yearRepo.findByYearNumber(
      dto.programId,
      dto.yearNumber,
    );
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NAME',
        message: `Academic Year ${dto.yearNumber} already exists in this program.`,
      });
    }

    const created = await this.yearRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      programId: new Types.ObjectId(dto.programId),
      yearNumber: dto.yearNumber,
      label: dto.label.trim(),
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'ACADEMIC_YEAR_CREATED',
      {
        academicYearId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      programId: dto.programId,
      yearNumber: created.yearNumber,
      label: created.label,
    };
  }

  async updateAcademicYear(
    id: string,
    dto: UpdateAcademicYearDto,
    actorId: string,
  ): Promise<AcademicYearDto> {
    const year = await this.yearRepo.findById(id);
    if (!year || year.isDeleted)
      throw new NotFoundException('Academic Year not found.');

    const updated = await this.yearRepo.update(id, {
      yearNumber: dto.yearNumber ?? year.yearNumber,
      label: dto.label ? dto.label.trim() : year.label,
    });

    const instId = year.institutionId.toString();
    await this.notifyAcademicChanged(instId, actorId, 'ACADEMIC_YEAR_UPDATED', {
      id,
    });
    return {
      id,
      institutionId: instId,
      programId: year.programId.toString(),
      yearNumber: updated?.yearNumber || year.yearNumber,
      label: updated?.label || year.label,
    };
  }

  async deleteAcademicYear(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const year = await this.yearRepo.findById(id);
    if (!year || year.isDeleted)
      throw new NotFoundException('Academic Year not found.');

    // Dependency check: Cannot delete academic year if active semesters exist
    const activeSemestersCount =
      await this.semesterRepo.countActiveByAcademicYear(id);
    this.dependencyChecker.assertNoActiveChildren(
      activeSemestersCount,
      'Semester',
      year.label,
    );

    await this.yearRepo.softDelete(id);
    await this.notifyAcademicChanged(
      year.institutionId.toString(),
      actorId,
      'ACADEMIC_YEAR_DELETED',
      { id },
    );
    return { message: `Academic Year '${year.label}' deleted successfully.` };
  }

  // ==========================================
  // SEMESTERS
  // ==========================================
  async listSemesters(institutionId: string): Promise<SemesterDto[]> {
    const sems = await this.semesterRepo.findByInstitution(institutionId);
    return sems.map((s) => ({
      id: this.toId(s),
      institutionId,
      programId: s.programId.toString(),
      academicYearId: s.academicYearId.toString(),
      name: s.name,
      number: s.number,
      startDate: s.startDate,
      endDate: s.endDate,
      academicYearLabel: s.academicYearLabel,
      active: s.active,
    }));
  }

  async createSemester(
    institutionId: string,
    dto: CreateSemesterDto,
    actorId: string,
  ): Promise<SemesterDto> {
    const parentYear = await this.yearRepo.findById(dto.academicYearId);
    this.dependencyChecker.assertParentActive(
      parentYear,
      'AcademicYear',
      dto.academicYearId,
    );

    const existing = await this.semesterRepo.findByNumber(
      dto.academicYearId,
      dto.number,
    );
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NAME',
        message: `Semester number ${dto.number} already exists in this academic year.`,
      });
    }

    const created = await this.semesterRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      programId: parentYear.programId,
      academicYearId: new Types.ObjectId(dto.academicYearId),
      name: dto.name.trim(),
      number: dto.number,
      startDate: dto.startDate,
      endDate: dto.endDate,
      academicYearLabel: dto.academicYearLabel || parentYear.label,
      active: dto.active ?? true,
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'SEMESTER_CREATED',
      {
        semesterId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      programId: parentYear.programId.toString(),
      academicYearId: dto.academicYearId,
      name: created.name,
      number: created.number,
      startDate: created.startDate,
      endDate: created.endDate,
      academicYearLabel: created.academicYearLabel,
      active: created.active,
    };
  }

  async updateSemester(
    id: string,
    dto: UpdateSemesterDto,
    actorId: string,
  ): Promise<SemesterDto> {
    const sem = await this.semesterRepo.findById(id);
    if (!sem || sem.isDeleted)
      throw new NotFoundException('Semester not found.');

    const updated = await this.semesterRepo.update(id, {
      name: dto.name ? dto.name.trim() : sem.name,
      number: dto.number ?? sem.number,
      startDate: dto.startDate ?? sem.startDate,
      endDate: dto.endDate ?? sem.endDate,
      academicYearLabel: dto.academicYearLabel ?? sem.academicYearLabel,
      active: dto.active ?? sem.active,
    });

    const instId = sem.institutionId.toString();
    await this.notifyAcademicChanged(instId, actorId, 'SEMESTER_UPDATED', {
      id,
    });
    return {
      id,
      institutionId: instId,
      programId: sem.programId.toString(),
      academicYearId: sem.academicYearId.toString(),
      name: updated?.name || sem.name,
      number: updated?.number || sem.number,
      startDate: updated?.startDate || sem.startDate,
      endDate: updated?.endDate || sem.endDate,
      academicYearLabel: updated?.academicYearLabel || sem.academicYearLabel,
      active: updated?.active ?? sem.active,
    };
  }

  async deleteSemester(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const sem = await this.semesterRepo.findById(id);
    if (!sem || sem.isDeleted)
      throw new NotFoundException('Semester not found.');

    // Dependency check: Cannot delete semester if active sections exist
    const activeSectionsCount =
      await this.sectionRepo.countActiveBySemester(id);
    this.dependencyChecker.assertNoActiveChildren(
      activeSectionsCount,
      'Section',
      sem.name,
    );

    await this.semesterRepo.softDelete(id);
    await this.notifyAcademicChanged(
      sem.institutionId.toString(),
      actorId,
      'SEMESTER_DELETED',
      { id },
    );
    return { message: `Semester '${sem.name}' deleted successfully.` };
  }

  // ==========================================
  // SECTIONS & BATCHES
  // ==========================================
  async listSections(institutionId: string): Promise<SectionDto[]> {
    const secs = await this.sectionRepo.findByInstitution(institutionId);
    return secs.map((s) => ({
      id: this.toId(s),
      institutionId,
      semesterId: s.semesterId.toString(),
      academicYearId: s.academicYearId.toString(),
      name: s.name,
      strength: s.strength,
      batches: s.batches || [],
    }));
  }

  async createSection(
    institutionId: string,
    dto: CreateSectionDto,
    actorId: string,
  ): Promise<SectionDto> {
    const parentSem = await this.semesterRepo.findById(dto.semesterId);
    this.dependencyChecker.assertParentActive(
      parentSem,
      'Semester',
      dto.semesterId,
    );

    const existing = await this.sectionRepo.findByName(
      dto.semesterId,
      dto.name,
    );
    if (existing) {
      throw new BadRequestException({
        code: 'DUPLICATE_NAME',
        message: `Section '${dto.name}' already exists in this semester.`,
      });
    }

    if (dto.batches && dto.batches.length > 0) {
      this.dependencyChecker.assertBatchCapacities(dto.batches, dto.strength);
    }

    const created = await this.sectionRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      semesterId: new Types.ObjectId(dto.semesterId),
      academicYearId: parentSem.academicYearId,
      name: dto.name.trim(),
      strength: dto.strength,
      batches: dto.batches || [],
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'SECTION_CREATED',
      {
        sectionId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      semesterId: dto.semesterId,
      academicYearId: parentSem.academicYearId.toString(),
      name: created.name,
      strength: created.strength,
      batches: created.batches || [],
    };
  }

  async updateSection(
    id: string,
    dto: UpdateSectionDto,
    actorId: string,
  ): Promise<SectionDto> {
    const sec = await this.sectionRepo.findById(id);
    if (!sec || sec.isDeleted)
      throw new NotFoundException('Section not found.');

    const newStrength = dto.strength ?? sec.strength;
    const newBatches = dto.batches ?? sec.batches;

    if (newBatches && newBatches.length > 0) {
      this.dependencyChecker.assertBatchCapacities(newBatches, newStrength);
    }

    const updated = await this.sectionRepo.update(id, {
      name: dto.name ? dto.name.trim() : sec.name,
      strength: newStrength,
      batches: newBatches,
    });

    const instId = sec.institutionId.toString();
    await this.notifyAcademicChanged(instId, actorId, 'SECTION_UPDATED', {
      id,
    });
    return {
      id,
      institutionId: instId,
      semesterId: sec.semesterId.toString(),
      academicYearId: sec.academicYearId.toString(),
      name: updated?.name || sec.name,
      strength: updated?.strength || sec.strength,
      batches: updated?.batches || sec.batches,
    };
  }

  async deleteSection(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const sec = await this.sectionRepo.findById(id);
    if (!sec || sec.isDeleted)
      throw new NotFoundException('Section not found.');

    await this.sectionRepo.softDelete(id);
    await this.notifyAcademicChanged(
      sec.institutionId.toString(),
      actorId,
      'SECTION_DELETED',
      { id },
    );
    return { message: `Section '${sec.name}' deleted successfully.` };
  }

  // ==========================================
  // HOLIDAYS
  // ==========================================
  async listHolidays(institutionId: string): Promise<HolidayDto[]> {
    const hols = await this.holidayRepo.findByInstitution(institutionId);
    return hols.map((h) => ({
      id: this.toId(h),
      institutionId,
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
      type: h.type,
    }));
  }

  async createHoliday(
    institutionId: string,
    dto: CreateHolidayDto,
    actorId: string,
  ): Promise<HolidayDto> {
    const created = await this.holidayRepo.create({
      institutionId: new Types.ObjectId(institutionId),
      name: dto.name.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      type: dto.type,
      isDeleted: false,
    });

    await this.notifyAcademicChanged(
      institutionId,
      actorId,
      'HOLIDAY_CREATED',
      {
        holidayId: this.toId(created),
      },
    );

    return {
      id: this.toId(created),
      institutionId,
      name: created.name,
      startDate: created.startDate,
      endDate: created.endDate,
      type: created.type,
    };
  }

  async deleteHoliday(
    id: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const hol = await this.holidayRepo.findById(id);
    if (!hol || hol.isDeleted)
      throw new NotFoundException('Holiday not found.');

    await this.holidayRepo.softDelete(id);
    await this.notifyAcademicChanged(
      hol.institutionId.toString(),
      actorId,
      'HOLIDAY_DELETED',
      { id },
    );
    return { message: `Holiday '${hol.name}' deleted successfully.` };
  }
}
