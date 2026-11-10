// HTTP controller handling library.controller endpoints.
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import {
  CreateFacultyDtoSchema,
  UpdateFacultyDtoSchema,
  CreateSubjectDtoSchema,
  UpdateSubjectDtoSchema,
  CreateElectiveGroupDtoSchema,
  UpdateElectiveGroupDtoSchema,
  CreateRoomDtoSchema,
  UpdateRoomDtoSchema,
  RoomMatchRequestSchema,
  FacultyQualificationRequestSchema,
  type CreateFacultyDto,
  type UpdateFacultyDto,
  type CreateSubjectDto,
  type UpdateSubjectDto,
  type CreateElectiveGroupDto,
  type UpdateElectiveGroupDto,
  type CreateRoomDto,
  type UpdateRoomDto,
  type FacultyDto,
  type SubjectDto,
  type ElectiveGroupDto,
  type RoomDto,
  type RoomMatchRequest,
  type RoomMatchResult,
  type FacultyQualificationRequest,
  type FacultyQualificationResult,
  type FacultyWorkloadDto,
  type ImportEntity,
  type ImportValidationReport,
} from '@slotly/contracts';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { LibraryService } from '../services/library.service';
import { INSTITUTION_REPOSITORY } from '../../institutions/repositories/institution.repository';
import type { InstitutionRepository } from '../../institutions/repositories/institution.repository';
import { Optional, Inject } from '@nestjs/common';

/** Controller handling library controller HTTP endpoints. */
@Controller('library')
@UseGuards(AuthGuard, PermissionsGuard)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    @Optional()
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo?: InstitutionRepository,
  ) {}

  private async resolveInstitutionId(
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    queryInstId?: string,
  ): Promise<string> {
    let id = queryInstId || req.user.institutionId;
    if (!id && this.institutionRepo) {
      const inst = await this.institutionRepo.findOne({ isDeleted: false });
      if (inst) {
        id = (
          inst.id || (inst as unknown as { _id?: { toString(): string } })._id
        )?.toString();
        if (id) {
          req.user.institutionId = id;
        }
      }
    }
    if (!id) {
      throw new BadRequestException(
        'Institution context is required. Please provide institutionId.',
      );
    }
    return id;
  }

  // ==========================================
  // FACULTY ENDPOINTS
  // ==========================================
  @Get('faculty')
  @RequirePermissions('FACULTY_READ')
  async getFacultyList(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('archived') archivedStr?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<{ items: FacultyDto[]; total: number }> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const archived =
      archivedStr === 'true'
        ? true
        : archivedStr === 'false'
          ? false
          : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const options: {
      departmentId?: string;
      archived?: boolean;
      search?: string;
      page: number;
      limit: number;
    } = { page, limit };
    if (departmentId) options.departmentId = departmentId;
    if (typeof archived === 'boolean') options.archived = archived;
    if (search) options.search = search;

    const res = await this.libraryService.getFacultyList(
      institutionId,
      options,
    );
    return {
      items: res.items.map((f) => ({
        ...f,
        id: f.id ?? (f._id as string)?.toString() ?? '',
      })),
      total: res.total,
    };
  }

  @Get('faculty/:id')
  @RequirePermissions('FACULTY_READ')
  async getFacultyById(@Param('id') id: string): Promise<FacultyDto> {
    const f = await this.libraryService.getFacultyById(id);
    return {
      ...f,
      id: f.id ?? (f._id as string)?.toString() ?? '',
    };
  }

  @Post('faculty')
  @RequirePermissions('FACULTY_MANAGE')
  async createFaculty(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateFacultyDtoSchema)) dto: CreateFacultyDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<FacultyDto> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const f = await this.libraryService.createFaculty(
      institutionId,
      dto,
      req.user.id,
    );
    return {
      ...f,
      id: f.id ?? (f._id as string)?.toString() ?? '',
    };
  }

  @Patch('faculty/:id')
  @RequirePermissions('FACULTY_MANAGE')
  async updateFaculty(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFacultyDtoSchema)) dto: UpdateFacultyDto,
  ): Promise<FacultyDto> {
    const f = await this.libraryService.updateFaculty(id, dto, req.user.id);
    return {
      ...f,
      id: f.id ?? (f._id as string)?.toString() ?? '',
    };
  }

  @Patch('faculty/:id/archive')
  @RequirePermissions('FACULTY_MANAGE')
  async archiveFaculty(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body('archived') archived: boolean,
  ): Promise<FacultyDto> {
    const f = await this.libraryService.archiveFaculty(
      id,
      archived,
      req.user.id,
    );
    return {
      ...f,
      id: f.id ?? (f._id as string)?.toString() ?? '',
    };
  }

  @Delete('faculty/:id')
  @RequirePermissions('FACULTY_MANAGE')
  async deleteFaculty(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const ok = await this.libraryService.deleteFaculty(id, req.user.id);
    return { success: ok };
  }

  @Get('faculty/:id/workload')
  @RequirePermissions('FACULTY_READ')
  async getFacultyWorkload(
    @Param('id') id: string,
  ): Promise<FacultyWorkloadDto> {
    return this.libraryService.getFacultyWorkload(id);
  }

  // ==========================================
  // SUBJECT ENDPOINTS
  // ==========================================
  @Get('subjects')
  @RequirePermissions('SUBJECT_READ')
  async getSubjectList(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('type') type?: string,
    @Query('archived') archivedStr?: string,
    @Query('isElective') isElectiveStr?: string,
    @Query('electiveGroupId') electiveGroupId?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<{ items: SubjectDto[]; total: number }> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const archived =
      archivedStr === 'true'
        ? true
        : archivedStr === 'false'
          ? false
          : undefined;
    const isElective =
      isElectiveStr === 'true'
        ? true
        : isElectiveStr === 'false'
          ? false
          : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const options: {
      departmentId?: string;
      type?: string;
      archived?: boolean;
      isElective?: boolean;
      electiveGroupId?: string;
      search?: string;
      page: number;
      limit: number;
    } = { page, limit };
    if (departmentId) options.departmentId = departmentId;
    if (type) options.type = type;
    if (typeof archived === 'boolean') options.archived = archived;
    if (typeof isElective === 'boolean') options.isElective = isElective;
    if (electiveGroupId) options.electiveGroupId = electiveGroupId;
    if (search) options.search = search;

    const res = await this.libraryService.getSubjectList(
      institutionId,
      options,
    );
    return {
      items: res.items.map((s) => ({
        ...s,
        id: s.id ?? (s._id as string)?.toString() ?? '',
      })),
      total: res.total,
    };
  }

  @Get('subjects/:id')
  @RequirePermissions('SUBJECT_READ')
  async getSubjectById(@Param('id') id: string): Promise<SubjectDto> {
    const s = await this.libraryService.getSubjectById(id);
    return {
      ...s,
      id: s.id ?? (s._id as string)?.toString() ?? '',
    };
  }

  @Post('subjects')
  @RequirePermissions('SUBJECT_MANAGE')
  async createSubject(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateSubjectDtoSchema)) dto: CreateSubjectDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<SubjectDto> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const s = await this.libraryService.createSubject(
      institutionId,
      dto,
      req.user.id,
    );
    return {
      ...s,
      id: s.id ?? (s._id as string)?.toString() ?? '',
    };
  }

  @Patch('subjects/:id')
  @RequirePermissions('SUBJECT_MANAGE')
  async updateSubject(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSubjectDtoSchema)) dto: UpdateSubjectDto,
  ): Promise<SubjectDto> {
    const s = await this.libraryService.updateSubject(id, dto, req.user.id);
    return {
      ...s,
      id: s.id ?? (s._id as string)?.toString() ?? '',
    };
  }

  @Patch('subjects/:id/archive')
  @RequirePermissions('SUBJECT_MANAGE')
  async archiveSubject(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body('archived') archived: boolean,
  ): Promise<SubjectDto> {
    const s = await this.libraryService.archiveSubject(
      id,
      archived,
      req.user.id,
    );
    return {
      ...s,
      id: s.id ?? (s._id as string)?.toString() ?? '',
    };
  }

  @Delete('subjects/:id')
  @RequirePermissions('SUBJECT_MANAGE')
  async deleteSubject(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const ok = await this.libraryService.deleteSubject(id, req.user.id);
    return { success: ok };
  }

  // ==========================================
  // ELECTIVE GROUPS ENDPOINTS
  // ==========================================
  @Get('elective-groups')
  @RequirePermissions('SUBJECT_READ')
  async getElectiveGroups(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
  ): Promise<ElectiveGroupDto[]> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const groups = await this.libraryService.getElectiveGroups(institutionId);
    return groups.map((g) => ({
      ...g,
      id: g.id ?? (g._id as string)?.toString() ?? '',
    }));
  }

  @Post('elective-groups')
  @RequirePermissions('SUBJECT_MANAGE')
  async createElectiveGroup(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateElectiveGroupDtoSchema))
    dto: CreateElectiveGroupDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<ElectiveGroupDto> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const eg = await this.libraryService.createElectiveGroup(
      institutionId,
      dto,
      req.user.id,
    );
    return {
      ...eg,
      id: eg.id ?? (eg._id as string)?.toString() ?? '',
    };
  }

  @Patch('elective-groups/:id')
  @RequirePermissions('SUBJECT_MANAGE')
  async updateElectiveGroup(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateElectiveGroupDtoSchema))
    dto: UpdateElectiveGroupDto,
  ): Promise<ElectiveGroupDto> {
    const eg = await this.libraryService.updateElectiveGroup(
      id,
      dto,
      req.user.id,
    );
    return {
      ...eg,
      id: eg.id ?? (eg._id as string)?.toString() ?? '',
    };
  }

  @Delete('elective-groups/:id')
  @RequirePermissions('SUBJECT_MANAGE')
  async deleteElectiveGroup(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const ok = await this.libraryService.deleteElectiveGroup(id, req.user.id);
    return { success: ok };
  }

  // ==========================================
  // ROOM ENDPOINTS
  // ==========================================
  @Get('rooms')
  @RequirePermissions('ROOM_READ')
  async getRoomList(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Query('institutionId') queryInstId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('type') type?: string,
    @Query('building') building?: string,
    @Query('minCapacity') minCapacityStr?: string,
    @Query('archived') archivedStr?: string,
    @Query('search') search?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<{ items: RoomDto[]; total: number }> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const minCapacity = minCapacityStr
      ? parseInt(minCapacityStr, 10)
      : undefined;
    const archived =
      archivedStr === 'true'
        ? true
        : archivedStr === 'false'
          ? false
          : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const options: {
      departmentId?: string;
      type?: string;
      building?: string;
      minCapacity?: number;
      archived?: boolean;
      search?: string;
      page: number;
      limit: number;
    } = { page, limit };
    if (departmentId) options.departmentId = departmentId;
    if (type) options.type = type;
    if (building) options.building = building;
    if (minCapacity !== undefined) options.minCapacity = minCapacity;
    if (typeof archived === 'boolean') options.archived = archived;
    if (search) options.search = search;

    const res = await this.libraryService.getRoomList(institutionId, options);
    return {
      items: res.items.map((r) => ({
        ...r,
        id: r.id ?? (r._id as string)?.toString() ?? '',
      })),
      total: res.total,
    };
  }

  @Get('rooms/:id')
  @RequirePermissions('ROOM_READ')
  async getRoomById(@Param('id') id: string): Promise<RoomDto> {
    const r = await this.libraryService.getRoomById(id);
    return {
      ...r,
      id: r.id ?? (r._id as string)?.toString() ?? '',
    };
  }

  @Post('rooms')
  @RequirePermissions('ROOM_MANAGE')
  async createRoom(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(CreateRoomDtoSchema)) dto: CreateRoomDto,
    @Query('institutionId') queryInstId?: string,
  ): Promise<RoomDto> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const r = await this.libraryService.createRoom(
      institutionId,
      dto,
      req.user.id,
    );
    return {
      ...r,
      id: r.id ?? (r._id as string)?.toString() ?? '',
    };
  }

  @Patch('rooms/:id')
  @RequirePermissions('ROOM_MANAGE')
  async updateRoom(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRoomDtoSchema)) dto: UpdateRoomDto,
  ): Promise<RoomDto> {
    const r = await this.libraryService.updateRoom(id, dto, req.user.id);
    return {
      ...r,
      id: r.id ?? (r._id as string)?.toString() ?? '',
    };
  }

  @Patch('rooms/:id/archive')
  @RequirePermissions('ROOM_MANAGE')
  async archiveRoom(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
    @Body('archived') archived: boolean,
  ): Promise<RoomDto> {
    const r = await this.libraryService.archiveRoom(id, archived, req.user.id);
    return {
      ...r,
      id: r.id ?? (r._id as string)?.toString() ?? '',
    };
  }

  @Delete('rooms/:id')
  @RequirePermissions('ROOM_MANAGE')
  async deleteRoom(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const ok = await this.libraryService.deleteRoom(id, req.user.id);
    return { success: ok };
  }

  // ==========================================
  // MATCHING & QUALIFIERS
  // ==========================================
  @Post('match/rooms')
  @RequirePermissions('ROOM_READ')
  async matchRooms(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(RoomMatchRequestSchema))
    matchReq: RoomMatchRequest,
    @Query('institutionId') queryInstId?: string,
  ): Promise<RoomMatchResult[]> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    return this.libraryService.matchRooms(institutionId, matchReq);
  }

  @Post('match/faculty')
  @RequirePermissions('FACULTY_READ')
  async qualifyFaculty(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Body(new ZodValidationPipe(FacultyQualificationRequestSchema))
    qualReq: FacultyQualificationRequest,
    @Query('institutionId') queryInstId?: string,
  ): Promise<FacultyQualificationResult[]> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    return this.libraryService.qualifyFaculty(institutionId, qualReq);
  }

  // ==========================================
  // IMPORT & EXPORT
  // ==========================================
  @Post('import/:entity/preview')
  @RequirePermissions('STRUCTURE_MANAGE')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Param('entity') entity: ImportEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body('data') dataBody?: string,
  ): Promise<ImportValidationReport> {
    let buffer: Buffer;
    let filename = 'data.csv';

    if (file) {
      buffer = file.buffer;
      filename = file.originalname;
    } else if (dataBody) {
      buffer = Buffer.from(dataBody, 'utf-8');
      filename = 'data.json';
    } else {
      throw new BadRequestException('Please provide a file or data to import');
    }

    return this.libraryService.validateImportFile(entity, buffer, filename);
  }

  @Post('import/:entity')
  @RequirePermissions('STRUCTURE_MANAGE')
  async executeImport(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('entity') entity: ImportEntity,
    @Body('rows') rows: Record<string, unknown>[],
    @Query('institutionId') queryInstId?: string,
  ): Promise<{ inserted: number; errors: number }> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    if (!rows || !Array.isArray(rows)) {
      throw new BadRequestException(
        'Valid array of rows is required for import',
      );
    }
    return this.libraryService.executeImport(
      institutionId,
      entity,
      rows,
      req.user.id,
    );
  }

  @Get('export/:entity')
  @RequirePermissions('TIMETABLE_EXPORT')
  async exportLibrary(
    @Req()
    req: Request & {
      user: RequestUser & { institutionId?: string | undefined };
    },
    @Param('entity') entity: ImportEntity,
    @Query('format') formatStr: string,
    @Query('institutionId') queryInstId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const institutionId = await this.resolveInstitutionId(req, queryInstId);
    const format = formatStr === 'csv' ? 'csv' : 'xlsx';
    const { buffer, filename, mimeType } =
      await this.libraryService.exportLibrary(institutionId, entity, format);

    if (res) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(buffer);
    }
  }

  @Get(':type/:id/usage')
  @RequirePermissions('FACULTY_READ')
  async getItemUsage(@Param('type') type: string, @Param('id') id: string) {
    return this.libraryService.getItemUsage(type, id);
  }
}
