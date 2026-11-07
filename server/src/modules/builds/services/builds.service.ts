// Domain service orchestrating builds.service business logic.
import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import { BuildFacade } from './build.facade';
import { BuildsGateway } from '../gateways/builds.gateway';
import { SCHEDULE_VERSION_REPOSITORY } from '../repositories/schedule-version.repository.interface';
import type { IScheduleVersionRepository } from '../repositories/schedule-version.repository.interface';
import type { CreateBuildDto, ScheduleVersionDto } from '@slotly/contracts';

/** Constant representing builds queue. */
export const BUILDS_QUEUE = 'builds';

/** Injectable service providing builds service logic. */
@Injectable()
export class BuildsService {
  private readonly logger = new Logger(BuildsService.name);

  constructor(
    private readonly buildFacade: BuildFacade,
    private readonly buildsGateway: BuildsGateway,
    @Inject(CACHE_SERVICE) private readonly cacheService: CacheService,
    @Inject(SCHEDULE_VERSION_REPOSITORY)
    private readonly versionRepo: IScheduleVersionRepository,
  ) {}

  /**
   * Enqueues or executes a timetable build.
   * Uses Redis distributed lock `slotly:lock:build:{projectId}` to ensure only one active build per project.
   */
  async startBuild(
    projectId: string,
    dto: CreateBuildDto,
    userId: string,
  ): Promise<ScheduleVersionDto[]> {
    const lockKey = `slotly:lock:build:${projectId}`;
    const existingLock = await this.cacheService.get(lockKey);
    if (existingLock) {
      throw new ConflictException(
        'Another build is already in progress for this project. Please wait or cancel the active build.',
      );
    }

    // Acquire distributed lock for 180 seconds
    const buildId = `bld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.logger.log(
      `Starting build ${buildId} for project ${projectId} by user ${userId}`,
    );
    await this.cacheService.set(
      lockKey,
      { buildId, userId, startedAt: Date.now() },
      180,
    );

    // Initial broadcast to /builds socket room
    this.buildsGateway.broadcastProgress(projectId, {
      projectId,
      buildId,
      status: 'running',
      progress: 5,
      step: 'STARTING',
      message: 'Initializing build process...',
    });

    try {
      const versions = await this.buildFacade.build(
        projectId,
        dto,
        userId,
        (progress, step, message) => {
          this.buildsGateway.broadcastProgress(projectId, {
            projectId,
            buildId,
            status: 'running',
            progress,
            step,
            message,
          });
        },
      );

      // Broadcast completion
      this.buildsGateway.broadcastCompleted(projectId, {
        projectId,
        buildId,
        status: 'completed',
        progress: 100,
        step: 'COMPLETED',
        message: 'Build completed successfully.',
        versions,
      });

      return versions;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown build error occurred';
      const missingItems =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { missingItems?: unknown[] } }).response
              ?.missingItems
          : undefined;

      this.buildsGateway.broadcastFailed(projectId, {
        projectId,
        buildId,
        status: 'failed',
        progress: 0,
        step: 'FAILED',
        message: errorMessage,
        error: errorMessage,
        missing: missingItems,
      });

      throw err;
    } finally {
      // Release distributed lock
      await this.cacheService.del(lockKey);
    }
  }

  /**
   * Cancels the active build for a project and frees the Redis lock.
   */
  async cancelBuild(projectId: string): Promise<boolean> {
    const lockKey = `slotly:lock:build:${projectId}`;
    const lock = await this.cacheService.get(lockKey);
    if (!lock) return false;

    await this.cacheService.del(lockKey);

    this.buildsGateway.broadcastFailed(projectId, {
      projectId,
      status: 'cancelled',
      progress: 0,
      step: 'CANCELLED',
      message: 'Build was cancelled by the user.',
      error: 'Build cancelled by user',
    });

    return true;
  }

  /**
   * Checks if a build is currently running for the project.
   */
  async isBuildRunning(
    projectId: string,
  ): Promise<{ running: boolean; buildInfo?: unknown }> {
    const lockKey = `slotly:lock:build:${projectId}`;
    const lock = await this.cacheService.get(lockKey);
    return {
      running: lock !== null,
      buildInfo: lock || undefined,
    };
  }

  async getVersions(projectId: string): Promise<ScheduleVersionDto[]> {
    return this.versionRepo.findByProjectId(projectId);
  }

  async getVersion(versionId: string): Promise<ScheduleVersionDto | null> {
    return this.versionRepo.findById(versionId);
  }
}
