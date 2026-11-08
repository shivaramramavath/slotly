// Joi validation schema and legacy environment variable validation logic.
import * as Joi from 'joi';
import { DEFAULT_CONFIG } from './defaults';

const LEGACY_VARIABLE_MAP: Record<string, string> = {
  MONGODB_URI: 'DATABASE_URL',
  JWT_ACCESS_EXPIRATION: 'JWT_ACCESS_EXPIRES_IN',
  JWT_REFRESH_EXPIRATION: 'JWT_REFRESH_EXPIRES_IN',
  EMAIL_FROM: 'BREVO_SENDER_EMAIL',
  EMAIL_FROM_NAME: 'BREVO_SENDER_NAME',
  GOOGLE_CALLBACK_URL: 'OAUTH_CALLBACK_BASE_URL (or removed)',
  GITHUB_CALLBACK_URL: 'OAUTH_CALLBACK_BASE_URL (or removed)',
};

/** Joi schema defining environment variable validation constraints. */
export const envValidationSchema = Joi.object({
  // App
  PORT: Joi.number().port().default(DEFAULT_CONFIG.app.port),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default(DEFAULT_CONFIG.app.nodeEnv),
  CLIENT_URL: Joi.string().uri().default(DEFAULT_CONFIG.app.clientUrl),
  CORS_ORIGINS: Joi.string().default(DEFAULT_CONFIG.app.corsOrigins.join(',')),
  API_PREFIX: Joi.string().allow('').default(DEFAULT_CONFIG.app.apiPrefix),
  LOG_LEVEL: Joi.string()
    .valid('log', 'error', 'warn', 'debug', 'verbose')
    .default(DEFAULT_CONFIG.app.logging.level),

  // Database
  DATABASE_URL: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\/.+/)
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.string().default(DEFAULT_CONFIG.database.uri),
      otherwise: Joi.string().required(),
    }),
  DATABASE_TIMEOUT_MS: Joi.number().default(
    DEFAULT_CONFIG.database.serverSelectionTimeoutMS,
  ),
  DATABASE_MAX_POOL_SIZE: Joi.number().default(
    DEFAULT_CONFIG.database.maxPoolSize,
  ),

  // Redis
  REDIS_HOST: Joi.string().default(DEFAULT_CONFIG.redis.host),
  REDIS_PORT: Joi.number().port().default(DEFAULT_CONFIG.redis.port),
  REDIS_PASSWORD: Joi.string().allow('').default(DEFAULT_CONFIG.redis.password),
  REDIS_DB: Joi.number().default(DEFAULT_CONFIG.redis.db),
  REDIS_TLS: Joi.boolean().default(DEFAULT_CONFIG.redis.tls),

  // JWT
  JWT_ACCESS_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.string().default(DEFAULT_CONFIG.jwt.access.secret),
      otherwise: Joi.string().required(),
    }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default(
    DEFAULT_CONFIG.jwt.access.expiresIn,
  ),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: 'test',
      then: Joi.string().default(DEFAULT_CONFIG.jwt.refresh.secret),
      otherwise: Joi.string().required(),
    }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default(
    DEFAULT_CONFIG.jwt.refresh.expiresIn,
  ),

  // Session
  SESSION_TTL: Joi.number().default(DEFAULT_CONFIG.session.ttl),
  SESSION_MAX_LIFETIME: Joi.number().default(
    DEFAULT_CONFIG.session.maxLifetime,
  ),
  SESSION_COOKIE_NAME: Joi.string().default(DEFAULT_CONFIG.session.cookie.name),
  SESSION_COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default(DEFAULT_CONFIG.session.cookie.sameSite),
  SESSION_COOKIE_SECURE: Joi.boolean().default(
    DEFAULT_CONFIG.session.cookie.secure,
  ),
  SESSION_COOKIE_DOMAIN: Joi.string().allow('').optional(),

  // Auth
  ARGON2_MEMORY_COST: Joi.number().default(
    DEFAULT_CONFIG.auth.argon2.memoryCost,
  ),
  ARGON2_TIME_COST: Joi.number().default(DEFAULT_CONFIG.auth.argon2.timeCost),
  ARGON2_PARALLELISM: Joi.number().default(
    DEFAULT_CONFIG.auth.argon2.parallelism,
  ),
  OTP_LENGTH: Joi.number().default(DEFAULT_CONFIG.auth.otp.length),
  OTP_TTL: Joi.number().default(DEFAULT_CONFIG.auth.otp.ttl),
  OTP_COOLDOWN: Joi.number().default(DEFAULT_CONFIG.auth.otp.cooldown),
  OTP_MAX_ATTEMPTS: Joi.number().default(DEFAULT_CONFIG.auth.otp.maxAttempts),
  ENABLE_DEV_MASTER_OTP: Joi.boolean().default(
    DEFAULT_CONFIG.auth.otp.allowDevMasterOtp,
  ),
  STEP_UP_WINDOW: Joi.number().default(DEFAULT_CONFIG.auth.stepUpWindow),
  THROTTLE_LOGIN_LIMIT: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.login.limit,
  ),
  THROTTLE_LOGIN_TTL: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.login.ttl,
  ),
  THROTTLE_OTP_LIMIT: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.otp.limit,
  ),
  THROTTLE_OTP_TTL: Joi.number().default(DEFAULT_CONFIG.auth.throttle.otp.ttl),
  THROTTLE_REFRESH_LIMIT: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.refresh.limit,
  ),
  THROTTLE_REFRESH_TTL: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.refresh.ttl,
  ),
  THROTTLE_PASSWORD_RESET_LIMIT: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.passwordReset.limit,
  ),
  THROTTLE_PASSWORD_RESET_TTL: Joi.number().default(
    DEFAULT_CONFIG.auth.throttle.passwordReset.ttl,
  ),
  PASSWORD_MIN_LENGTH: Joi.number().default(
    DEFAULT_CONFIG.auth.passwordPolicy.minLength,
  ),
  PASSWORD_MAX_LENGTH: Joi.number().default(
    DEFAULT_CONFIG.auth.passwordPolicy.maxLength,
  ),

  // OAuth
  OAUTH_CALLBACK_BASE_URL: Joi.string()
    .uri()
    .default(DEFAULT_CONFIG.oauth.callbackBaseUrl),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GITHUB_CLIENT_ID: Joi.string().allow('').default(''),
  GITHUB_CLIENT_SECRET: Joi.string().allow('').default(''),

  // Email
  EMAIL_DRIVER: Joi.string()
    .valid('brevo', 'log')
    .default(DEFAULT_CONFIG.email.driver),
  BREVO_API_KEY: Joi.string()
    .allow('')
    .when('EMAIL_DRIVER', {
      is: 'brevo',
      then: Joi.when('NODE_ENV', {
        is: 'production',
        then: Joi.string().required(),
        otherwise: Joi.string().allow('').default(''),
      }),
      otherwise: Joi.string().allow('').default(''),
    }),
  BREVO_SENDER_EMAIL: Joi.string()
    .email()
    .default(DEFAULT_CONFIG.email.sender.email),
  BREVO_SENDER_NAME: Joi.string().default(DEFAULT_CONFIG.email.sender.name),
  EMAIL_TIMEOUT: Joi.number().default(DEFAULT_CONFIG.email.timeout),
  EMAIL_MAX_RETRIES: Joi.number().default(DEFAULT_CONFIG.email.maxRetries),

  // Cache
  CACHE_DEFAULT_TTL: Joi.number().default(DEFAULT_CONFIG.cache.defaultTtl),
  CACHE_BLUEPRINT_TTL: Joi.number().default(DEFAULT_CONFIG.cache.blueprintTtl),
  CACHE_READINESS_TTL: Joi.number().default(DEFAULT_CONFIG.cache.readinessTtl),
  CACHE_TREE_TTL: Joi.number().default(DEFAULT_CONFIG.cache.treeTtl),
  CACHE_SLOTS_TTL: Joi.number().default(DEFAULT_CONFIG.cache.slotsTtl),
  CACHE_USER_PROFILE_TTL: Joi.number().default(
    DEFAULT_CONFIG.cache.userProfileTtl,
  ),

  // Queue
  QUEUE_PREFIX: Joi.string().default(DEFAULT_CONFIG.queue.prefix),
  QUEUE_ATTEMPTS: Joi.number().default(DEFAULT_CONFIG.queue.attempts),
  QUEUE_BACKOFF_DELAY: Joi.number().default(DEFAULT_CONFIG.queue.backoffDelay),
  QUEUE_REMOVE_ON_COMPLETE: Joi.number().default(
    DEFAULT_CONFIG.queue.removeOnComplete,
  ),
  QUEUE_REMOVE_ON_FAIL: Joi.number().default(DEFAULT_CONFIG.queue.removeOnFail),
  QUEUE_CONCURRENCY_WRITE_BEHIND: Joi.number().default(
    DEFAULT_CONFIG.queue.concurrency.writeBehind,
  ),
  QUEUE_CONCURRENCY_SOLVER: Joi.number().default(
    DEFAULT_CONFIG.queue.concurrency.solver,
  ),
  QUEUE_CONCURRENCY_AUDIT: Joi.number().default(
    DEFAULT_CONFIG.queue.concurrency.audit,
  ),
  QUEUE_CONCURRENCY_NOTIFICATIONS: Joi.number().default(
    DEFAULT_CONFIG.queue.concurrency.notifications,
  ),
  QUEUE_CONCURRENCY_EXPORT: Joi.number().default(
    DEFAULT_CONFIG.queue.concurrency.export,
  ),

  // Groq
  GROQ_API_KEY: Joi.string().allow('').default(DEFAULT_CONFIG.groq.apiKey),
  GROQ_MODEL: Joi.string().default(DEFAULT_CONFIG.groq.model),
  GROQ_MAX_TOKENS: Joi.number().default(
    DEFAULT_CONFIG.groq.requestLimits.maxTokens,
  ),
  GROQ_TEMPERATURE: Joi.number().default(
    DEFAULT_CONFIG.groq.requestLimits.temperature,
  ),
}).unknown(true);

/** Function checking for legacy environment variables and failing with descriptive messages. */
export function checkLegacyVariables(env: Record<string, unknown>): void {
  const legacyErrors: string[] = [];

  for (const key of Object.keys(env)) {
    if (key.startsWith('SMTP_')) {
      legacyErrors.push(`${key} was removed`);
    } else if (LEGACY_VARIABLE_MAP[key]) {
      legacyErrors.push(`${key} was renamed to ${LEGACY_VARIABLE_MAP[key]}`);
    }
  }

  if (legacyErrors.length > 0) {
    throw new Error(
      `Legacy environment variables detected:\n${legacyErrors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

/** Function performing validation of raw environment objects. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  // 1. Check for legacy environment variables
  checkLegacyVariables(config);

  // 2. Validate against Joi schema
  const validationResult = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (validationResult.error) {
    const invalidKeys = [
      ...new Set(
        validationResult.error.details.map(
          (d) => d.context?.['key'] || d.path.join('.'),
        ),
      ),
    ];
    throw new Error(
      `Environment validation failed. The following variables are invalid or missing: ${invalidKeys.join(', ')}`,
    );
  }

  return (validationResult.value as Record<string, unknown>) ?? {};
}
