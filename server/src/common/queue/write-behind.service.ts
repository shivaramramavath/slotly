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
  private readonly inMemoryPending = new Map<string, number>();
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
      await this.incrementPendingWrites(projectId);
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

  async incrementPendingWrites(projectId: string): Promise<void> {
    const current = (this.inMemoryPending.get(projectId) || 0) + 1;
    this.inMemoryPending.set(projectId, current);
    await this.cacheService.set(`pending_writes:${projectId}`, current, 300);
  }

  async decrementPendingWrites(projectId: string): Promise<void> {
    const current = Math.max((this.inMemoryPending.get(projectId) || 1) - 1, 0);
    this.inMemoryPending.set(projectId, current);
    await this.cacheService.set(`pending_writes:${projectId}`, current, 300);
  }

  async getPendingWrites(projectId: string): Promise<number> {
    const cached = await this.cacheService.get<number>(
      `pending_writes:${projectId}`,
    );
    if (cached !== null) {
      return cached;
    }
    return this.inMemoryPending.get(projectId) || 0;
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
