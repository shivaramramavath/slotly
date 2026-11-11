// Default retry, backoff, and dead-letter retention policies for write-behind jobs.

/** Standard defaults for BullMQ write-behind job options. */
export const WRITE_BEHIND_JOB_DEFAULTS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 1000,
  },
  removeOnFail: {
    age: 86400 * 7, // 7 days retained for dead-letter diagnostics
  },
};
