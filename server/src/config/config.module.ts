// Core configuration module wrapping NestJS ConfigModule with all namespaces and validation schema.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv, envValidationSchema } from './env.validation';
import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { jwtConfig } from './jwt.config';
import { sessionConfig } from './session.config';
import { authConfig } from './auth.config';
import { oauthConfig } from './oauth.config';
import { emailConfig } from './email.config';
import { cacheConfig } from './cache.config';
import { queueConfig } from './queue.config';
import { groqConfig } from './groq.config';

const nodeEnv = process.env['NODE_ENV'] || 'development';
const isTest = nodeEnv === 'test';

/** Global application configuration module wrapping NestJS ConfigModule. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        sessionConfig,
        authConfig,
        oauthConfig,
        emailConfig,
        cacheConfig,
        queueConfig,
        groqConfig,
      ],
      validate: (rawConfig: Record<string, unknown>) => validateEnv(rawConfig),
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      ignoreEnvFile: isTest,
      ...(isTest ? {} : { envFilePath: [`.env.${nodeEnv}.local`, '.env'] }),
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
