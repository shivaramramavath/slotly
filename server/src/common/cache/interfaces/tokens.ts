// Injection tokens for cache layer infrastructure and swappable strategies.

/** Injection token for Redis client instance. */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/** Injection token for cache serializer implementation. */
export const CACHE_SERIALIZER = Symbol('CACHE_SERIALIZER');

/** Injection token for cache metrics reporter. */
export const CACHE_METRICS = Symbol('CACHE_METRICS');

/** Injection token for cache key and namespace builder factory. */
export const CACHE_KEY_FACTORY = Symbol('CACHE_KEY_FACTORY');
