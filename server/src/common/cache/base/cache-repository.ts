// Abstract entity cache-aside repository with negative caching, size capping, and single-flight protection.
import type Redis from 'ioredis';
import { BaseCacheObject } from './base-cache-object';
import { BaseCacheList } from './base-cache-list';
import type { ICacheReader } from '../interfaces/cache-reader.interface';
import type { ICacheWriter } from '../interfaces/cache-writer.interface';
import type { ICacheSerializer } from '../interfaces/cache-serializer.interface';
import type { ICacheKeyFactory } from '../interfaces/cache-key-factory.interface';
import type { ICacheMetrics } from '../interfaces/cache-metrics.interface';
import { DeserializationException } from '../serializers/json-cache.serializer';

/** Sentinel marker stored in Redis for negative caching to avoid repeating DB misses. */
const NEGATIVE_CACHE_SENTINEL = '__SLOTLY_NULL_SENTINEL__';

/** Abstract entity cache-aside repository with negative caching, size capping, and single-flight protection. */
export abstract class CacheRepository<T extends object, TId = string>
  extends BaseCacheObject
  implements ICacheReader<T, TId>, ICacheWriter<T, TId>
{
  protected readonly listCache?: BaseCacheList<T> | undefined;
  protected readonly negativeTtl: number;
  protected readonly maxBytes: number;
  protected readonly dateFields?: (keyof T)[] | undefined;
  protected readonly inFlightEntityLoads = new Map<string, Promise<T | null>>();

  constructor(
    redis: Redis,
    prefix: string,
    defaultTtl: number = 3600,
    keyFactory: ICacheKeyFactory,
    serializer: ICacheSerializer,
    metrics?: ICacheMetrics,
    options?: {
      negativeTtl?: number;
      maxBytes?: number;
      dateFields?: (keyof T)[];
      enableListCache?: boolean;
    },
  ) {
    super(redis, prefix, defaultTtl, keyFactory, serializer, metrics);
    this.negativeTtl = options?.negativeTtl ?? 30;
    this.maxBytes = options?.maxBytes ?? 262144; // 256 KB default
    this.dateFields = options?.dateFields;

    if (options?.enableListCache) {
      this.listCache = new BaseCacheList<T>(
        redis,
        `${prefix}:list`,
        defaultTtl,
        keyFactory,
        serializer,
        metrics,
      );
    }
  }

  /** Normalizes the given ID to a clean string format. */
  protected toIdString(id: TId): string {
    return String(id);
  }

  /** Retrieves an entity from cache, honoring negative cache markers. */
  async get(id: TId): Promise<T | null> {
    const idStr = this.toIdString(id);
    const key = this.buildKey(idStr);
    try {
      const raw = await this.redis.get(key);
      if (!raw) {
        this.metrics?.recordMiss(this.prefix);
        return null;
      }

      if (raw === NEGATIVE_CACHE_SENTINEL) {
        this.metrics?.recordNegativeHit(this.prefix);
        return null;
      }

      const entity = this.serializer.deserialize<T>(raw, this.dateFields);
      this.metrics?.recordHit(this.prefix);
      return entity;
    } catch (err: unknown) {
      if (err instanceof DeserializationException) {
        this.logger.warn(
          `Corrupted cache entity payload on key "${key}". Deleting key.`,
        );
        try {
          await this.redis.del(key);
        } catch {
          // ignore error on deletion
        }
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      this.handleError('get', key, err, { failOpen: true });
      return null;
    }
  }

  /** Stores an entity in cache, enforcing size limits and TTL jitter. */
  async set(id: TId, entity: T, ttl?: number): Promise<void> {
    const idStr = this.toIdString(id);
    const key = this.buildKey(idStr);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const serialized = this.serializer.serialize(entity);
      if (Buffer.byteLength(serialized, 'utf8') > this.maxBytes) {
        this.logger.warn(
          `Skipping cache for entity [${this.prefix}:${idStr}]: payload size (${Buffer.byteLength(serialized, 'utf8')} bytes) exceeds limit ${this.maxBytes} bytes`,
        );
        return;
      }
      await this.redis.set(key, serialized, 'EX', effectiveTtl);
    } catch (err: unknown) {
      this.handleError('set', key, err, { failOpen: true });
    }
  }

  /**
   * Loads an entity from cache or falls back to the loader function.
   * Utilizes in-flight single-flight promises and negative caching.
   */
  async getOrLoad(
    id: TId,
    loader: () => Promise<T | null>,
    ttl?: number,
  ): Promise<T | null> {
    const idStr = this.toIdString(id);
    const key = this.buildKey(idStr);

    // 1. Check existing cache or negative sentinel
    const cached = await this.get(id);
    if (cached !== null) {
      return cached;
    }

    // Check if it was a negative hit
    try {
      const raw = await this.redis.get(key);
      if (raw === NEGATIVE_CACHE_SENTINEL) {
        return null;
      }
    } catch {
      // ignore
    }

    // 2. Single-flight deduplication
    if (this.inFlightEntityLoads.has(key)) {
      return this.inFlightEntityLoads.get(key)!;
    }

    const loadPromise = (async () => {
      try {
        const loaded = await loader();
        if (loaded === null) {
          // Negative caching: store sentinel with short TTL
          try {
            await this.redis.set(
              key,
              NEGATIVE_CACHE_SENTINEL,
              'EX',
              this.negativeTtl,
            );
          } catch (err: unknown) {
            this.handleError('setNegativeCache', key, err, { failOpen: true });
          }
          return null;
        }

        await this.set(id, loaded, ttl);
        return loaded;
      } finally {
        this.inFlightEntityLoads.delete(key);
      }
    })();

    this.inFlightEntityLoads.set(key, loadPromise);
    return loadPromise;
  }

  /** Invalidates a single entity from cache and removes negative markers. */
  async invalidate(id: TId): Promise<void> {
    const idStr = this.toIdString(id);
    const key = this.buildKey(idStr);
    try {
      await this.redis.del(key);
    } catch (err: unknown) {
      this.handleError('invalidate', key, err, { failOpen: true });
    }
  }

  /** Invalidates multiple entities in batch. */
  async invalidateMany(ids: TId[]): Promise<void> {
    if (ids.length === 0) return;
    const keys = ids.map((id) => this.buildKey(this.toIdString(id)));
    try {
      await this.redis.del(...keys);
    } catch (err: unknown) {
      this.handleError('invalidateMany', keys.join(','), err, {
        failOpen: true,
      });
    }
  }

  /** Delegates to composed list cache when available. */
  getListCache(): BaseCacheList<T> | undefined {
    return this.listCache;
  }
}
