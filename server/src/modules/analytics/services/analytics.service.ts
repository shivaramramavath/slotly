// Domain service coordinating analytics computation, metric evaluations, and caching.
import {
  Injectable,
  Inject,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type {
  AnalyticsMetricKey,
  AnalyticsOverviewDto,
  WorkloadBalancingSuggestionsResponse,
  ScheduleEntryDto,
  ProjectSettings,
} from '@slotly/contracts';
import { MetricRegistry } from './metric.registry';
import { WorkloadBalancerService } from './workload-balancer.service';
import type { MetricContext } from '../interfaces/analytics-metric.interface';
import { CachedProjectRepository } from '../../projects/repositories/cached-project.repository';
import { MongoScheduleVersionRepository } from '../../builds/repositories/mongo-schedule-version.repository';
import { ScheduleEntryRepository } from '../../schedules/repositories/schedule-entry.repository';
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
import {
  DEPARTMENT_REPOSITORY,
  type DepartmentRepository,
} from '../../institutions/repositories/department.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

const ANALYTICS_CACHE_TTL = 3600; // 1 hour

/** Domain service evaluating, aggregating, and caching timetable analytical metrics. */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly metricRegistry: MetricRegistry,
    private readonly workloadBalancer: WorkloadBalancerService,
    private readonly projectRepo: CachedProjectRepository,
    private readonly versionRepo: MongoScheduleVersionRepository,
    private readonly entryRepo: ScheduleEntryRepository,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
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
    @Optional()
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo?: DepartmentRepository,
  ) {}

  /**
   * Retrieves high-level overview metrics for a project's published schedule.
   */
  async getOverview(projectId: string): Promise<AnalyticsOverviewDto> {
    const cacheKey = `slotly:analytics:${projectId}:overview`;
    return this.cache.remember(
      cacheKey,
      ANALYTICS_CACHE_TTL,
      async () => {
        const context = await this.buildMetricContext(projectId);
        const metric = this.metricRegistry.getMetric('overview_counts');
        if (!metric) {
          throw new NotFoundException('Overview counts metric not found');
        }
        return Promise.resolve(
          metric.calculate(context),
        ) as Promise<AnalyticsOverviewDto>;
      },
      [`project:${projectId}:analytics`],
    );
  }

  /**
   * Retrieves all registered analytics metrics for a project.
   */
  async getAllMetrics(projectId: string): Promise<Record<string, unknown>> {
    const context = await this.buildMetricContext(projectId);
    const metrics = this.metricRegistry.getAllMetrics();
    const results: Record<string, unknown> = {};

    for (const metric of metrics) {
      const cacheKey = `slotly:analytics:${projectId}:${metric.key}`;
      results[metric.key] = await this.cache.remember(
        cacheKey,
        ANALYTICS_CACHE_TTL,
        async () => Promise.resolve(metric.calculate(context)),
        [`project:${projectId}:analytics`],
      );
    }

    return results;
  }

  /**
   * Retrieves a single specified analytical metric by key.
   */
  async getMetric(
    projectId: string,
    metricKey: AnalyticsMetricKey,
  ): Promise<unknown> {
    const metric = this.metricRegistry.getMetric(metricKey);
    if (!metric) {
      throw new NotFoundException(`Metric "${metricKey}" is not supported`);
    }

    const cacheKey = `slotly:analytics:${projectId}:${metricKey}`;
    return this.cache.remember(
      cacheKey,
      ANALYTICS_CACHE_TTL,
      async () => {
        const context = await this.buildMetricContext(projectId);
        return Promise.resolve(metric.calculate(context));
      },
      [`project:${projectId}:analytics`],
    );
  }

  /**
   * Generates non-destructive faculty workload balancing suggestions.
   */
  async getBalancingSuggestions(
    projectId: string,
  ): Promise<WorkloadBalancingSuggestionsResponse> {
    const context = await this.buildMetricContext(projectId);
    return this.workloadBalancer.suggestBalancing(context);
  }

  /**
   * Builds the comprehensive analytical evaluation context for a project.
   */
  private async buildMetricContext(projectId: string): Promise<MetricContext> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const institutionId = String(project.institutionId);

    // Retrieve project versions
    const versions = await this.versionRepo.findByProjectId(projectId);
    const publishedVersion = versions.find((v) => v.status === 'published');
    const versionId = publishedVersion ? String(publishedVersion.id) : '';

    let entries: ScheduleEntryDto[] = [];
    let conflictsCount = 0;

    if (versionId) {
      const dbEntries = await this.entryRepo.findByVersion(versionId);
      entries = dbEntries.map((e) => ({
        id: String(e._id),
        versionId: String(e.versionId),
        sectionId: String(e.sectionId),
        batchId: e.batchId ? String(e.batchId) : undefined,
        day: e.day,
        startPeriod: e.startPeriod,
        span: e.span ?? 1,
        type: e.type,
        subjectId: e.subjectId ? String(e.subjectId) : undefined,
        facultyId: e.facultyId ? String(e.facultyId) : undefined,
        roomId: e.roomId ? String(e.roomId) : undefined,
        locked: e.locked ?? false,
        revision: e.revision ?? 1,
      }));
      conflictsCount = publishedVersion?.conflicts?.length ?? 0;
    }

    const generatedCount = versions.length;
    const publishedCount = versions.filter(
      (v) => v.status === 'published',
    ).length;

    // Load institution blueprint elements concurrently
    const [facultiesRes, roomsRes, subjectsRes, sections, departments] =
      await Promise.all([
        this.facultyRepo?.findByInstitution(institutionId) ??
          Promise.resolve({ items: [], total: 0 }),
        this.roomRepo?.findByInstitution(institutionId) ??
          Promise.resolve({ items: [], total: 0 }),
        this.subjectRepo?.findByInstitution(institutionId) ??
          Promise.resolve({ items: [], total: 0 }),
        this.sectionRepo?.findByInstitution(institutionId) ??
          Promise.resolve([]),
        this.departmentRepo?.findByInstitution(institutionId) ??
          Promise.resolve([]),
      ]);

    const faculties = facultiesRes.items;
    const rooms = roomsRes.items;
    const subjects = subjectsRes.items;

    const defaultSettings: ProjectSettings = {
      days: [1, 2, 3, 4, 5],
      periodsPerDay: 7,
      periodDuration: 50,
      breaks: [],
      startTime: '09:00',
      perDayOverrides: {},
    };

    return {
      projectId,
      institutionId,
      versionId,
      entries,
      settings: (project.settings as ProjectSettings) ?? defaultSettings,
      faculties,
      rooms,
      subjects,
      sections,
      departments,
      generatedCount,
      publishedCount,
      conflictsCount,
    };
  }
}
