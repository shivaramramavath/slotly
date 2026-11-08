// Configuration factory for cache TTLs and eviction policies.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Cache namespace configuration factory. */
export const cacheConfig = registerAs('cache', () => ({
  defaultTtl: parseInt(
    process.env['CACHE_DEFAULT_TTL'] || String(DEFAULT_CONFIG.cache.defaultTtl),
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
}));

/** Inferred TypeScript type for cache namespace configuration. */
export type CacheConfig = ConfigType<typeof cacheConfig>;
