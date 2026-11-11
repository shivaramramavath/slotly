// Abstract BullMQ worker processor for write-behind jobs with revision checking, audit logging, and event dispatch.
import { WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { CacheService } from '../../cache/cache.interface';
import type { ICacheMetrics } from '../../cache/interfaces/cache-metrics.interface';
import type { EventBus } from '../../events/event-bus.service';
import type { AuditService } from '../../audit/audit.service';
import type { WriteBehindJobPayload } from './write-behind.types';

/** Abstract queue processor dispatching write-behind jobs by name and maintaining audit and event states. */
export abstract class WriteBehindProcessor<T = unknown> extends WorkerHost {
  protected readonly logger: Logger;

  constructor(
    protected readonly cache: CacheService,
    protected readonly eventBus?: EventBus,
    protected readonly auditService?: AuditService,
    protected readonly metrics?: ICacheMetrics,
  ) {
    super();
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Main processor entry point dispatching by job name to domain persistence handlers.
   * Enforces revision ordering, audit logging, and lifecycle event broadcasts.
   */
  async process(
    job: Job<WriteBehindJobPayload<T>>,
  ): Promise<{ success: boolean; skipped?: boolean }> {
    const { entity, id, revision, projectId } = job.data;
    const cacheKey = `slotly:wb:${entity}:${id}`;

    try {
      this.logger.debug(
        `Processing write-behind job ${job.id} for ${entity}:${id} (revision: ${revision ?? 'none'})`,
      );

      // Verify revision ordering if domain provides current revision check
      const currentRevision = await this.getCurrentRevision(entity, id);
      if (
        revision !== undefined &&
        currentRevision !== null &&
        revision < currentRevision
      ) {
        this.logger.warn(
          `Skipping stale write-behind job ${job.id} for ${entity}:${id}: job revision ${revision} < current revision ${currentRevision}`,
        );
        return { success: true, skipped: true };
      }

      // Dispatch to domain persistence handler
      await this.handleJob(job.name, job.data);

      // 5. Processor success: update cache and emit persisted event
      try {
        await this.cache.set(
          cacheKey,
          { ...job.data, _persistence: 'persisted' },
          3600,
        );
      } catch {
        // non-blocking
      }

      this.metrics?.recordWriteBehind(entity, 'persisted');

      if (this.eventBus) {
        await this.eventBus.publish(`${entity}.persisted`, {
          entity,
          id,
          revision,
          projectId,
          timestamp: Date.now(),
        });
      }

      return { success: true };
    } catch (err: unknown) {
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 3);
      this.logger.error(
        `Write-behind job ${job.id} failed for ${entity}:${id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3}): ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );

      if (isFinalAttempt) {
        // 6. Processor final failure: invalidate cache, write audit log, emit failure event
        try {
          await this.cache.del(cacheKey);
        } catch {
          // ignore
        }

        this.metrics?.recordWriteBehind(entity, 'failed');

        if (this.auditService) {
          try {
            await this.auditService.log(
              `WRITE_BEHIND_FAILED_${entity.toUpperCase()}`,
              'system',
              { type: entity, id },
              {
                jobId: job.id,
                revision,
                projectId,
                error: err instanceof Error ? err.message : String(err),
              },
            );
          } catch {
            // ignore audit failure
          }
        }

        if (this.eventBus) {
          await this.eventBus.publish(`${entity}.persistence_failed`, {
            entity,
            id,
            revision,
            projectId,
            error: err instanceof Error ? err.message : String(err),
            timestamp: Date.now(),
          });
        }
      }

      throw err;
    }
  }

  /** Fetches current stored revision for entity to prevent out-of-order execution. */
  protected abstract getCurrentRevision(
    entity: string,
    id: string,
  ): Promise<number | null>;

  /** Dispatches job to typed domain handler by job name. */
  protected abstract handleJob(
    jobName: string,
    data: WriteBehindJobPayload<T>,
  ): Promise<void>;
}
