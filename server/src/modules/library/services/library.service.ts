// Domain service orchestrating library.service business logic.
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type {
  CreateFacultyDto,
  UpdateFacultyDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateElectiveGroupDto,
  UpdateElectiveGroupDto,
  CreateRoomDto,
  UpdateRoomDto,
  RoomMatchRequest,
  RoomMatchResult,
  FacultyQualificationRequest,
  FacultyQualificationResult,
  FacultyWorkloadDto,
  ImportEntity,
  ImportValidationReport,
} from '@slotly/contracts';
import { normalizeAvailabilityMatrix } from '@slotly/contracts';
import { EventBus } from '../../../common/events/event-bus.service';
import { AuditService } from '../../../common/audit/audit.service';
import { FACULTY_REPOSITORY } from '../repositories/faculty.repository';
import type { FacultyRepository } from '../repositories/faculty.repository';
import { SUBJECT_REPOSITORY } from '../repositories/subject.repository';
import type { SubjectRepository } from '../repositories/subject.repository';
import { ELECTIVE_GROUP_REPOSITORY } from '../repositories/elective-group.repository';
import type { ElectiveGroupRepository } from '../repositories/elective-group.repository';
import { ROOM_REPOSITORY } from '../repositories/room.repository';
import type { RoomRepository } from '../repositories/room.repository';
import { ROOM_MATCHER } from '../strategies/room-matcher.strategy';
import type { IRoomMatcher } from '../strategies/room-matcher.strategy';
import { FACULTY_QUALIFIER } from '../strategies/faculty-qualifier.strategy';
import type { IFacultyQualifier } from '../strategies/faculty-qualifier.strategy';
import { FacultyWorkloadService } from './faculty-workload.service';
import { LibraryImportService } from './library-import.service';
import { Faculty } from '../schemas/faculty.schema';
import { Subject } from '../schemas/subject.schema';
import { Room } from '../schemas/room.schema';
import { ElectiveGroup } from '../schemas/elective-group.schema';

function strVal(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val.toString();
  return '';
}

function defaultAvailability(): boolean[][] {
  return normalizeAvailabilityMatrix(undefined);
}

function sanitizeUpdate<T>(dto: Record<string, unknown>): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dto)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result as unknown as Partial<T>;
}

/** Injectable service providing library service logic. */
@Injectable()
export class LibraryService {
  constructor(
    @Inject(FACULTY_REPOSITORY)
    private readonly facultyRepo: FacultyRepository,
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepo: SubjectRepository,
    @Inject(ELECTIVE_GROUP_REPOSITORY)
    private readonly electiveRepo: ElectiveGroupRepository,
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepo: RoomRepository,
    @Inject(ROOM_MATCHER)
    private readonly roomMatcher: IRoomMatcher,
    @Inject(FACULTY_QUALIFIER)
    private readonly facultyQualifier: IFacultyQualifier,
    private readonly workloadService: FacultyWorkloadService,
    private readonly importService: LibraryImportService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // FACULTY
  // ==========================================
  async getFacultyList(
    institutionId: string,
    options?: {
      departmentId?: string;
      archived?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: Faculty[]; total: number }> {
    return this.facultyRepo.findByInstitution(institutionId, options);
  }

  async getFacultyById(id: string): Promise<Faculty> {
    const f = await this.facultyRepo.findById(id);
    if (!f || f.isDeleted) throw new NotFoundException('Faculty not found');
    return f;
  }

  async createFaculty(
    institutionId: string,
    dto: CreateFacultyDto,
    actorId = 'system',
  ): Promise<Faculty> {
    const existing = await this.facultyRepo.findByCode(institutionId, dto.code);
    if (existing) {
      throw new BadRequestException(
        `Faculty with code '${dto.code}' already exists in this institution`,
      );
    }

    const created = await this.facultyRepo.create({
      ...dto,
      availability: normalizeAvailabilityMatrix(dto.availability),
      preferredPeriods: dto.preferredPeriods ?? [],
      unavailableSlots: dto.unavailableSlots ?? [],
      subjectIds: dto.subjectIds ?? [],
      institutionId,
      code: dto.code.toUpperCase().trim(),
      isDeleted: false,
    });

    await this.notifyLibraryChanged(
      institutionId,
      'faculty',
      'create',
      created.id,
    );
    await this.auditService.log(
      'FACULTY_CREATED',
      actorId,
      { type: 'faculty', id: created.id ?? '' },
      { code: dto.code, name: dto.name },
    );

    return created;
  }

  async updateFaculty(
    id: string,
    dto: UpdateFacultyDto,
    actorId = 'system',
  ): Promise<Faculty> {
    const f = await this.getFacultyById(id);
    if (dto.availability) {
      dto.availability = normalizeAvailabilityMatrix(dto.availability);
    }
    const updated = await this.facultyRepo.update(
      id,
      sanitizeUpdate<Faculty>(dto),
    );
    if (!updated) throw new NotFoundException('Faculty not found');

    await this.notifyLibraryChanged(f.institutionId, 'faculty', 'update', id);
    await this.auditService.log(
      'FACULTY_UPDATED',
      actorId,
      { type: 'faculty', id },
      { ...dto },
    );

    return updated;
  }

  async archiveFaculty(
    id: string,
    archived: boolean,
    actorId = 'system',
  ): Promise<Faculty> {
    const f = await this.getFacultyById(id);
    const updated = await this.facultyRepo.setArchived(id, archived);
    if (!updated) throw new NotFoundException('Faculty not found');

    await this.notifyLibraryChanged(f.institutionId, 'faculty', 'archive', id);
    await this.auditService.log(
      archived ? 'FACULTY_ARCHIVED' : 'FACULTY_UNARCHIVED',
      actorId,
      { type: 'faculty', id },
      { archived },
    );

    return updated;
  }

  async deleteFaculty(id: string, actorId = 'system'): Promise<boolean> {
    const f = await this.getFacultyById(id);
    const ok = await this.facultyRepo.softDelete(id);
    if (ok) {
      await this.notifyLibraryChanged(f.institutionId, 'faculty', 'delete', id);
      await this.auditService.log(
        'FACULTY_DELETED',
        actorId,
        { type: 'faculty', id },
        { code: f.code },
      );
    }
    return ok;
  }

  async getFacultyWorkload(id: string): Promise<FacultyWorkloadDto> {
    const f = await this.getFacultyById(id);
    const subjects = await this.subjectRepo.findByIds(f.subjectIds || []);
    return this.workloadService.computeWorkload(f, subjects);
  }

  // ==========================================
  // SUBJECTS
  // ==========================================
  async getSubjectList(
    institutionId: string,
    options?: {
      departmentId?: string;
      type?: string;
      archived?: boolean;
      search?: string;
      isElective?: boolean;
      electiveGroupId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: Subject[]; total: number }> {
    return this.subjectRepo.findByInstitution(institutionId, options);
  }

  async getSubjectById(id: string): Promise<Subject> {
    const s = await this.subjectRepo.findById(id);
    if (!s || s.isDeleted) throw new NotFoundException('Subject not found');
    return s;
  }

  async createSubject(
    institutionId: string,
    dto: CreateSubjectDto,
    actorId = 'system',
  ): Promise<Subject> {
    const existing = await this.subjectRepo.findByCode(institutionId, dto.code);
    if (existing) {
      throw new BadRequestException(
        `Subject with code '${dto.code}' already exists in this institution`,
      );
    }

    const created = await this.subjectRepo.create({
      ...dto,
      institutionId,
      code: dto.code.toUpperCase().trim(),
      isDeleted: false,
    });

    await this.notifyLibraryChanged(
      institutionId,
      'subject',
      'create',
      created.id,
    );
    await this.auditService.log(
      'SUBJECT_CREATED',
      actorId,
      { type: 'subject', id: created.id ?? '' },
      { code: dto.code, name: dto.name },
    );

    return created;
  }

  async updateSubject(
    id: string,
    dto: UpdateSubjectDto,
    actorId = 'system',
  ): Promise<Subject> {
    const s = await this.getSubjectById(id);
    const updated = await this.subjectRepo.update(
      id,
      sanitizeUpdate<Subject>(dto),
    );
    if (!updated) throw new NotFoundException('Subject not found');

    await this.notifyLibraryChanged(s.institutionId, 'subject', 'update', id);
    await this.auditService.log(
      'SUBJECT_UPDATED',
      actorId,
      { type: 'subject', id },
      { ...dto },
    );

    return updated;
  }

  async archiveSubject(
    id: string,
    archived: boolean,
    actorId = 'system',
  ): Promise<Subject> {
    const s = await this.getSubjectById(id);
    const updated = await this.subjectRepo.setArchived(id, archived);
    if (!updated) throw new NotFoundException('Subject not found');

    await this.notifyLibraryChanged(s.institutionId, 'subject', 'archive', id);
    await this.auditService.log(
      archived ? 'SUBJECT_ARCHIVED' : 'SUBJECT_UNARCHIVED',
      actorId,
      { type: 'subject', id },
      { archived },
    );

    return updated;
  }

  async deleteSubject(id: string, actorId = 'system'): Promise<boolean> {
    const s = await this.getSubjectById(id);
    const ok = await this.subjectRepo.softDelete(id);
    if (ok) {
      await this.notifyLibraryChanged(s.institutionId, 'subject', 'delete', id);
      await this.auditService.log(
        'SUBJECT_DELETED',
        actorId,
        { type: 'subject', id },
        { code: s.code },
      );
    }
    return ok;
  }

  // ==========================================
  // ELECTIVE GROUPS
  // ==========================================
  async getElectiveGroups(institutionId: string): Promise<ElectiveGroup[]> {
    return this.electiveRepo.findByInstitution(institutionId);
  }

  async createElectiveGroup(
    institutionId: string,
    dto: CreateElectiveGroupDto,
    actorId = 'system',
  ): Promise<ElectiveGroup> {
    const created = await this.electiveRepo.create({
      ...dto,
      institutionId,
      isDeleted: false,
    });

    await this.notifyLibraryChanged(
      institutionId,
      'elective-group',
      'create',
      created.id,
    );
    await this.auditService.log(
      'ELECTIVE_GROUP_CREATED',
      actorId,
      { type: 'electiveGroup', id: created.id ?? '' },
      { name: dto.name },
    );

    return created;
  }

  async updateElectiveGroup(
    id: string,
    dto: UpdateElectiveGroupDto,
    actorId = 'system',
  ): Promise<ElectiveGroup> {
    const eg = await this.electiveRepo.findById(id);
    if (!eg || eg.isDeleted)
      throw new NotFoundException('Elective group not found');

    const updated = await this.electiveRepo.update(
      id,
      sanitizeUpdate<ElectiveGroup>(dto),
    );
    if (!updated) throw new NotFoundException('Elective group not found');

    await this.notifyLibraryChanged(
      eg.institutionId,
      'elective-group',
      'update',
      id,
    );
    await this.auditService.log(
      'ELECTIVE_GROUP_UPDATED',
      actorId,
      { type: 'electiveGroup', id },
      { ...dto },
    );
    return updated;
  }

  async deleteElectiveGroup(id: string, actorId = 'system'): Promise<boolean> {
    const eg = await this.electiveRepo.findById(id);
    if (!eg || eg.isDeleted)
      throw new NotFoundException('Elective group not found');

    const ok = await this.electiveRepo.softDelete(id);
    if (ok) {
      await this.notifyLibraryChanged(
        eg.institutionId,
        'elective-group',
        'delete',
        id,
      );
      await this.auditService.log(
        'ELECTIVE_GROUP_DELETED',
        actorId,
        { type: 'electiveGroup', id },
        { name: eg.name },
      );
    }
    return ok;
  }

  // ==========================================
  // ROOMS
  // ==========================================
  async getRoomList(
    institutionId: string,
    options?: {
      departmentId?: string;
      type?: string;
      building?: string;
      minCapacity?: number;
      archived?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: Room[]; total: number }> {
    return this.roomRepo.findByInstitution(institutionId, options);
  }

  async getRoomById(id: string): Promise<Room> {
    const r = await this.roomRepo.findById(id);
    if (!r || r.isDeleted) throw new NotFoundException('Room not found');
    return r;
  }

  async createRoom(
    institutionId: string,
    dto: CreateRoomDto,
    actorId = 'system',
  ): Promise<Room> {
    const existing = await this.roomRepo.findByCode(institutionId, dto.code);
    if (existing) {
      throw new BadRequestException(
        `Room with code '${dto.code}' already exists in this institution`,
      );
    }

    const created = await this.roomRepo.create({
      ...dto,
      availability: normalizeAvailabilityMatrix(dto.availability),
      institutionId,
      code: dto.code.toUpperCase().trim(),
      isDeleted: false,
    });

    await this.notifyLibraryChanged(
      institutionId,
      'room',
      'create',
      created.id,
    );
    await this.auditService.log(
      'ROOM_CREATED',
      actorId,
      { type: 'room', id: created.id ?? '' },
      { code: dto.code, name: dto.name },
    );

    return created;
  }

  async updateRoom(
    id: string,
    dto: UpdateRoomDto,
    actorId = 'system',
  ): Promise<Room> {
    const r = await this.getRoomById(id);
    if (dto.availability) {
      dto.availability = normalizeAvailabilityMatrix(dto.availability);
    }
    const updated = await this.roomRepo.update(id, sanitizeUpdate<Room>(dto));
    if (!updated) throw new NotFoundException('Room not found');

    await this.notifyLibraryChanged(r.institutionId, 'room', 'update', id);
    await this.auditService.log(
      'ROOM_UPDATED',
      actorId,
      { type: 'room', id },
      { ...dto },
    );

    return updated;
  }

  async archiveRoom(
    id: string,
    archived: boolean,
    actorId = 'system',
  ): Promise<Room> {
    const r = await this.getRoomById(id);
    const updated = await this.roomRepo.setArchived(id, archived);
    if (!updated) throw new NotFoundException('Room not found');

    await this.notifyLibraryChanged(r.institutionId, 'room', 'archive', id);
    await this.auditService.log(
      archived ? 'ROOM_ARCHIVED' : 'ROOM_UNARCHIVED',
      actorId,
      { type: 'room', id },
      { archived },
    );

    return updated;
  }

  async deleteRoom(id: string, actorId = 'system'): Promise<boolean> {
    const r = await this.getRoomById(id);
    const ok = await this.roomRepo.softDelete(id);
    if (ok) {
      await this.notifyLibraryChanged(r.institutionId, 'room', 'delete', id);
      await this.auditService.log(
        'ROOM_DELETED',
        actorId,
        { type: 'room', id },
        { code: r.code },
      );
    }
    return ok;
  }

  // ==========================================
  // MATCHERS & QUALIFIERS
  // ==========================================
  async matchRooms(
    institutionId: string,
    req: RoomMatchRequest,
  ): Promise<RoomMatchResult[]> {
    const { items: rooms } = await this.roomRepo.findByInstitution(
      institutionId,
      { limit: 500 },
    );

    if (req.subjectId) {
      const subject = await this.subjectRepo.findById(req.subjectId);
      if (subject) {
        req.requiredType = req.requiredType ?? subject.requirements?.roomType;
        req.minCapacity = req.minCapacity ?? subject.requirements?.minCapacity;
        req.requiredEquipment =
          req.requiredEquipment ?? subject.requirements?.equipment;
      }
    }

    return this.roomMatcher.findMatchingRooms(rooms, req);
  }

  async qualifyFaculty(
    institutionId: string,
    req: FacultyQualificationRequest,
  ): Promise<FacultyQualificationResult[]> {
    const { items: faculties } = await this.facultyRepo.findByInstitution(
      institutionId,
      { limit: 500 },
    );
    return this.facultyQualifier.findQualifiedFaculties(faculties, req);
  }

  // ==========================================
  // IMPORT & EXPORT
  // ==========================================
  async validateImportFile(
    entity: ImportEntity,
    buffer: Buffer,
    filename: string,
  ): Promise<ImportValidationReport> {
    const rows = await this.importService.parseBuffer(buffer, filename);
    return this.importService.validateRows(entity, rows);
  }

  async executeImport(
    institutionId: string,
    entity: ImportEntity,
    rows: Record<string, unknown>[],
    actorId = 'system',
  ): Promise<{ inserted: number; errors: number }> {
    let inserted = 0;
    let errors = 0;

    for (const rawRow of rows) {
      try {
        const row: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rawRow)) {
          row[k.toLowerCase().trim()] = v;
        }

        if (entity === 'faculty') {
          const code = strVal(row['code']).toUpperCase().trim();
          const name = strVal(row['name']).trim();
          const email = strVal(row['email']).toLowerCase().trim();
          const departmentId = strVal(
            row['departmentid'] || row['department'] || '',
          );
          const designation = strVal(
            row['designation'] || 'Assistant Professor',
          );

          const exists = await this.facultyRepo.findByCode(institutionId, code);
          if (exists) {
            await this.facultyRepo.update(exists.id ?? (exists._id as string), {
              name,
              email,
              departmentId,
              designation,
            });
          } else {
            await this.facultyRepo.create({
              institutionId,
              departmentId,
              name,
              email,
              code,
              designation,
              availability: defaultAvailability(),
              preferredPeriods: [],
              unavailableSlots: [],
              minHoursPerWeek: 0,
              maxHoursPerDay: 6,
              maxHoursPerWeek: 20,
              subjectIds: [],
              archived: false,
              isDeleted: false,
            });
          }
          inserted++;
        } else if (entity === 'subjects') {
          const code = strVal(row['code']).toUpperCase().trim();
          const name = strVal(row['name']).trim();
          const departmentId = strVal(
            row['departmentid'] || row['department'] || '',
          );
          const type = (strVal(row['type']) || 'theory').toLowerCase() as
            'theory' | 'lab' | 'tutorial' | 'seminar';
          const credits = Number(row['credits']) || 3;
          const weeklyHours = Number(row['weeklyhours'] || row['hours']) || 3;
          const labHours = Number(row['labhours']) || 0;

          const exists = await this.subjectRepo.findByCode(institutionId, code);
          if (exists) {
            await this.subjectRepo.update(exists.id ?? (exists._id as string), {
              name,
              departmentId,
              type,
              credits,
              weeklyHours,
              labHours,
            });
          } else {
            await this.subjectRepo.create({
              institutionId,
              departmentId,
              programIds: [],
              code,
              name,
              credits,
              type,
              weeklyHours,
              labHours,
              consecutivePeriods: type === 'lab' ? 3 : 1,
              preferredDays: [],
              requirements: {
                roomType: type === 'lab' ? 'lab' : 'lecture',
                minCapacity: 30,
                equipment: [],
              },
              enrollment: 0,
              dependsOn: [],
              isElective: false,
              facultyIds: [],
              archived: false,
              isDeleted: false,
            });
          }
          inserted++;
        } else if (entity === 'rooms') {
          const code = strVal(row['code']).toUpperCase().trim();
          const name = strVal(row['name']).trim();
          const building = strVal(row['building']).trim();
          const capacity = Number(row['capacity']) || 40;
          const type = (strVal(row['type']) || 'lecture').toLowerCase() as
            'lecture' | 'lab' | 'seminar';

          const exists = await this.roomRepo.findByCode(institutionId, code);
          if (exists) {
            await this.roomRepo.update(exists.id ?? (exists._id as string), {
              name,
              building,
              capacity,
              type,
            });
          } else {
            await this.roomRepo.create({
              institutionId,
              name,
              code,
              building,
              capacity,
              type,
              equipment: [],
              shared: true,
              availability: defaultAvailability(),
              labFor: [],
              archived: false,
              isDeleted: false,
            });
          }
          inserted++;
        }
      } catch {
        errors++;
      }
    }

    await this.notifyLibraryChanged(institutionId, entity, 'import', '');
    await this.auditService.log(
      'LIBRARY_IMPORTED',
      actorId,
      { type: 'institution', id: institutionId },
      { entity, inserted, errors },
    );

    return { inserted, errors };
  }

  async exportLibrary(
    institutionId: string,
    entity: ImportEntity,
    format: 'xlsx' | 'csv' = 'xlsx',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    let rows: Record<string, unknown>[] = [];
    if (entity === 'faculty') {
      const { items } = await this.facultyRepo.findByInstitution(
        institutionId,
        { limit: 10000 },
      );
      rows = items.map((f) => ({
        Code: f.code,
        Name: f.name,
        Email: f.email,
        DepartmentId: f.departmentId,
        Designation: f.designation,
        MinHoursPerWeek: f.minHoursPerWeek,
        MaxHoursPerDay: f.maxHoursPerDay,
        MaxHoursPerWeek: f.maxHoursPerWeek,
        Archived: f.archived ? 'Yes' : 'No',
      }));
    } else if (entity === 'subjects') {
      const { items } = await this.subjectRepo.findByInstitution(
        institutionId,
        { limit: 10000 },
      );
      rows = items.map((s) => ({
        Code: s.code,
        Name: s.name,
        DepartmentId: s.departmentId,
        Type: s.type,
        Credits: s.credits,
        WeeklyHours: s.weeklyHours,
        LabHours: s.labHours,
        ConsecutivePeriods: s.consecutivePeriods,
        RoomType: s.requirements?.roomType,
        MinCapacity: s.requirements?.minCapacity,
        Archived: s.archived ? 'Yes' : 'No',
      }));
    } else if (entity === 'rooms') {
      const { items } = await this.roomRepo.findByInstitution(institutionId, {
        limit: 10000,
      });
      rows = items.map((r) => ({
        Code: r.code,
        Name: r.name,
        Building: r.building,
        Type: r.type,
        Capacity: r.capacity,
        Equipment: r.equipment?.join(', ') || '',
        Shared: r.shared ? 'Yes' : 'No',
        Archived: r.archived ? 'Yes' : 'No',
      }));
    }

    const parser = this.importService.getParser(format);
    const buffer = parser.export(rows);
    const mimeType =
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `${entity}_export_${Date.now()}.${format}`;

    return { buffer, filename, mimeType };
  }

  private async notifyLibraryChanged(
    institutionId: string,
    entity: string,
    action: string,
    entityId: string | undefined,
  ): Promise<void> {
    await this.eventBus.publish('library.changed', {
      institutionId,
      entity,
      action,
      entityId,
      timestamp: new Date().toISOString(),
    });
  }
}
