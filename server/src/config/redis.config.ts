// Configuration factory for Redis connection settings.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Redis namespace configuration factory. */
export const redisConfig = registerAs('redis', () => ({
  host: process.env['REDIS_HOST'] || DEFAULT_CONFIG.redis.host,
  port: parseInt(
    process.env['REDIS_PORT'] || String(DEFAULT_CONFIG.redis.port),
    10,
  ),
  password: process.env['REDIS_PASSWORD'] || DEFAULT_CONFIG.redis.password,
  db: parseInt(process.env['REDIS_DB'] || String(DEFAULT_CONFIG.redis.db), 10),
  tls: process.env['REDIS_TLS'] === 'true' || DEFAULT_CONFIG.redis.tls,
}));

/** Inferred TypeScript type for redis namespace configuration. */
export type RedisConfig = ConfigType<typeof redisConfig>;
