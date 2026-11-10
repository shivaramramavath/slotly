// HTTP controller handling institutions.controller endpoints.
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Inject,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { INSTITUTION_REPOSITORY } from '../repositories/institution.repository';
import type { InstitutionRepository } from '../repositories/institution.repository';
import { SESSIONS_SERVICE } from '../../auth/services/sessions.service';
import type { SessionsService } from '../../auth/services/sessions.service';
import { USER_REPOSITORY } from '../../users/repositories/user.repository';
import type { UserRepository } from '../../users/repositories/user.repository';
import {
  CreateDepartmentDtoSchema,
  UpdateDepartmentDtoSchema,
  CreateProgramDtoSchema,
  UpdateProgramDtoSchema,
  CreateAcademicYearDtoSchema,
  UpdateAcademicYearDtoSchema,
  CreateSemesterDtoSchema,
  UpdateSemesterDtoSchema,
  CreateSectionDtoSchema,
  UpdateSectionDtoSchema,
  CreateHolidayDtoSchema,
  CreateInstitutionDtoSchema,
  UpdateInstitutionDtoSchema,
} from '@slotly/contracts';
import type {
  CreateInstitutionDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateProgramDto,
  UpdateProgramDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  CreateSemesterDto,
  UpdateSemesterDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateHolidayDto,
  UpdateInstitutionDto,
  InstitutionDto,
  InstitutionStructureDto,
  DepartmentDto,
  ProgramDto,
  AcademicYearDto,
  SemesterDto,
  SectionDto,
  HolidayDto,
} from '@slotly/contracts';
import { INSTITUTIONS_SERVICE } from '../services/institutions.service';
import type { InstitutionsService } from '../services/institutions.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/** Controller handling institutions controller HTTP endpoints. */
@Controller('institution')
@UseGuards(AuthGuard, PermissionsGuard)
export class InstitutionsController {
  constructor(
    @Inject(INSTITUTIONS_SERVICE)
    private readonly institutionsService: InstitutionsService,
    @Optional()
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo?: InstitutionRepository,
    @Optional()
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService?: SessionsService,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly userRepo?: UserRepository,
  ) {}

  private async resolveInstitutionId(
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    overrideId?: string,
  ): Promise<string> {
    let id = overrideId || req.user.institutionId;
    if (!id && this.institutionRepo) {
      let inst = await this.institutionRepo.findOne({ isDeleted: false });
      if (!inst) {
        inst = await this.institutionRepo.create({
          name: 'Main Campus',
          code: 'MAIN',
          workingDays: [1, 2, 3, 4, 5],
          defaultPeriodConfig: {
            startTime: '09:00',
            periodDuration: 50,
            periodsPerDay: 7,
            breaks: [
              { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
            ],
          },
          isComplete: true,
          isDeleted: false,
        });
      }
      if (inst) {
        id = (
          inst.id || (inst as unknown as { _id?: { toString(): string } })._id
        )?.toString();
      }
    }
    if (!id) {
      throw new BadRequestException(
        'Institution context is required. Please provide institutionId.',
      );
    }
    if (!req.user.institutionId && id) {
      req.user.institutionId = id;
      if (this.sessionsService && req.user.sessionId) {
        await this.sessionsService.updateSessionInstitution(
          req.user.sessionId,
          id,
        );
      }
      if (this.userRepo && req.user.id) {
        await this.userRepo.update(req.user.id, {
          institutionId: new Types.ObjectId(id),
        });
      }
    }
    return id;
  }

  // ==========================================
  // STRUCTURE (CACHED FULL TREE)
  // ==========================================
  @Get('structure')
  @RequirePermissions('INSTITUTION_READ')
  async getStructure(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<InstitutionStructureDto> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.getStructure(instId);
  }

  // ==========================================
  // INSTITUTION PROFILE
  // ==========================================
  @Post()
  @RequirePermissions('INSTITUTION_MANAGE')
  async createInstitution(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateInstitutionDtoSchema))
    dto: CreateInstitutionDto,
  ): Promise<InstitutionDto> {
    const result = await this.institutionsService.createInstitution(
      dto,
      req.user.id,
    );
    if (!req.user.institutionId && result.id) {
      req.user.institutionId = result.id;
      if (this.sessionsService && req.user.sessionId) {
        await this.sessionsService.updateSessionInstitution(
          req.user.sessionId,
          result.id,
        );
      }
      if (this.userRepo && req.user.id) {
        await this.userRepo.update(req.user.id, {
          institutionId: new Types.ObjectId(result.id),
        });
      }
    }
    return result;
  }

  @Get()
  @RequirePermissions('INSTITUTION_READ')
  async getInstitution(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<InstitutionDto> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.getInstitution(instId);
  }

  @Put()
  @RequirePermissions('INSTITUTION_MANAGE')
  async updateInstitution(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(UpdateInstitutionDtoSchema))
    dto: UpdateInstitutionDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<InstitutionDto> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.updateInstitution(instId, dto, req.user.id);
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  @Get('departments')
  @RequirePermissions('DEPARTMENT_READ')
  async listDepartments(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<DepartmentDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listDepartments(instId);
  }

  @Post('departments')
  @RequirePermissions('DEPARTMENT_MANAGE')
  async createDepartment(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateDepartmentDtoSchema))
    dto: CreateDepartmentDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<DepartmentDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createDepartment(instId, dto, req.user.id);
  }

  @Put('departments/:id')
  @RequirePermissions('DEPARTMENT_MANAGE')
  async updateDepartment(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDepartmentDtoSchema))
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    return this.institutionsService.updateDepartment(id, dto, req.user.id);
  }

  @Delete('departments/:id')
  @RequirePermissions('DEPARTMENT_MANAGE')
  async deleteDepartment(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteDepartment(id, req.user.id);
  }

  // ==========================================
  // PROGRAMS
  // ==========================================
  @Get('programs')
  @RequirePermissions('STRUCTURE_READ')
  async listPrograms(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<ProgramDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listPrograms(instId);
  }

  @Post('programs')
  @RequirePermissions('STRUCTURE_MANAGE')
  async createProgram(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateProgramDtoSchema))
    dto: CreateProgramDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<ProgramDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createProgram(instId, dto, req.user.id);
  }

  @Put('programs/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async updateProgram(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProgramDtoSchema))
    dto: UpdateProgramDto,
  ): Promise<ProgramDto> {
    return this.institutionsService.updateProgram(id, dto, req.user.id);
  }

  @Delete('programs/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async deleteProgram(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteProgram(id, req.user.id);
  }

  // ==========================================
  // ACADEMIC YEARS
  // ==========================================
  @Get('academic-years')
  @RequirePermissions('STRUCTURE_READ')
  async listAcademicYears(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<AcademicYearDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listAcademicYears(instId);
  }

  @Post('academic-years')
  @RequirePermissions('STRUCTURE_MANAGE')
  async createAcademicYear(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateAcademicYearDtoSchema))
    dto: CreateAcademicYearDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<AcademicYearDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createAcademicYear(
      instId,
      dto,
      req.user.id,
    );
  }

  @Put('academic-years/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async updateAcademicYear(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAcademicYearDtoSchema))
    dto: UpdateAcademicYearDto,
  ): Promise<AcademicYearDto> {
    return this.institutionsService.updateAcademicYear(id, dto, req.user.id);
  }

  @Delete('academic-years/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async deleteAcademicYear(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteAcademicYear(id, req.user.id);
  }

  // ==========================================
  // SEMESTERS
  // ==========================================
  @Get('semesters')
  @RequirePermissions('STRUCTURE_READ')
  async listSemesters(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<SemesterDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listSemesters(instId);
  }

  @Post('semesters')
  @RequirePermissions('STRUCTURE_MANAGE')
  async createSemester(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateSemesterDtoSchema))
    dto: CreateSemesterDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<SemesterDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createSemester(instId, dto, req.user.id);
  }

  @Put('semesters/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async updateSemester(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSemesterDtoSchema))
    dto: UpdateSemesterDto,
  ): Promise<SemesterDto> {
    return this.institutionsService.updateSemester(id, dto, req.user.id);
  }

  @Delete('semesters/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async deleteSemester(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteSemester(id, req.user.id);
  }

  // ==========================================
  // SECTIONS & BATCHES
  // ==========================================
  @Get('sections')
  @RequirePermissions('STRUCTURE_READ')
  async listSections(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<SectionDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listSections(instId);
  }

  @Post('sections')
  @RequirePermissions('STRUCTURE_MANAGE')
  async createSection(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateSectionDtoSchema))
    dto: CreateSectionDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<SectionDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createSection(instId, dto, req.user.id);
  }

  @Put('sections/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async updateSection(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSectionDtoSchema))
    dto: UpdateSectionDto,
  ): Promise<SectionDto> {
    return this.institutionsService.updateSection(id, dto, req.user.id);
  }

  @Delete('sections/:id')
  @RequirePermissions('STRUCTURE_MANAGE')
  async deleteSection(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteSection(id, req.user.id);
  }

  // ==========================================
  // HOLIDAYS
  // ==========================================
  @Get('holidays')
  @RequirePermissions('INSTITUTION_READ')
  async listHolidays(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<HolidayDto[]> {
    const instId = await this.resolveInstitutionId(req, queryInstId);
    return this.institutionsService.listHolidays(instId);
  }

  @Post('holidays')
  @RequirePermissions('INSTITUTION_MANAGE')
  async createHoliday(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateHolidayDtoSchema))
    dto: CreateHolidayDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<HolidayDto> {
    const instId = await this.resolveInstitutionId(
      req,
      dto.institutionId || queryInstId,
    );
    return this.institutionsService.createHoliday(instId, dto, req.user.id);
  }

  @Delete('holidays/:id')
  @RequirePermissions('INSTITUTION_MANAGE')
  async deleteHoliday(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.institutionsService.deleteHoliday(id, req.user.id);
  }
}
