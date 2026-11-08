// Configuration factory for application-level settings.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Application namespace configuration factory. */
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env['PORT'] || String(DEFAULT_CONFIG.app.port), 10),
  nodeEnv: (process.env['NODE_ENV'] || DEFAULT_CONFIG.app.nodeEnv) as
    'development' | 'production' | 'test',
  clientUrl: process.env['CLIENT_URL'] || DEFAULT_CONFIG.app.clientUrl,
  corsOrigins: process.env['CORS_ORIGINS']
    ? process.env['CORS_ORIGINS'].split(',').map((s) => s.trim())
    : DEFAULT_CONFIG.app.corsOrigins,
  apiPrefix: process.env['API_PREFIX'] || DEFAULT_CONFIG.app.apiPrefix,
  logging: {
    enabled: DEFAULT_CONFIG.app.logging.enabled,
    level: (process.env['LOG_LEVEL'] || DEFAULT_CONFIG.app.logging.level) as
      'log' | 'error' | 'warn' | 'debug' | 'verbose',
  },
}));

/** Inferred TypeScript type for app namespace configuration. */
export type AppConfig = ConfigType<typeof appConfig>;
