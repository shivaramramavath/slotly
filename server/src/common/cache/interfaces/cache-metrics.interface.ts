// Interface defining telemetry and metrics tracking for cache hits, misses, and errors.

/** Interface defining telemetry and metrics tracking for cache hits, misses, and errors. */
export interface ICacheMetrics {
  /** Records a successful cache hit event for an entity or collection. */
  recordHit(cacheName: string): void;

  /** Records a cache miss event where data had to be loaded from database. */
  recordMiss(cacheName: string): void;

  /** Records an error encountered during cache interaction. */
  recordError(cacheName: string, op: string): void;

  /** Records a negative hit event where a missing entity marker was found. */
  recordNegativeHit(cacheName: string): void;

  /** Records lifecycle event for write-behind persistence. */
  recordWriteBehind(
    cacheName: string,
    event: 'enqueued' | 'persisted' | 'failed',
  ): void;
}
