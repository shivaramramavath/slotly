// Configuration factory for MongoDB database settings. Transactions require a replica set (e.g. rs0).
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Database namespace configuration factory. Note: Transactions require MongoDB replica set. */
export const databaseConfig = registerAs('database', () => ({
  uri: process.env['DATABASE_URL'] || DEFAULT_CONFIG.database.uri,
  options: {
    serverSelectionTimeoutMS: parseInt(
      process.env['DATABASE_TIMEOUT_MS'] ||
        String(DEFAULT_CONFIG.database.serverSelectionTimeoutMS),
      10,
    ),
    maxPoolSize: parseInt(
      process.env['DATABASE_MAX_POOL_SIZE'] ||
        String(DEFAULT_CONFIG.database.maxPoolSize),
      10,
    ),
  },
}));

/** Inferred TypeScript type for database namespace configuration. */
export type DatabaseConfig = ConfigType<typeof databaseConfig>;
