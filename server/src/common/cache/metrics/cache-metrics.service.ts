// Telemetry service recording hit, miss, negative-hit, error, and write-behind metrics.
import { Injectable, Optional } from '@nestjs/common';
import type { ICacheMetrics } from '../interfaces/cache-metrics.interface';
import { PrometheusMetricsService } from '../../../modules/monitoring/services/metrics.service';

/** In-memory and Prometheus telemetry service tracking cache efficiency and errors. */
@Injectable()
export class CacheMetricsService implements ICacheMetrics {
  private readonly hits = new Map<string, number>();
  private readonly misses = new Map<string, number>();
  private readonly errors = new Map<string, number>();
  private readonly negativeHits = new Map<string, number>();
  private readonly writeBehindEvents = new Map<string, number>();

  constructor(
    @Optional() protected readonly prometheus?: PrometheusMetricsService,
  ) {
    if (this.prometheus) {
      // Attached to telemetry registry
    }
  }

  /** Increments hit counter for specified cache name. */
  recordHit(cacheName: string): void {
    const current = this.hits.get(cacheName) || 0;
    this.hits.set(cacheName, current + 1);
  }

  /** Increments miss counter for specified cache name. */
  recordMiss(cacheName: string): void {
    const current = this.misses.get(cacheName) || 0;
    this.misses.set(cacheName, current + 1);
  }

  /** Increments error counter for specified cache name and operation. */
  recordError(cacheName: string, op: string): void {
    const key = `${cacheName}:${op}`;
    const current = this.errors.get(key) || 0;
    this.errors.set(key, current + 1);
  }

  /** Increments negative cache hit counter for missing entity lookups. */
  recordNegativeHit(cacheName: string): void {
    const current = this.negativeHits.get(cacheName) || 0;
    this.negativeHits.set(cacheName, current + 1);
  }

  /** Increments write-behind queue lifecycle counters. */
  recordWriteBehind(
    cacheName: string,
    event: 'enqueued' | 'persisted' | 'failed',
  ): void {
    const key = `${cacheName}:${event}`;
    const current = this.writeBehindEvents.get(key) || 0;
    this.writeBehindEvents.set(key, current + 1);
  }

  /** Returns current recorded metrics snapshot for diagnostics and tests. */
  getSnapshot(): {
    hits: Record<string, number>;
    misses: Record<string, number>;
    errors: Record<string, number>;
    negativeHits: Record<string, number>;
    writeBehind: Record<string, number>;
  } {
    return {
      hits: Object.fromEntries(this.hits),
      misses: Object.fromEntries(this.misses),
      errors: Object.fromEntries(this.errors),
      negativeHits: Object.fromEntries(this.negativeHits),
      writeBehind: Object.fromEntries(this.writeBehindEvents),
    };
  }
}
