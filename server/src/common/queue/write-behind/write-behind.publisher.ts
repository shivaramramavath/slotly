// Abstract publisher for write-behind persistence jobs with durable cache write and rollback contract.
import { Logger } from '@nestjs/common';
import type { Queue, JobsOptions } from 'bullmq';
import type { CacheService } from '../../cache/cache.interface';
import type { ICacheMetrics } from '../../cache/interfaces/cache-metrics.interface';
import { WRITE_BEHIND_JOB_DEFAULTS } from './write-behind.defaults';
import type { WriteBehindJobPayload } from './write-behind.types';

/** Abstract write-behind publisher enforcing durable enqueue-or-fail cache rollback contracts. */
export abstract class WriteBehindPublisher<T = unknown> {
  protected readonly logger: Logger;

  constructor(
    protected readonly queue: Queue | null,
    protected readonly cache: CacheService,
    protected readonly metrics?: ICacheMetrics,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /** Generates a deterministic BullMQ job identifier based on entity, id, and revision. */
  protected buildJobId(data: WriteBehindJobPayload<T>): string {
    const rev =
      data.revision !== undefined
        ? String(data.revision)
        : String(data.timestamp);
    return `${data.entity}:${data.id}:${rev}`;
  }

  /**
   * Enqueues a write-behind persistence job.
   * Write path contract:
   * 1. Writes new state with `_persistence: 'pending'` to cache.
   * 2. Enqueues job to BullMQ queue.
   * 3. On enqueue failure, rolls back cache and rethrows to fail the request immediately.
   */
  async enqueue(
    jobName: string,
    data: WriteBehindJobPayload<T>,
    opts?: JobsOptions,
  ): Promise<void> {
    const jobId = this.buildJobId(data);
    const cacheKey = `slotly:wb:${data.entity}:${data.id}`;

    // Read previous cache entry for rollback safety if available
    let previousState: unknown = null;
    try {
      previousState = await this.cache.get(cacheKey);
    } catch {
      // ignore read failure
    }

    // 1. Write pending state to cache
    const pendingData: WriteBehindJobPayload<T> = {
      ...data,
      _persistence: 'pending',
    };

    try {
      await this.cache.set(cacheKey, pendingData, 3600);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to set pending cache state for ${jobId}: ${String(err)}`,
      );
    }

    // 2. Enqueue to durable BullMQ queue
    if (!this.queue) {
      this.logger.warn(
        `BullMQ queue not available for ${jobName}. Persistence relies on in-memory queue.`,
      );
      return;
    }

    try {
      const mergedOpts: JobsOptions = {
        jobId,
        ...WRITE_BEHIND_JOB_DEFAULTS,
        ...opts,
      };

      await this.queue.add(jobName, pendingData, mergedOpts);
      this.metrics?.recordWriteBehind(data.entity, 'enqueued');
    } catch (enqueueErr: unknown) {
      this.logger.error(
        `Failed to enqueue write-behind job ${jobId}. Rolling back cache state.`,
        enqueueErr instanceof Error ? enqueueErr.stack : String(enqueueErr),
      );

      // Rollback cache
      try {
        if (previousState !== null) {
          await this.cache.set(cacheKey, previousState, 3600);
        } else {
          await this.cache.del(cacheKey);
        }
      } catch (rollbackErr: unknown) {
        this.logger.error(
          `Failed to rollback cache for ${jobId}: ${String(rollbackErr)}`,
        );
      }

      this.metrics?.recordWriteBehind(data.entity, 'failed');
      throw new Error(
        `Write-behind enqueue failed for ${jobId}: ${enqueueErr instanceof Error ? enqueueErr.message : String(enqueueErr)}`,
      );
    }
  }
}
