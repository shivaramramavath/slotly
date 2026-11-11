// Abstract base cache class providing key construction, TTL jitter, and unified error handling.
import { Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import type { ICacheKeyFactory } from '../interfaces/cache-key-factory.interface';
import type { ICacheMetrics } from '../interfaces/cache-metrics.interface';

/** Abstract base cache class providing key construction, TTL jitter, and unified error handling. */
export abstract class BaseCache {
  protected readonly logger: Logger;

  constructor(
    protected readonly redis: Redis,
    protected readonly prefix: string,
    protected readonly defaultTtl: number = 3600,
    protected readonly keyFactory: ICacheKeyFactory,
    protected readonly metrics?: ICacheMetrics,
  ) {
    this.logger = new Logger(new.target.name);
    this.validatePrefix(prefix);
    this.validateTtl(defaultTtl);
  }

  /** Validates that the cache prefix is non-empty and contains valid identifier characters. */
  protected validatePrefix(prefix: string): void {
    if (!prefix || prefix.trim().length === 0) {
      throw new Error('Cache prefix must be a non-empty string');
    }
    if (/\s/.test(prefix)) {
      throw new Error(`Cache prefix cannot contain whitespace: "${prefix}"`);
    }
  }

  /** Validates that an identifier is non-empty. */
  protected validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Cache identifier must be a non-empty string');
    }
    if (/\s/.test(id)) {
      throw new Error(`Cache identifier cannot contain whitespace: "${id}"`);
    }
  }

  /** Validates that TTL is a positive integer. */
  public validateTtl(ttl: number): void {
    if (typeof ttl !== 'number' || isNaN(ttl) || ttl <= 0) {
      throw new Error(`Cache TTL must be a positive integer, received: ${ttl}`);
    }
  }

  /** Builds the standardized full cache key with optional tenant scope. */
  public buildKey(id: string, scope?: string): string {
    this.validateId(id);
    return this.keyFactory.buildKey(this.prefix, id, scope);
  }

  /** Calculates TTL with up to 10% random jitter to mitigate simultaneous expirations. */
  public buildTtl(ttl?: number): number {
    const baseTtl = ttl ?? this.defaultTtl;
    this.validateTtl(baseTtl);
    const jitter = Math.floor(Math.random() * (baseTtl * 0.1));
    return baseTtl + jitter;
  }

  /** Unified error handler supporting fail-open cache-aside policies and metrics tracking. */
  protected handleError(
    operation: string,
    key: string,
    error: unknown,
    options?: { failOpen?: boolean },
  ): void {
    const errMsg = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Cache [${this.prefix}] error during "${operation}" on key "${key}": ${errMsg}`,
    );
    this.metrics?.recordError(this.prefix, operation);

    const failOpen = options?.failOpen ?? true;
    if (!failOpen) {
      throw error;
    }
  }

  /** Fetches current namespace version counter for tenant group scope. */
  public async getNamespaceVersion(scope: string): Promise<number> {
    const nsKey = this.keyFactory.buildNamespaceKey(this.prefix, scope);
    try {
      const val = await this.redis.get(nsKey);
      return val ? parseInt(val, 10) : 1;
    } catch (err: unknown) {
      this.handleError('getNamespaceVersion', nsKey, err);
      return 1;
    }
  }

  /** Atomically increments the namespace version counter for tenant group invalidation. */
  public async bumpNamespaceVersion(scope: string): Promise<number> {
    const nsKey = this.keyFactory.buildNamespaceKey(this.prefix, scope);
    try {
      const exists = await this.redis.exists(nsKey);
      if (!exists) {
        await this.redis.set(nsKey, '1');
      }
      const nextVer = await this.redis.incr(nsKey);
      return nextVer;
    } catch (err: unknown) {
      this.handleError('bumpNamespaceVersion', nsKey, err);
      return 1;
    }
  }
}
