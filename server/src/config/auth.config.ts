// Configuration factory for authentication policies, throttling, OTP, and Argon2 parameters.
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Authentication namespace configuration factory. */
export const authConfig = registerAs('auth', () => ({
  nodeEnv: (process.env['NODE_ENV'] || DEFAULT_CONFIG.app.nodeEnv) as
    'development' | 'production' | 'test',
  argon2: {
    memoryCost: parseInt(
      process.env['ARGON2_MEMORY_COST'] ||
        String(DEFAULT_CONFIG.auth.argon2.memoryCost),
      10,
    ),
    timeCost: parseInt(
      process.env['ARGON2_TIME_COST'] ||
        String(DEFAULT_CONFIG.auth.argon2.timeCost),
      10,
    ),
    parallelism: parseInt(
      process.env['ARGON2_PARALLELISM'] ||
        String(DEFAULT_CONFIG.auth.argon2.parallelism),
      10,
    ),
  },
  otp: {
    length: parseInt(
      process.env['OTP_LENGTH'] || String(DEFAULT_CONFIG.auth.otp.length),
      10,
    ),
    ttl: parseInt(
      process.env['OTP_TTL'] || String(DEFAULT_CONFIG.auth.otp.ttl),
      10,
    ),
    cooldown: parseInt(
      process.env['OTP_COOLDOWN'] || String(DEFAULT_CONFIG.auth.otp.cooldown),
      10,
    ),
    maxAttempts: parseInt(
      process.env['OTP_MAX_ATTEMPTS'] ||
        String(DEFAULT_CONFIG.auth.otp.maxAttempts),
      10,
    ),
    allowDevMasterOtp:
      process.env['ENABLE_DEV_MASTER_OTP'] === 'true' ||
      DEFAULT_CONFIG.auth.otp.allowDevMasterOtp,
  },
  stepUpWindow: parseInt(
    process.env['STEP_UP_WINDOW'] || String(DEFAULT_CONFIG.auth.stepUpWindow),
    10,
  ),
  throttle: {
    login: {
      limit: parseInt(
        process.env['THROTTLE_LOGIN_LIMIT'] ||
          String(DEFAULT_CONFIG.auth.throttle.login.limit),
        10,
      ),
      ttl: parseInt(
        process.env['THROTTLE_LOGIN_TTL'] ||
          String(DEFAULT_CONFIG.auth.throttle.login.ttl),
        10,
      ),
    },
    otp: {
      limit: parseInt(
        process.env['THROTTLE_OTP_LIMIT'] ||
          String(DEFAULT_CONFIG.auth.throttle.otp.limit),
        10,
      ),
      ttl: parseInt(
        process.env['THROTTLE_OTP_TTL'] ||
          String(DEFAULT_CONFIG.auth.throttle.otp.ttl),
        10,
      ),
    },
    refresh: {
      limit: parseInt(
        process.env['THROTTLE_REFRESH_LIMIT'] ||
          String(DEFAULT_CONFIG.auth.throttle.refresh.limit),
        10,
      ),
      ttl: parseInt(
        process.env['THROTTLE_REFRESH_TTL'] ||
          String(DEFAULT_CONFIG.auth.throttle.refresh.ttl),
        10,
      ),
    },
    passwordReset: {
      limit: parseInt(
        process.env['THROTTLE_PASSWORD_RESET_LIMIT'] ||
          String(DEFAULT_CONFIG.auth.throttle.passwordReset.limit),
        10,
      ),
      ttl: parseInt(
        process.env['THROTTLE_PASSWORD_RESET_TTL'] ||
          String(DEFAULT_CONFIG.auth.throttle.passwordReset.ttl),
        10,
      ),
    },
  },
  passwordPolicy: {
    minLength: parseInt(
      process.env['PASSWORD_MIN_LENGTH'] ||
        String(DEFAULT_CONFIG.auth.passwordPolicy.minLength),
      10,
    ),
    maxLength: parseInt(
      process.env['PASSWORD_MAX_LENGTH'] ||
        String(DEFAULT_CONFIG.auth.passwordPolicy.maxLength),
      10,
    ),
  },
}));

/** Inferred TypeScript type for auth namespace configuration. */
export type AuthConfig = ConfigType<typeof authConfig>;
