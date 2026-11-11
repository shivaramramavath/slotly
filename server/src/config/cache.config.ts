// Configuration factory for cache TTLs, eviction policies, and size thresholds.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Cache namespace configuration factory. */
export const cacheConfig = registerAs('cache', () => ({
  defaultTtl: parseInt(
    process.env['CACHE_DEFAULT_TTL'] || String(DEFAULT_CONFIG.cache.defaultTtl),
    10,
  ),
  negativeTtl: parseInt(
    process.env['CACHE_NEGATIVE_TTL'] ||
      String(DEFAULT_CONFIG.cache.negativeTtl),
    10,
  ),
  maxBytes: parseInt(
    process.env['CACHE_MAX_BYTES'] || String(DEFAULT_CONFIG.cache.maxBytes),
    10,
  ),
  keyPrefixEnv:
    process.env['CACHE_KEY_PREFIX_ENV'] ||
    process.env['NODE_ENV'] ||
    DEFAULT_CONFIG.cache.keyPrefixEnv,
  schemaVersion: parseInt(
    process.env['CACHE_SCHEMA_VERSION'] ||
      String(DEFAULT_CONFIG.cache.schemaVersion),
    10,
  ),
  blueprintTtl: parseInt(
    process.env['CACHE_BLUEPRINT_TTL'] ||
      String(DEFAULT_CONFIG.cache.blueprintTtl),
    10,
  ),
  readinessTtl: parseInt(
    process.env['CACHE_READINESS_TTL'] ||
      String(DEFAULT_CONFIG.cache.readinessTtl),
    10,
  ),
  treeTtl: parseInt(
    process.env['CACHE_TREE_TTL'] || String(DEFAULT_CONFIG.cache.treeTtl),
    10,
  ),
  slotsTtl: parseInt(
    process.env['CACHE_SLOTS_TTL'] || String(DEFAULT_CONFIG.cache.slotsTtl),
    10,
  ),
  userProfileTtl: parseInt(
    process.env['CACHE_USER_PROFILE_TTL'] ||
      String(DEFAULT_CONFIG.cache.userProfileTtl),
    10,
  ),
  projectListTtl: parseInt(
    process.env['CACHE_PROJECT_LIST_TTL'] ||
      String(DEFAULT_CONFIG.cache.projectListTtl),
    10,
  ),
  libraryListTtl: parseInt(
    process.env['CACHE_LIBRARY_LIST_TTL'] ||
      String(DEFAULT_CONFIG.cache.libraryListTtl),
    10,
  ),
  analyticsTtl: parseInt(
    process.env['CACHE_ANALYTICS_TTL'] ||
      String(DEFAULT_CONFIG.cache.analyticsTtl),
    10,
  ),
  notificationsTtl: parseInt(
    process.env['CACHE_NOTIFICATIONS_TTL'] ||
      String(DEFAULT_CONFIG.cache.notificationsTtl),
    10,
  ),
}));

/** Inferred TypeScript type for cache namespace configuration. */
export type CacheConfig = ConfigType<typeof cacheConfig>;
