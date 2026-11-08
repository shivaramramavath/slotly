// Domain service orchestrating write-behind.service business logic.
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { CACHE_SERVICE } from '../cache/cache.interface';
import type { CacheService } from '../cache/cache.interface';

/** Interface defining structure for write behind job. */
export interface WriteBehindJob<T = unknown> {
  entity: string;
  id: string;
  payload: T;
  projectId?: string | undefined;
  timestamp: number;
}

/** Constant representing write behind queue. */
export const WRITE_BEHIND_QUEUE = 'write-behind';

/** Injectable service providing write behind service logic. */
@Injectable()
export class WriteBehindService implements OnModuleDestroy {
  private readonly logger = new Logger(WriteBehindService.name);
  private readonly inMemoryPendingJobs = new Map<string, Set<string>>();
  private readonly inMemoryQueue = new Map<string, WriteBehindJob>();

  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: CacheService,
    @Optional() private readonly bullQueue?: Queue,
  ) {}

  /**
   * Enqueues an operation to the write-behind queue.
   * Uses jobId = `${entity}:${id}` to coalesce rapid successive edits.
   */
  async enqueue<T>(
    entity: string,
    id: string,
    payload: T,
    projectId?: string,
  ): Promise<void> {
    const jobId = `${entity}:${id}`;
    const jobData: WriteBehindJob<T> = {
      entity,
      id,
      payload,
      projectId,
      timestamp: Date.now(),
    };

    if (projectId) {
      await this.incrementPendingWrites(projectId, jobId);
    }

    if (this.bullQueue) {
      try {
        await this.bullQueue.add(`sync-${entity}`, jobData, {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false, // Keep in dead-letter for inspection
        });
        return;
      } catch (err: unknown) {
        this.logger.warn(
          `BullMQ enqueue failed, using local queue: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // In-memory coalesced queue fallback
    this.inMemoryQueue.set(jobId, jobData);
  }

  async incrementPendingWrites(
    projectId: string,
    jobId?: string,
  ): Promise<void> {
    let jobSet = this.inMemoryPendingJobs.get(projectId);
    if (!jobSet) {
      jobSet = new Set<string>();
      this.inMemoryPendingJobs.set(projectId, jobSet);
    }
    const resolvedJobId = jobId || `job_${jobSet.size + 1}`;
    jobSet.add(resolvedJobId);
    await this.cacheService.set(
      `pending_jobs:${projectId}`,
      Array.from(jobSet),
      300,
    );
  }

  async decrementPendingWrites(
    projectId: string,
    jobId?: string,
  ): Promise<void> {
    const jobSet = this.inMemoryPendingJobs.get(projectId);
    if (jobSet) {
      if (jobId) {
        jobSet.delete(jobId);
      } else {
        const first = jobSet.values().next().value;
        if (first) {
          jobSet.delete(first);
        }
      }
      if (jobSet.size === 0) {
        this.inMemoryPendingJobs.delete(projectId);
        await this.cacheService.del(`pending_jobs:${projectId}`);
      } else {
        await this.cacheService.set(
          `pending_jobs:${projectId}`,
          Array.from(jobSet),
          300,
        );
      }
    } else {
      await this.cacheService.del(`pending_jobs:${projectId}`);
    }
  }

  async getPendingWrites(projectId: string): Promise<number> {
    const cached = await this.cacheService.get<string[]>(
      `pending_jobs:${projectId}`,
    );
    if (Array.isArray(cached)) {
      return cached.length;
    }
    return this.inMemoryPendingJobs.get(projectId)?.size || 0;
  }

  /**
   * Consistency Barrier: Awaits all pending writes for a project to flush before a build begins.
   */
  async flushOrAwaitPendingWrites(
    projectId: string,
    timeoutMs: number = 5000,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const pending = await this.getPendingWrites(projectId);
      if (pending === 0) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.logger.warn(
      `Consistency barrier timeout for project "${projectId}" after ${timeoutMs}ms`,
    );
  }

  getQueuedJob(jobId: string): WriteBehindJob | undefined {
    return this.inMemoryQueue.get(jobId);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bullQueue) {
      try {
        await this.bullQueue.close();
      } catch {
        // ignore on exit
      }
    }
  }
}
