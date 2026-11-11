// Central default configuration constants used across Joi validation and config factories.

/** Default application configuration constants. */
export const DEFAULT_CONFIG = {
  app: {
    port: 4000,
    nodeEnv: 'development' as const,
    clientUrl: 'http://localhost:3000',
    corsOrigins: ['http://localhost:3000'],
    apiPrefix: '',
    logging: {
      enabled: true,
      level: 'log' as const,
    },
  },
  database: {
    uri: 'mongodb://localhost:27017/slotly?replicaSet=rs0&directConnection=true',
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    tls: false,
  },
  jwt: {
    access: {
      secret: 'slotly-dev-super-secure-access-token-secret-32-chars',
      expiresIn: '15m',
    },
    refresh: {
      secret: 'slotly-dev-super-secure-refresh-token-secret-32-chars',
      expiresIn: '7d',
    },
  },
  session: {
    ttl: 604800, // 7 days in seconds
    maxLifetime: 2592000, // 30 days in seconds
    cookie: {
      name: 'slotly_refresh_token',
      sameSite: 'lax' as const,
      secure: false,
      domain: undefined as string | undefined,
    },
  },
  auth: {
    argon2: {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    },
    otp: {
      length: 6,
      ttl: 600,
      cooldown: 60,
      maxAttempts: 5,
      allowDevMasterOtp: false,
    },
    stepUpWindow: 600,
    throttle: {
      login: { limit: 5, ttl: 300 },
      otp: { limit: 3, ttl: 60 },
      refresh: { limit: 10, ttl: 60 },
      passwordReset: { limit: 3, ttl: 300 },
    },
    passwordPolicy: {
      minLength: 12,
      maxLength: 128,
    },
  },
  oauth: {
    callbackBaseUrl: 'http://localhost:4000',
    google: {
      clientId: '',
      clientSecret: '',
    },
    github: {
      clientId: '',
      clientSecret: '',
    },
  },
  email: {
    driver: 'brevo' as const,
    apiKey: '',
    sender: {
      email: 'noreply@slotly.local',
      name: 'Slotly',
    },
    timeout: 10,
    maxRetries: 3,
  },
  cache: {
    defaultTtl: 3600,
    negativeTtl: 30,
    maxBytes: 262144, // 256 KB
    keyPrefixEnv: 'development',
    schemaVersion: 1,
    blueprintTtl: 7200,
    readinessTtl: 600,
    treeTtl: 86400,
    slotsTtl: 7200,
    userProfileTtl: 3600,
    projectListTtl: 3600,
    libraryListTtl: 7200,
    analyticsTtl: 60,
    notificationsTtl: 300,
  },
  queue: {
    prefix: 'slotly',
    attempts: 3,
    backoffDelay: 1000,
    concurrency: {
      writeBehind: 10,
      solver: 2,
      audit: 20,
      notifications: 5,
      export: 4,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
  groq: {
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    requestLimits: {
      maxTokens: 4096,
      temperature: 0.2,
    },
  },
  blueprint: {
    v2Enabled: false,
  },
};
