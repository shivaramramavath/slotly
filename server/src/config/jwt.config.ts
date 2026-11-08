// Configuration factory for JWT authentication token settings.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** JWT namespace configuration factory. Note: Password reset tokens are one-time tokens stored in Redis. */
export const jwtConfig = registerAs('jwt', () => ({
  access: {
    secret:
      process.env['JWT_ACCESS_SECRET'] || DEFAULT_CONFIG.jwt.access.secret,
    expiresIn:
      process.env['JWT_ACCESS_EXPIRES_IN'] ||
      DEFAULT_CONFIG.jwt.access.expiresIn,
  },
  refresh: {
    secret:
      process.env['JWT_REFRESH_SECRET'] || DEFAULT_CONFIG.jwt.refresh.secret,
    expiresIn:
      process.env['JWT_REFRESH_EXPIRES_IN'] ||
      DEFAULT_CONFIG.jwt.refresh.expiresIn,
  },
}));

/** Inferred TypeScript type for jwt namespace configuration. */
export type JwtConfig = ConfigType<typeof jwtConfig>;
