// Administrative service managing system health metrics, queue telemetry, and failed job retries.
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type {
  SystemHealthDto,
  QueuesHealthResponseDto,
  QueueHealthItem,
} from '@slotly/contracts';
import { Inject } from '@nestjs/common';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

/** Service monitoring platform health, subsystem statuses, and queue operational metrics. */
@Injectable()
export class AdminSystemService {
  private readonly logger = new Logger(AdminSystemService.name);
  private readonly queuesMap = new Map<string, Queue>();

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
    @Optional() @InjectQueue('builds') buildsQueue?: Queue,
    @Optional() @InjectQueue('exports') exportsQueue?: Queue,
    @Optional() @InjectQueue('notifications') notificationsQueue?: Queue,
    @Optional() @InjectQueue('analytics') analyticsQueue?: Queue,
    @Optional() @InjectQueue('audit') auditQueue?: Queue,
    @Optional() @InjectQueue('blueprint-write') blueprintQueue?: Queue,
  ) {
    if (buildsQueue) this.queuesMap.set('builds', buildsQueue);
    if (exportsQueue) this.queuesMap.set('exports', exportsQueue);
    if (notificationsQueue)
      this.queuesMap.set('notifications', notificationsQueue);
    if (analyticsQueue) this.queuesMap.set('analytics', analyticsQueue);
    if (auditQueue) this.queuesMap.set('audit', auditQueue);
    if (blueprintQueue) this.queuesMap.set('blueprint-write', blueprintQueue);
  }

  /**
   * Evaluates overall platform health across MongoDB, Redis, and message queues.
   */
  async getSystemHealth(): Promise<SystemHealthDto> {
    // 1. Check MongoDB
    const isMongoUp = this.mongoConnection.readyState === 1;

    // 2. Check Redis
    let isRedisUp = false;
    try {
      await this.cache.set('slotly:health:ping', 'pong', 5);
      const res = await this.cache.get<string>('slotly:health:ping');
      isRedisUp = res === 'pong';
    } catch {
      isRedisUp = false;
    }

    // 3. Check Queues
    const isQueuesUp = this.queuesMap.size > 0;
    const allOk = isMongoUp && isRedisUp && isQueuesUp;

    return {
      status: allOk ? 'ok' : 'error',
      services: {
        mongodb: isMongoUp ? 'up' : 'down',
        redis: isRedisUp ? 'up' : 'down',
        queues: isQueuesUp ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves operational health and job counters across all registered BullMQ queues.
   */
  async getQueuesHealth(): Promise<QueuesHealthResponseDto> {
    const queueItems: QueueHealthItem[] = [];

    for (const [name, queue] of this.queuesMap.entries()) {
      try {
        const [waiting, active, completed, failed, delayed, isPaused] =
          await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.isPaused(),
          ]);

        queueItems.push({
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: isPaused,
        });
      } catch (err: unknown) {
        this.logger.warn(`Failed reading metrics for queue ${name}: ${err}`);
        queueItems.push({
          name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        });
      }
    }

    return { queues: queueItems };
  }

  /**
   * Retries failed jobs in the specified BullMQ queue.
   */
  async retryFailedJobs(queueName: string): Promise<{ retried: number }> {
    const queue = this.queuesMap.get(queueName);
    if (!queue) {
      return { retried: 0 };
    }

    const failedJobs = await queue.getFailed(0, 100);
    let retried = 0;

    for (const job of failedJobs) {
      await job.retry();
      retried++;
    }

    return { retried };
  }
}
