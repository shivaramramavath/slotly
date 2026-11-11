// Interface defining contract for cache writing, updating, and invalidation.

/** Interface defining contract for cache writing, updating, and invalidation. */
export interface ICacheWriter<T, TId = string> {
  /** Writes an entity to cache with an optional TTL. */
  set(id: TId, entity: T, ttl?: number): Promise<void>;

  /** Invalidates a cached entity by its id. */
  invalidate(id: TId): Promise<void>;

  /** Invalidates multiple cached entities by their ids. */
  invalidateMany(ids: TId[]): Promise<void>;
}
