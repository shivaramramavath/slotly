// Test helper module providing preconfigured ConfigModule instances for unit and integration testing.
import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  sessionConfig,
  authConfig,
  oauthConfig,
  emailConfig,
  cacheConfig,
  queueConfig,
  groqConfig,
  validateEnv,
  DEFAULT_CONFIG,
} from '../src/config';

/** Creates a testing ConfigModule pre-populated with safe defaults and optional overrides. */
export function createTestConfigModule(
  overrides: Record<string, unknown> = {},
): Promise<DynamicModule> {
  const testEnv: Record<string, unknown> = {
    NODE_ENV: 'test',
    PORT: DEFAULT_CONFIG.app.port,
    CLIENT_URL: DEFAULT_CONFIG.app.clientUrl,
    DATABASE_URL: DEFAULT_CONFIG.database.uri,
    REDIS_HOST: DEFAULT_CONFIG.redis.host,
    REDIS_PORT: DEFAULT_CONFIG.redis.port,
    JWT_ACCESS_SECRET: DEFAULT_CONFIG.jwt.access.secret,
    JWT_REFRESH_SECRET: DEFAULT_CONFIG.jwt.refresh.secret,
    EMAIL_DRIVER: 'log',
    ...overrides,
  };

  return ConfigModule.forRoot({
    isGlobal: true,
    cache: false,
    ignoreEnvFile: true,
    load: [
      appConfig,
      databaseConfig,
      redisConfig,
      jwtConfig,
      sessionConfig,
      authConfig,
      oauthConfig,
      emailConfig,
      cacheConfig,
      queueConfig,
      groqConfig,
    ],
    validate: (raw: Record<string, unknown>) =>
      validateEnv({ ...testEnv, ...raw }),
  });
}
