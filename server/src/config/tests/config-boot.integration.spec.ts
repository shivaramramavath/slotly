// Integration tests verifying application bootstrap with configuration validation and dependency injection.
import { Test } from '@nestjs/testing';
import {
  AppConfigModule,
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  emailConfig,
  AppConfig,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  EmailConfig,
  validateEnv,
} from '../index';

describe('Config Bootstrap Integration', () => {
  it('boots AppConfigModule and resolves typed configs via injection tokens', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    const appCfg = moduleRef.get<AppConfig>(appConfig.KEY);
    const dbCfg = moduleRef.get<DatabaseConfig>(databaseConfig.KEY);
    const redisCfg = moduleRef.get<RedisConfig>(redisConfig.KEY);
    const jwtCfg = moduleRef.get<JwtConfig>(jwtConfig.KEY);
    const emailCfg = moduleRef.get<EmailConfig>(emailConfig.KEY);

    expect(appCfg).toBeDefined();
    expect(typeof appCfg.port).toBe('number');
    expect(dbCfg).toBeDefined();
    expect(typeof dbCfg.uri).toBe('string');
    expect(redisCfg).toBeDefined();
    expect(typeof redisCfg.port).toBe('number');
    expect(jwtCfg).toBeDefined();
    expect(jwtCfg.access.expiresIn).toBeDefined();
    expect(emailCfg).toBeDefined();
    expect(['brevo', 'log']).toContain(emailCfg.driver);
  });

  it('fails fast on boot when legacy environment variables are passed', () => {
    expect(() => {
      validateEnv({
        NODE_ENV: 'test',
        MONGODB_URI: 'mongodb://localhost:27017/slotly',
      });
    }).toThrow(/Legacy environment variables detected/);
  });
});
