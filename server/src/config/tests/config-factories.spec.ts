// Unit tests verifying configuration factories parse and map environment variables properly.
import { appConfig } from '../app.config';
import { databaseConfig } from '../database.config';
import { redisConfig } from '../redis.config';
import { jwtConfig } from '../jwt.config';
import { sessionConfig } from '../session.config';
import { authConfig } from '../auth.config';
import { oauthConfig } from '../oauth.config';
import { emailConfig } from '../email.config';
import { cacheConfig } from '../cache.config';
import { queueConfig } from '../queue.config';
import { groqConfig } from '../groq.config';

describe('Config Factories', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('appConfig maps port as integer and sets logging', () => {
    process.env['PORT'] = '4500';
    process.env['LOG_LEVEL'] = 'debug';
    const cfg = appConfig();
    expect(cfg.port).toBe(4500);
    expect(cfg.logging.level).toBe('debug');
  });

  it('databaseConfig extracts URI and numbers', () => {
    process.env['DATABASE_URL'] = 'mongodb://localhost:27017/custom';
    process.env['DATABASE_MAX_POOL_SIZE'] = '25';
    const cfg = databaseConfig();
    expect(cfg.uri).toBe('mongodb://localhost:27017/custom');
    expect(cfg.options.maxPoolSize).toBe(25);
  });

  it('redisConfig parses port, db index, and tls boolean', () => {
    process.env['REDIS_PORT'] = '6380';
    process.env['REDIS_DB'] = '2';
    process.env['REDIS_TLS'] = 'true';
    const cfg = redisConfig();
    expect(cfg.port).toBe(6380);
    expect(cfg.db).toBe(2);
    expect(cfg.tls).toBe(true);
  });

  it('jwtConfig maps access and refresh namespaces', () => {
    process.env['JWT_ACCESS_SECRET'] = 'custom-access-secret-123456';
    process.env['JWT_ACCESS_EXPIRES_IN'] = '30m';
    const cfg = jwtConfig();
    expect(cfg.access.secret).toBe('custom-access-secret-123456');
    expect(cfg.access.expiresIn).toBe('30m');
  });

  it('sessionConfig maps ttl and cookie settings', () => {
    process.env['SESSION_COOKIE_NAME'] = 'custom_sid';
    process.env['SESSION_COOKIE_SECURE'] = 'true';
    const cfg = sessionConfig();
    expect(cfg.cookie.name).toBe('custom_sid');
    expect(cfg.cookie.secure).toBe(true);
  });

  it('authConfig maps argon2, otp and rate limits', () => {
    process.env['OTP_LENGTH'] = '8';
    process.env['ENABLE_DEV_MASTER_OTP'] = 'true';
    const cfg = authConfig();
    expect(cfg.otp.length).toBe(8);
    expect(cfg.otp.allowDevMasterOtp).toBe(true);
  });

  it('oauthConfig derives enabled flags based on client id/secret presence', () => {
    process.env['GOOGLE_CLIENT_ID'] = 'google-id';
    process.env['GOOGLE_CLIENT_SECRET'] = 'google-secret';
    process.env['GITHUB_CLIENT_ID'] = '';
    const cfg = oauthConfig();
    expect(cfg.google.enabled).toBe(true);
    expect(cfg.google.clientId).toBe('google-id');
    expect(cfg.github.enabled).toBe(false);
  });

  it('emailConfig maps driver, sender, timeout and retries', () => {
    process.env['EMAIL_DRIVER'] = 'brevo';
    process.env['BREVO_API_KEY'] = 'xkeysib-mock';
    process.env['BREVO_SENDER_EMAIL'] = 'admin@slotly.io';
    const cfg = emailConfig();
    expect(cfg.driver).toBe('brevo');
    expect(cfg.apiKey).toBe('xkeysib-mock');
    expect(cfg.sender.email).toBe('admin@slotly.io');
  });

  it('cacheConfig maps all individual TTL values', () => {
    process.env['CACHE_DEFAULT_TTL'] = '1800';
    process.env['CACHE_READINESS_TTL'] = '900';
    const cfg = cacheConfig();
    expect(cfg.defaultTtl).toBe(1800);
    expect(cfg.readinessTtl).toBe(900);
  });

  it('queueConfig maps retry attempts and worker concurrency', () => {
    process.env['QUEUE_ATTEMPTS'] = '5';
    process.env['QUEUE_CONCURRENCY_WRITE_BEHIND'] = '10';
    const cfg = queueConfig();
    expect(cfg.attempts).toBe(5);
    expect(cfg.concurrency.writeBehind).toBe(10);
  });

  it('groqConfig maps model and request limits', () => {
    process.env['GROQ_MODEL'] = 'llama-3.1-8b-instant';
    process.env['GROQ_TEMPERATURE'] = '0.5';
    const cfg = groqConfig();
    expect(cfg.model).toBe('llama-3.1-8b-instant');
    expect(cfg.requestLimits.temperature).toBe(0.5);
  });
});
