// Configuration factory for BullMQ job queue parameters and worker concurrency.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Queue namespace configuration factory. */
export const queueConfig = registerAs('queue', () => ({
  prefix: process.env['QUEUE_PREFIX'] || DEFAULT_CONFIG.queue.prefix,
  attempts: parseInt(
    process.env['QUEUE_ATTEMPTS'] || String(DEFAULT_CONFIG.queue.attempts),
    10,
  ),
  backoffDelay: parseInt(
    process.env['QUEUE_BACKOFF_DELAY'] ||
      String(DEFAULT_CONFIG.queue.backoffDelay),
    10,
  ),
  removeOnComplete: parseInt(
    process.env['QUEUE_REMOVE_ON_COMPLETE'] ||
      String(DEFAULT_CONFIG.queue.removeOnComplete),
    10,
  ),
  removeOnFail: parseInt(
    process.env['QUEUE_REMOVE_ON_FAIL'] ||
      String(DEFAULT_CONFIG.queue.removeOnFail),
    10,
  ),
  concurrency: {
    writeBehind: parseInt(
      process.env['QUEUE_CONCURRENCY_WRITE_BEHIND'] ||
        String(DEFAULT_CONFIG.queue.concurrency.writeBehind),
      10,
    ),
    solver: parseInt(
      process.env['QUEUE_CONCURRENCY_SOLVER'] ||
        String(DEFAULT_CONFIG.queue.concurrency.solver),
      10,
    ),
    audit: parseInt(
      process.env['QUEUE_CONCURRENCY_AUDIT'] ||
        String(DEFAULT_CONFIG.queue.concurrency.audit),
      10,
    ),
    notifications: parseInt(
      process.env['QUEUE_CONCURRENCY_NOTIFICATIONS'] ||
        String(DEFAULT_CONFIG.queue.concurrency.notifications),
      10,
    ),
    export: parseInt(
      process.env['QUEUE_CONCURRENCY_EXPORT'] ||
        String(DEFAULT_CONFIG.queue.concurrency.export),
      10,
    ),
  },
}));

/** Inferred TypeScript type for queue namespace configuration. */
export type QueueConfig = ConfigType<typeof queueConfig>;
