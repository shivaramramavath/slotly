// Core implementation for cache.interface in server/src/common/cache.
/** Constant representing cache service. */
export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

/** Interface defining structure for cache service. */
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags?: string[],
  ): Promise<void>;
  del(key: string): Promise<void>;
  remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    tags?: string[],
  ): Promise<T>;
  invalidateTag(tag: string): Promise<void>;
}
