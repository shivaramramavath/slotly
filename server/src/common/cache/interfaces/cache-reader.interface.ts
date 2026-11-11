// Interface defining contract for cache reading and cache-aside loading.

/** Interface defining contract for cache reading and cache-aside loading. */
export interface ICacheReader<T, TId = string> {
  /** Retrieves an entity by id from cache or returns null. */
  get(id: TId): Promise<T | null>;

  /** Retrieves an entity from cache or executes loader function to populate it. */
  getOrLoad(
    id: TId,
    loader: () => Promise<T | null>,
    ttl?: number,
  ): Promise<T | null>;
}
