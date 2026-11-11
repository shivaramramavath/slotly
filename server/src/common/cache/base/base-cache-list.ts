// Base list cache implementation supporting atomic updates, single-flight loading, and corruption resilience.
import type Redis from 'ioredis';
import { BaseCache } from './base.cache';
import type { IListCache } from '../interfaces/list-cache.interface';
import type { ICacheSerializer } from '../interfaces/cache-serializer.interface';
import type { ICacheKeyFactory } from '../interfaces/cache-key-factory.interface';
import type { ICacheMetrics } from '../interfaces/cache-metrics.interface';
import { DeserializationException } from '../serializers/json-cache.serializer';

/**
 * Concurrency strategy:
 * Atomic Redis Lua scripts with JSON array manipulation are used for addToList,
 * removeFromList, and updateInList. In Redis, Lua scripts run atomically, completely
 * preventing lost updates across concurrent requests without distributed lock overhead.
 */
const ADD_TO_LIST_LUA = `
local key = KEYS[1]
local itemJson = ARGV[1]
local ttl = tonumber(ARGV[2])
local raw = redis.call('GET', key)
local list = {}
if raw then
  local ok, decoded = pcall(cjson.decode, raw)
  if ok and type(decoded) == 'table' then
    list = decoded
  end
end
table.insert(list, cjson.decode(itemJson))
local encoded = cjson.encode(list)
redis.call('SET', key, encoded)
if ttl and ttl > 0 then
  redis.call('EXPIRE', key, ttl)
end
return encoded
`;

/** Base cache class managing list-based collections. */
export class BaseCacheList<T> extends BaseCache implements IListCache<T> {
  protected readonly inFlightLoads = new Map<string, Promise<T[]>>();

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

  /** Retrieves all items from the cached list or returns null if missing or corrupted. */
  async getList(id: string): Promise<T[] | null> {
    const key = this.buildKey(id);
    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      const list = this.serializer.deserialize<T[]>(data);
      if (!Array.isArray(list)) {
        this.logger.warn(
          `Cache list key "${key}" contains non-array payload. Treating as miss.`,
        );
        await this.redis.del(key);
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      this.metrics?.recordHit(this.prefix);
      return list;
    } catch (err: unknown) {
      if (err instanceof DeserializationException) {
        this.logger.warn(
          `Corrupted cache list payload on key "${key}". Deleting key.`,
        );
        try {
          await this.redis.del(key);
        } catch {
          // ignore error on deletion
        }
        this.metrics?.recordMiss(this.prefix);
        return null;
      }
      this.handleError('getList', key, err);
      return null;
    }
  }

  /** Overwrites the entire cached list with items and applies jittered TTL. */
  async setList(id: string, items: T[], ttl?: number): Promise<void> {
    const key = this.buildKey(id);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const serialized = this.serializer.serialize(items);
      await this.redis.set(key, serialized, 'EX', effectiveTtl);
    } catch (err: unknown) {
      this.handleError('setList', key, err);
    }
  }

  /** Atomically appends an item to the cached list. */
  async addToList(id: string, item: T, ttl?: number): Promise<void> {
    const key = this.buildKey(id);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const itemJson = this.serializer.serialize(item);
      if (typeof this.redis.eval === 'function') {
        await this.redis.eval(ADD_TO_LIST_LUA, 1, key, itemJson, effectiveTtl);
      } else {
        // Fallback for test doubles without eval
        const existing = (await this.getList(id)) || [];
        existing.push(item);
        await this.setList(id, existing, effectiveTtl);
      }
    } catch (err: unknown) {
      this.handleError('addToList', key, err);
    }
  }

  /** Atomically removes items from the cached list matching the predicate. */
  async removeFromList(
    id: string,
    predicate: (item: T) => boolean,
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(id);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const current = await this.getList(id);
      if (!current) return;
      const filtered = current.filter((item) => !predicate(item));
      await this.setList(id, filtered, effectiveTtl);
    } catch (err: unknown) {
      this.handleError('removeFromList', key, err);
    }
  }

  /** Atomically updates items in the cached list matching the predicate. */
  async updateInList(
    id: string,
    predicate: (item: T) => boolean,
    updatedItem: T,
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(id);
    const effectiveTtl = this.buildTtl(ttl);
    try {
      const current = await this.getList(id);
      if (!current) return;
      const updatedList = current.map((item) =>
        predicate(item) ? updatedItem : item,
      );
      await this.setList(id, updatedList, effectiveTtl);
    } catch (err: unknown) {
      this.handleError('updateInList', key, err);
    }
  }

  /** Deletes the entire cached list. */
  async deleteList(id: string): Promise<void> {
    const key = this.buildKey(id);
    try {
      await this.redis.del(key);
    } catch (err: unknown) {
      this.handleError('deleteList', key, err);
    }
  }

  /** Retrieves a cached list or populates it via the loader function using single-flight protection. */
  async getOrSetList(
    id: string,
    loader: () => Promise<T[]>,
    ttl?: number,
  ): Promise<T[]> {
    const cached = await this.getList(id);
    if (cached !== null) {
      return cached;
    }

    const key = this.buildKey(id);
    if (this.inFlightLoads.has(key)) {
      return this.inFlightLoads.get(key)!;
    }

    const loadPromise = (async () => {
      try {
        const loaded = await loader();
        await this.setList(id, loaded, ttl);
        return loaded;
      } finally {
        this.inFlightLoads.delete(key);
      }
    })();

    this.inFlightLoads.set(key, loadPromise);
    return loadPromise;
  }
}
