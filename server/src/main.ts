// Core bootstrap implementation for the Slotly backend server.
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { appConfig, AppConfig } from './config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import {
  MetricsService,
  MetricsInterceptor,
} from './common/monitoring/metrics.interceptor';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appCfg = app.get<AppConfig>(appConfig.KEY);

  // Security headers & cookies
  app.use(helmet());
  app.use(cookieParser());

  // CORS configuration
  const clientUrl = appCfg.clientUrl;
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'If-Match',
    ],
    exposedHeaders: ['ETag', 'X-Request-ID'],
  });

  // Global pipes & filters
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new MetricsInterceptor(metricsService),
  );

  const port = appCfg.port;
  await app.listen(port);
  console.log(`Slotly server listening on port ${port}`);
}

void bootstrap();
