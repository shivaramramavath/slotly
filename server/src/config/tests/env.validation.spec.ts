// Unit tests verifying Joi environment validation schema and legacy variable detection.
import { validateEnv, checkLegacyVariables } from '../env.validation';

describe('Environment Validation', () => {
  const minimalValidEnv: Record<string, unknown> = {
    NODE_ENV: 'development',
    PORT: 4000,
    CLIENT_URL: 'http://localhost:3000',
    DATABASE_URL: 'mongodb://localhost:27017/slotly_test',
    JWT_ACCESS_SECRET: 'super-secret-access-token-key-minimum-16',
    JWT_REFRESH_SECRET: 'super-secret-refresh-token-key-minimum-16',
  };

  it('validates a correct minimal environment successfully', () => {
    const validated = validateEnv(minimalValidEnv);
    expect(validated['PORT']).toBe(4000);
    expect(validated['DATABASE_URL']).toBe(
      'mongodb://localhost:27017/slotly_test',
    );
    expect(validated['EMAIL_DRIVER']).toBe('brevo');
  });

  it('applies default values for optional configurations', () => {
    const validated = validateEnv(minimalValidEnv);
    expect(validated['REDIS_HOST']).toBe('localhost');
    expect(validated['REDIS_PORT']).toBe(6379);
    expect(validated['CACHE_DEFAULT_TTL']).toBe(3600);
    expect(validated['ARGON2_TIME_COST']).toBe(3);
  });

  it('fails fast when required DATABASE_URL is missing in development', () => {
    const invalidEnv = { ...minimalValidEnv };
    delete invalidEnv['DATABASE_URL'];

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Environment validation failed.*DATABASE_URL/,
    );
  });

  it('fails when DATABASE_URL is not a mongodb uri', () => {
    const invalidEnv = {
      ...minimalValidEnv,
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Environment validation failed.*DATABASE_URL/,
    );
  });

  it('fails when JWT secret is shorter than 16 characters', () => {
    const invalidEnv = {
      ...minimalValidEnv,
      JWT_ACCESS_SECRET: 'short',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Environment validation failed.*JWT_ACCESS_SECRET/,
    );
  });

  it('fails when PORT is invalid', () => {
    const invalidEnv = {
      ...minimalValidEnv,
      PORT: 999999,
    };

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Environment validation failed.*PORT/,
    );
  });

  it('fails when enum value is invalid', () => {
    const invalidEnv = {
      ...minimalValidEnv,
      NODE_ENV: 'staging',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Environment validation failed.*NODE_ENV/,
    );
  });

  it('never outputs secret values in error messages', () => {
    const sensitiveValue = 'SuperSecretThatMustNeverBePrintedInLogs123';
    const invalidEnv = {
      ...minimalValidEnv,
      JWT_ACCESS_SECRET: sensitiveValue,
      PORT: 'not-a-port',
    };

    try {
      validateEnv(invalidEnv);
      fail('Expected validateEnv to throw');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain(sensitiveValue);
      expect(message).toContain('PORT');
    }
  });

  it('supplies safe defaults in NODE_ENV=test without .env', () => {
    const testEnv = { NODE_ENV: 'test' };
    const validated = validateEnv(testEnv);
    expect(validated['DATABASE_URL']).toBeDefined();
    expect(validated['JWT_ACCESS_SECRET']).toBeDefined();
    expect(validated['JWT_REFRESH_SECRET']).toBeDefined();
  });

  describe('Legacy Variable Detection', () => {
    it('detects MONGODB_URI and reports migration to DATABASE_URL', () => {
      const legacyEnv = {
        ...minimalValidEnv,
        MONGODB_URI: 'mongodb://localhost:27017/old',
      };

      expect(() => checkLegacyVariables(legacyEnv)).toThrow(
        /MONGODB_URI was renamed to DATABASE_URL/,
      );
    });

    it('detects multiple legacy variables and reports all names', () => {
      const legacyEnv = {
        ...minimalValidEnv,
        MONGODB_URI: 'mongodb://localhost:27017/old',
        JWT_ACCESS_EXPIRATION: '15m',
        EMAIL_FROM: 'noreply@old.org',
        SMTP_HOST: 'smtp.mailgun.org',
      };

      try {
        checkLegacyVariables(legacyEnv);
        fail('Expected checkLegacyVariables to throw');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        expect(msg).toContain('MONGODB_URI was renamed to DATABASE_URL');
        expect(msg).toContain(
          'JWT_ACCESS_EXPIRATION was renamed to JWT_ACCESS_EXPIRES_IN',
        );
        expect(msg).toContain('EMAIL_FROM was renamed to BREVO_SENDER_EMAIL');
        expect(msg).toContain('SMTP_HOST was removed');
      }
    });

    it('validateEnv fails if legacy variable is present even with otherwise valid env', () => {
      const legacyEnv = {
        ...minimalValidEnv,
        JWT_ACCESS_EXPIRATION: '15m',
      };

      expect(() => validateEnv(legacyEnv)).toThrow(
        /Legacy environment variables detected/,
      );
    });
  });
});
