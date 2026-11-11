// Base object cache implementation supporting partial field updates, date revival, and single-flight loading.
import type Redis from 'ioredis';
import { BaseCache } from './base.cache';
import type { ICacheSerializer } from '../interfaces/cache-serializer.interface';
import type { ICacheKeyFactory } from '../interfaces/cache-key-factory.interface';
import type { ICacheMetrics } from '../interfaces/cache-metrics.interface';
import { DeserializationException } from '../serializers/json-cache.serializer';

const UPDATE_FIELDS_LUA = `
local key = KEYS[1]
if redis.call('EXISTS', key) == 0 then
  return 0
end
local raw = redis.call('GET', key)
local ok, obj = pcall(cjson.decode, raw)
if not ok or type(obj) ~= 'table' then
  return 0
end
local updates = cjson.decode(ARGV[1])
for k, v in pairs(updates) do
  obj[k] = v
end
local encoded = cjson.encode(obj)
redis.call('SET', key, encoded, 'KEEPTTL')
return 1
`;

const SET_FIELD_LUA = `
local key = KEYS[1]
if redis.call('EXISTS', key) == 0 then
  return 0
end
local raw = redis.call('GET', key)
local ok, obj = pcall(cjson.decode, raw)
if not ok or type(obj) ~= 'table' then
  return 0
end
obj[ARGV[1]] = cjson.decode(ARGV[2])
local encoded = cjson.encode(obj)
redis.call('SET', key, encoded, 'KEEPTTL')
return 1
`;

/** Base cache class managing structured object storage with corruption resilience. */
export class BaseCacheObject extends BaseCache {
  protected readonly inFlightObjectLoads = new Map<string, Promise<unknown>>();

  constructor(
    redis: Redis,
    prefix: string,
    defaultTtl: number = 3600,
    keyFactory: ICacheKeyFactory,
    protected readonly serializer: ICacheSerializer,
    metrics?: ICacheMetrics,
  ) {
    super(redis, prefix, defaultTtl, keyFactory, metrics);
  }

  /** Stores a structured object in the cache with jittered expiration. */
  async setObject<T extends object>(
    id: string,
    obj: T,
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(id);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const data = this.serializer.serialize(obj);
      await this.redis.set(key, data, 'EX', effectiveTtl);
    } catch (err: unknown) {
      this.handleError('setObject', key, err);
    }
  }

  /** Retrieves a structured object from cache with automatic date revivers. */
  async getObject<T extends object>(
    id: string,
    dateFields?: (keyof T)[],
  ): Promise<T | null> {
    const key = this.buildKey(id);
    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      const obj = this.serializer.deserialize<T>(data, dateFields);
      if (typeof obj !== 'object' || obj === null) {
        this.logger.warn(
          `Cache object key "${key}" contains invalid shape. Treating as miss.`,
        );
        await this.redis.del(key);
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      this.metrics?.recordHit(this.prefix);
      return obj;
    } catch (err: unknown) {
      if (err instanceof DeserializationException) {
        this.logger.warn(
          `Corrupted cache object on key "${key}". Deleting key.`,
        );
        try {
          await this.redis.del(key);
        } catch {
          // ignore error on deletion
        }
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      this.handleError('getObject', key, err);
      return null;
    }
  }

  /**
   * Updates partial fields in an existing cached object.
   * Bug 1 fix: Only writes if the key already exists to prevent creating partial/incomplete objects.
   */
  async updateFields<T extends object>(
    id: string,
    fields: Partial<T>,
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(id);
    try {
      const serializedFields = this.serializer.serialize(fields);
      if (typeof this.redis.eval === 'function') {
        const result = await this.redis.eval(
          UPDATE_FIELDS_LUA,
          1,
          key,
          serializedFields,
        );
        if (result === 0) {
          // Key does not exist; do nothing so next read triggers a fresh database load
          return;
        }
      } else {
        // Fallback for test doubles
        const exists = await this.redis.exists(key);
        if (!exists) return;
        const current = await this.getObject<T>(id);
        if (!current) return;
        const merged = { ...current, ...fields };
        await this.setObject(id, merged, ttl);
      }
    } catch (err: unknown) {
      this.handleError('updateFields', key, err);
    }
  }

  /**
   * Sets a single field on an existing cached object.
   * Bug 1 fix: Only writes if the key already exists to prevent creating partial objects.
   */
  async setField<T extends object, K extends keyof T>(
    id: string,
    field: K,
    value: T[K],
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(id);
    try {
      const serializedValue = this.serializer.serialize(value);
      if (typeof this.redis.eval === 'function') {
        const result = await this.redis.eval(
          SET_FIELD_LUA,
          1,
          key,
          String(field),
          serializedValue,
        );
        if (result === 0) {
          // Key does not exist; do nothing
          return;
        }
      } else {
        const exists = await this.redis.exists(key);
        if (!exists) return;
        const current = await this.getObject<T>(id);
        if (!current) return;
        (current as Record<string, unknown>)[String(field)] = value;
        await this.setObject(id, current, ttl);
      }
    } catch (err: unknown) {
      this.handleError('setField', key, err);
    }
  }

  /** Deletes a single field from an existing cached object. */
  async deleteField<T extends object>(
    id: string,
    field: string,
  ): Promise<void> {
    const key = this.buildKey(id);
    try {
      const current = await this.getObject<T>(id);
      if (!current) return;
      delete (current as Record<string, unknown>)[field];
      await this.setObject(id, current);
    } catch (err: unknown) {
      this.handleError('deleteField', key, err);
    }
  }

  /** Deletes the entire cached object. */
  async deleteObject(id: string): Promise<void> {
    const key = this.buildKey(id);
    try {
      await this.redis.del(key);
    } catch (err: unknown) {
      this.handleError('deleteObject', key, err);
    }
  }

  /** Retrieves an object from cache or executes the loader using single-flight deduplication. */
  async getOrSetObject<T extends object>(
    id: string,
    loader: () => Promise<T | null>,
    ttl?: number,
    dateFields?: (keyof T)[],
  ): Promise<T | null> {
    const cached = await this.getObject<T>(id, dateFields);
    if (cached !== null) {
      return cached;
    }

    const key = this.buildKey(id);
    if (this.inFlightObjectLoads.has(key)) {
      return (await this.inFlightObjectLoads.get(key)!) as T | null;
    }

    const loadPromise = (async () => {
      try {
        const loaded = await loader();
        if (loaded !== null) {
          await this.setObject(id, loaded, ttl);
        }
        return loaded;
      } finally {
        this.inFlightObjectLoads.delete(key);
      }
    })();

    this.inFlightObjectLoads.set(key, loadPromise);
    return loadPromise;
  }
}
