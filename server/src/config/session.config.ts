// Configuration factory for user sessions and refresh token cookie settings.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Session namespace configuration factory. */
export const sessionConfig = registerAs('session', () => ({
  ttl: parseInt(
    process.env['SESSION_TTL'] || String(DEFAULT_CONFIG.session.ttl),
    10,
  ),
  maxLifetime: parseInt(
    process.env['SESSION_MAX_LIFETIME'] ||
      String(DEFAULT_CONFIG.session.maxLifetime),
    10,
  ),
  cookie: {
    name:
      process.env['SESSION_COOKIE_NAME'] || DEFAULT_CONFIG.session.cookie.name,
    sameSite: (process.env['SESSION_COOKIE_SAME_SITE'] ||
      DEFAULT_CONFIG.session.cookie.sameSite) as 'lax' | 'strict' | 'none',
    secure:
      process.env['SESSION_COOKIE_SECURE'] !== undefined
        ? process.env['SESSION_COOKIE_SECURE'] === 'true'
        : process.env['NODE_ENV'] === 'production',
    domain: process.env['SESSION_COOKIE_DOMAIN'] || undefined,
  },
}));

/** Inferred TypeScript type for session namespace configuration. */
export type SessionConfig = ConfigType<typeof sessionConfig>;
