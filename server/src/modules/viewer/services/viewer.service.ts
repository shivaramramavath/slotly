// Domain service orchestrating viewer timetable retrieval, caching, and landing timetable resolution.
import {
  Injectable,
  Inject,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type {
  ViewerTimetableDto,
  ViewerTimetableQueryDto,
  ScheduleEntryDto,
  ProjectSettings,
} from '@slotly/contracts';
import { CurrentPeriodService } from './current-period.service';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { MongoScheduleVersionRepository } from '../../builds/repositories/mongo-schedule-version.repository';
import { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
import {
  HOLIDAY_REPOSITORY,
  type HolidayRepository,
} from '../../institutions/repositories/holiday.repository';
import {
  FACULTY_REPOSITORY,
  type FacultyRepository,
} from '../../library/repositories/faculty.repository';
import {
  SECTION_REPOSITORY,
  type SectionRepository,
} from '../../institutions/repositories/section.repository';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
} from '../../library/repositories/room.repository';
import {
  SUBJECT_REPOSITORY,
  type SubjectRepository,
} from '../../library/repositories/subject.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

/** Domain service managing published timetable viewer queries and caching. */
@Injectable()
export class ViewerService {
  constructor(
    private readonly currentPeriodService: CurrentPeriodService,
    private readonly projectRepo: CachedProjectRepository,
    private readonly versionRepo: MongoScheduleVersionRepository,
    private readonly entryRepo: ScheduleEntryRepository,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    @Optional()
    @Inject(HOLIDAY_REPOSITORY)
    private readonly holidayRepo?: HolidayRepository,
    @Optional()
    @Inject(FACULTY_REPOSITORY)
    private readonly facultyRepo?: FacultyRepository,
    @Optional()
    @Inject(SECTION_REPOSITORY)
    private readonly sectionRepo?: SectionRepository,
    @Optional()
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepo?: RoomRepository,
    @Optional()
    @Inject(SUBJECT_REPOSITORY)
    private readonly subjectRepo?: SubjectRepository,
  ) {}

  /**
   * Retrieves the published timetable for a specific entity with cache-aside and live period status.
   */
  async getTimetable(
    projectId: string,
    query: ViewerTimetableQueryDto,
  ): Promise<ViewerTimetableDto> {
    const entityType = query.type;
    const targetId = query.targetId;

    const cacheKey = `slotly:viewer:${projectId}:${entityType}:${targetId || 'all'}:${query.day ?? 'week'}`;
    const tag = `project:${projectId}:viewer`;

    return this.cache.remember(
      cacheKey,
      86400,
      async () => {
        const project = await this.projectRepo.findById(projectId);
        if (!project) {
          throw new NotFoundException(`Project "${projectId}" not found`);
        }

        const versions = await this.versionRepo.findByProjectId(projectId);
        const publishedVersion = versions.find((v) => v.status === 'published');
        if (!publishedVersion) {
          throw new NotFoundException({
            message: 'No published timetable version found for this project',
            code: 'NO_PUBLISHED_VERSION',
          });
        }

        const versionId = publishedVersion.id;

        const filter: {
          versionId: string;
          sectionId?: string;
          facultyId?: string;
          roomId?: string;
          subjectId?: string;
          day?: number;
        } = { versionId };

        if (query.day !== undefined) {
          filter.day = query.day;
        }

        if (targetId) {
          if (entityType === 'section') filter.sectionId = targetId;
          else if (entityType === 'faculty') filter.facultyId = targetId;
          else if (entityType === 'room') filter.roomId = targetId;
          else if (entityType === 'subject') filter.subjectId = targetId;
        }

        const entriesDocs = await this.entryRepo.findByFilter(filter);

        const entries: ScheduleEntryDto[] = entriesDocs.map((e: any) => ({
          id: e._id?.toString() || e.id || '',
          versionId: e.versionId,
          sectionId: e.sectionId,
          batchId: e.batchId ?? undefined,
          day: e.day,
          startPeriod: e.startPeriod,
          span: e.span,
          type: e.type,
          subjectId: e.subjectId ?? undefined,
          facultyId: e.facultyId ?? undefined,
          roomId: e.roomId ?? undefined,
          locked: e.locked,
          revision: e.revision,
        }));

        const settings: ProjectSettings = (project.settings || {
          days: [1, 2, 3, 4, 5],
          periodsPerDay: 7,
          periodDuration: 50,
          startTime: '09:00',
          breaks: [],
        }) as ProjectSettings;

        const holidayList = this.holidayRepo
          ? await this.holidayRepo.findByInstitution(project.institutionId)
          : [];
        const holidays = holidayList.map((h: any) => ({
          name: h.name,
          startDate: h.startDate,
          endDate: h.endDate,
        }));

        const currentPeriod = this.currentPeriodService.computeCurrentPeriod(
          settings,
          entries,
          holidays,
        );

        const entityName = targetId
          ? await this.resolveEntityName(entityType, targetId)
          : 'All';

        const days = settings.days || [1, 2, 3, 4, 5];
        const periods = Array.from(
          { length: settings.periodsPerDay || 7 },
          (_, i) => i + 1,
        );

        return {
          projectId,
          versionId,
          versionLabel: publishedVersion.label,
          entityType,
          entityId: targetId || '',
          entityName,
          entries,
          settings,
          currentPeriod,
          days,
          periods,
        };
      },
      [tag],
    );
  }

  /**
   * Resolves the primary landing timetable for the logged-in user based on their role and identity.
   */
  async resolveLandingTimetable(
    _userId: string,
    userRole: string,
    userEmail: string,
    institutionId?: string,
  ): Promise<ViewerTimetableDto> {
    if (!institutionId) {
      throw new NotFoundException(
        'Institution ID required to resolve landing timetable',
      );
    }

    const projects = await this.projectRepo.findByInstitution(institutionId);
    const publishedProject = projects.find((p) => p.status === 'published');
    if (!publishedProject) {
      throw new NotFoundException({
        message: 'No published timetable version is currently available.',
        code: 'NO_PUBLISHED_VERSION',
      });
    }

    const publishedProjectId = publishedProject.id || '';

    if (userRole === 'FACULTY' && this.facultyRepo) {
      const faculties = await this.facultyRepo.findByInstitution(institutionId);
      const faculty =
        faculties.items.find(
          (f: any) => f.email?.toLowerCase() === userEmail.toLowerCase(),
        ) || faculties.items[0];

      if (!faculty) {
        throw new NotFoundException('Faculty record not found');
      }

      const facultyId = (faculty as any)._id?.toString() || faculty.id || '';
      return this.getTimetable(publishedProjectId, {
        type: 'faculty',
        targetId: facultyId,
      });
    }

    if (userRole === 'STUDENT' && this.sectionRepo) {
      const sections = await this.sectionRepo.findByInstitution(institutionId);
      const section = sections[0];
      if (!section) {
        throw new NotFoundException('Section record not found');
      }

      const sectionId = (section as any)._id?.toString() || section.id || '';
      return this.getTimetable(publishedProjectId, {
        type: 'section',
        targetId: sectionId,
      });
    }

    // Default to first section in published project
    if (this.sectionRepo) {
      const sections = await this.sectionRepo.findByInstitution(institutionId);
      if (sections[0]) {
        const secId =
          (sections[0] as any)._id?.toString() || sections[0].id || '';
        return this.getTimetable(publishedProjectId, {
          type: 'section',
          targetId: secId,
        });
      }
    }

    throw new NotFoundException('No entities found for timetable viewing');
  }

  /** Alias for resolveLandingTimetable. */
  async getLandingTimetable(
    userId: string,
    userRole: string,
    userEmail: string,
    institutionId?: string,
  ): Promise<ViewerTimetableDto> {
    return this.resolveLandingTimetable(
      userId,
      userRole,
      userEmail,
      institutionId,
    );
  }

  private async resolveEntityName(
    type: string,
    targetId: string,
  ): Promise<string> {
    try {
      if (type === 'faculty' && this.facultyRepo) {
        const f = await this.facultyRepo.findById(targetId);
        if (f) return f.name;
      } else if (type === 'section' && this.sectionRepo) {
        const s = await this.sectionRepo.findById(targetId);
        if (s) return s.name;
      } else if (type === 'room' && this.roomRepo) {
        const r = await this.roomRepo.findById(targetId);
        if (r) return r.name;
      } else if (type === 'subject' && this.subjectRepo) {
        const sub = await this.subjectRepo.findById(targetId);
        if (sub) return sub.name;
      }
    } catch {
      // Fallback
    }
    return targetId;
  }
}
