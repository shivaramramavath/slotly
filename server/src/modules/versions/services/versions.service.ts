// Domain service managing timetable version retrieval, labeling, duplication, restoration, and diff comparison.
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  ScheduleVersionDto,
  TimetableRatingDto,
  TimetableRatingResponseDto,
  UpdateVersionLabelDto,
  VersionDiffDto,
} from '@slotly/contracts';
import {
  SCHEDULE_VERSION_REPOSITORY,
  type IScheduleVersionRepository,
} from '../../builds/repositories/schedule-version.repository.interface';
import { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
import { ScheduleOccupancyRepository } from '../../schedules/repositories/schedule-occupancy.repository';
import { DiffService } from './diff.service';
import { TimetableRatingRepository } from '../repositories/timetable-rating.repository';
import {
  Project,
  ProjectDocument,
} from '../../projects/schemas/project.schema';
import {
  FACULTY_REPOSITORY,
  type FacultyRepository,
} from '../../library/repositories/faculty.repository';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../../library/repositories/room.repository';
import {
  SUBJECT_REPOSITORY,
  type SubjectRepository,
} from '../../library/repositories/subject.repository';
import { BlueprintService } from '../../blueprint/services/blueprint.service';
import { PublishStateMachine } from '../../publishing/state-machine/publish-state-machine';

/** Injectable service providing business logic for version management and comparisons. */
@Injectable()
export class VersionsService {
  constructor(
    @Inject(SCHEDULE_VERSION_REPOSITORY)
    private readonly versionRepo: IScheduleVersionRepository,
    private readonly diffService: DiffService,
    private readonly scheduleEntryRepo: ScheduleEntryRepository,
    private readonly scheduleOccupancyRepo: ScheduleOccupancyRepository,
    private readonly ratingRepo: TimetableRatingRepository,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @Optional()
    @Inject(FACULTY_REPOSITORY)
    private readonly facultyRepo?: FacultyRepository,
    @Optional()
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepo?: RoomRepository,
    @Optional()
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepo?: SubjectRepository,
    @Optional()
    private readonly blueprintService?: BlueprintService,
  ) {}

  /** Retrieves all timetable schedule versions for a project sorted by version number descending. */
  async listVersions(projectId: string): Promise<ScheduleVersionDto[]> {
    return this.versionRepo.findByProjectId(projectId);
  }

  /** Retrieves a specific timetable schedule version by identifier. */
  async getVersion(versionId: string): Promise<ScheduleVersionDto> {
    const version = await this.versionRepo.findById(versionId);
    if (!version) {
      throw new NotFoundException(`Schedule version "${versionId}" not found`);
    }
    return version;
  }

  /** Updates the human-readable label of a timetable version. */
  async updateLabel(
    versionId: string,
    dto: UpdateVersionLabelDto,
  ): Promise<ScheduleVersionDto> {
    const existing = await this.getVersion(versionId);
    if (existing.status === 'published' || existing.status === 'archived') {
      throw new ConflictException({
        message:
          'Published or archived schedule versions are immutable and cannot be renamed.',
        code: 'VERSION_IMMUTABLE',
      });
    }

    const updated = await this.versionRepo.update(versionId, {
      label: dto.label.trim(),
    });
    if (!updated) {
      throw new NotFoundException(`Schedule version "${versionId}" not found`);
    }
    return updated;
  }

  /**
   * Duplicates an existing schedule version into a brand new draft revision.
   */
  async duplicateVersion(
    versionId: string,
    _userId: string,
    labelOverride?: string,
  ): Promise<ScheduleVersionDto> {
    const source = await this.getVersion(versionId);
    const existingVersions = await this.versionRepo.findByProjectId(
      source.projectId,
    );
    const maxVersionNo = existingVersions.reduce(
      (max, v) => Math.max(max, v.versionNo),
      0,
    );
    const nextVersionNo = maxVersionNo + 1;

    const label =
      labelOverride?.trim() ||
      `Draft Revision ${nextVersionNo} (Copy of ${source.label})`;

    // Create the new schedule version document
    const createdVersion = await this.versionRepo.create({
      projectId: source.projectId,
      versionNo: nextVersionNo,
      label,
      status: 'draft',
      kind: 'manual',
      score: source.score,
      conflicts: source.conflicts || [],
      stats: source.stats,
      slots: source.slots || [],
      revision: 1,
    });

    const newVersionId = createdVersion.id;

    // Duplicate schedule entries
    const sourceEntries = await this.scheduleEntryRepo.findByVersion(versionId);
    if (sourceEntries.length > 0) {
      const clonedEntries = sourceEntries.map((e) => ({
        versionId: newVersionId,
        sectionId: e.sectionId,
        batchId: e.batchId,
        day: e.day,
        startPeriod: e.startPeriod,
        span: e.span,
        type: e.type,
        subjectId: e.subjectId,
        facultyId: e.facultyId,
        roomId: e.roomId,
        locked: false,
        revision: 1,
      }));
      await this.scheduleEntryRepo.createMany(clonedEntries);
    }

    // Duplicate occupancies
    const sourceOccupancies =
      await this.scheduleOccupancyRepo.findByVersion(versionId);
    if (sourceOccupancies.length > 0) {
      const clonedOccupancies = sourceOccupancies.map((o) => ({
        versionId: newVersionId,
        resourceType: o.resourceType,
        resourceId: o.resourceId,
        day: o.day,
        period: o.period,
        entryId: o.entryId,
      }));
      await this.scheduleOccupancyRepo.createMany(clonedOccupancies);
    }

    return createdVersion;
  }

  /**
   * Restores an older schedule version as an active draft.
   */
  async restoreVersion(
    versionId: string,
    userId: string,
    labelOverride?: string,
  ): Promise<ScheduleVersionDto> {
    const source = await this.getVersion(versionId);
    const label =
      labelOverride?.trim() ||
      `Restored from v${source.versionNo} (${source.label})`;
    return this.duplicateVersion(versionId, userId, label);
  }

  /**
   * Archives a timetable schedule version.
   */
  async archiveVersion(versionId: string): Promise<ScheduleVersionDto> {
    const existing = await this.getVersion(versionId);
    const sm = new PublishStateMachine(existing.status);

    sm.transition('archived');

    const updated = await this.versionRepo.update(versionId, {
      status: 'archived',
    });
    if (!updated) {
      throw new NotFoundException(`Schedule version "${versionId}" not found`);
    }
    return updated;
  }

  /**
   * Compares two timetable schedule versions and produces structured diff with human text descriptions.
   */
  async compareVersions(
    leftVersionId: string,
    rightVersionId: string,
  ): Promise<VersionDiffDto> {
    const leftVersion = await this.getVersion(leftVersionId);
    const rightVersion = await this.getVersion(rightVersionId);

    if (leftVersion.projectId !== rightVersion.projectId) {
      throw new BadRequestException(
        'Cannot compare schedule versions from different projects.',
      );
    }

    // Resolve human-readable lookups for subjects, faculties, and rooms
    const project = await this.projectModel
      .findById(leftVersion.projectId)
      .lean()
      .exec();
    const institutionId = project?.institutionId?.toString();

    const lookups: {
      subjects: Record<string, string>;
      faculties: Record<string, string>;
      rooms: Record<string, string>;
    } = { subjects: {}, faculties: {}, rooms: {} };

    if (institutionId) {
      if (this.facultyRepo) {
        const facultiesRes =
          await this.facultyRepo.findByInstitution(institutionId);
        for (const f of facultiesRes.items) {
          lookups.faculties[f.id || f._id?.toString() || ''] = f.name;
        }
      }
      if (this.roomRepo) {
        const roomsRes = await this.roomRepo.findByInstitution(institutionId);
        for (const r of roomsRes.items) {
          lookups.rooms[r.id || r._id?.toString() || ''] = r.name || r.code;
        }
      }
      if (this.subjectRepo) {
        const subjectsRes =
          await this.subjectRepo.findByInstitution(institutionId);
        for (const s of subjectsRes.items) {
          lookups.subjects[s.id || s._id?.toString() || ''] = s.name || s.code;
        }
      }
    }

    // Also supplement lookups from blueprint nodes if available
    if (this.blueprintService) {
      try {
        const graph = await this.blueprintService.getGraph(
          leftVersion.projectId,
        );
        for (const node of graph.nodes) {
          const nameVal =
            typeof node.data?.name === 'string' ? node.data.name : '';
          const codeVal =
            typeof node.data?.code === 'string' ? node.data.code : '';

          if (node.type === 'faculty' && nameVal) {
            lookups.faculties[node.id] = nameVal;
          } else if (node.type === 'room' && (nameVal || codeVal)) {
            lookups.rooms[node.id] = nameVal || codeVal;
          } else if (
            node.type === 'subjectAssignment' &&
            (nameVal || codeVal)
          ) {
            lookups.subjects[node.id] = nameVal || codeVal;
          }
        }
      } catch {
        // Fallback silently if nodes cannot be loaded
      }
    }

    const leftDiffable = {
      id: leftVersion.id,
      score: leftVersion.score,
      conflicts: leftVersion.conflicts,
      slots: (leftVersion.slots || []).map((s) => ({
        id: s.id,
        sectionId: s.sectionId,
        batchId: s.batchId,
        subjectId: s.subjectId,
        facultyId: s.facultyId,
        roomId: s.roomId,
        day: s.day,
        period: s.period,
        startPeriod: s.period,
        span: s.span,
        type: s.type,
      })),
    };

    const rightDiffable = {
      id: rightVersion.id,
      score: rightVersion.score,
      conflicts: rightVersion.conflicts,
      slots: (rightVersion.slots || []).map((s) => ({
        id: s.id,
        sectionId: s.sectionId,
        batchId: s.batchId,
        subjectId: s.subjectId,
        facultyId: s.facultyId,
        roomId: s.roomId,
        day: s.day,
        period: s.period,
        startPeriod: s.period,
        span: s.span,
        type: s.type,
      })),
    };

    return this.diffService.compare(leftDiffable, rightDiffable, lookups);
  }

  /**
   * Submits a quality rating and feedback for a schedule version.
   */
  async rateVersion(
    versionId: string,
    userId: string,
    dto: TimetableRatingDto,
  ): Promise<TimetableRatingResponseDto> {
    const version = await this.getVersion(versionId);

    const created = await this.ratingRepo.create({
      versionId,
      projectId: version.projectId,
      userId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
      categories: dto.categories || {},
    });

    return {
      id: created._id?.toString() || created.id || '',
      versionId,
      projectId: version.projectId,
      userId,
      rating: created.rating,
      comment: created.comment || undefined,
      categories: created.categories,
      createdAt: created.createdAt
        ? created.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Retrieves all quality ratings submitted for a schedule version.
   */
  async getRatings(versionId: string): Promise<TimetableRatingResponseDto[]> {
    await this.getVersion(versionId);
    const ratings = await this.ratingRepo.findByVersionId(versionId);
    return ratings.map((r) => ({
      id: r._id?.toString() || r.id || '',
      versionId: r.versionId,
      projectId: r.projectId,
      userId: r.userId,
      rating: r.rating,
      comment: r.comment || undefined,
      categories: r.categories,
      createdAt: r.createdAt
        ? r.createdAt.toISOString()
        : new Date().toISOString(),
    }));
  }
}
