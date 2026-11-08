// Configuration factory for MongoDB database settings. Transactions require a replica set (e.g. rs0).
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Strips directConnection option if using SRV (Atlas) since MongoDB driver forbids directConnection with SRV. */
function sanitizeMongoUri(rawUri: string): string {
  if (rawUri.startsWith('mongodb+srv://')) {
    let clean = rawUri.replace(/([?&])directConnection=(true|false)&?/gi, '$1');
    clean = clean.replace(/\?&/, '?').replace(/[?&]$/, '');
    return clean;
  }
  return rawUri;
}

/** Database namespace configuration factory. Note: Transactions require MongoDB replica set. */
export const databaseConfig = registerAs('database', () => {
  const rawUri =
    process.env['DATABASE_URL'] ||
    process.env['MONGODB_URI'] ||
    DEFAULT_CONFIG.database.uri;

  return {
    uri: sanitizeMongoUri(rawUri),
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
  };
});

/** Inferred TypeScript type for database namespace configuration. */
export type DatabaseConfig = ConfigType<typeof databaseConfig>;
