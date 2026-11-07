import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validateEnv } from './config/env.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { AppQueueModule } from './common/queue/queue.module';
import { AuditModule } from './common/audit/audit.module';
import { EventBus } from './common/events/event-bus.service';
import { TransactionHelper } from './common/database/transaction.helper';
import {
  MetricsService,
  MetricsInterceptor,
} from './common/monitoring/metrics.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { LibraryModule } from './modules/library/library.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BlueprintModule } from './modules/blueprint/blueprint.module';
import { EngineModule } from './modules/engine/engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/slotly?replicaSet=rs0&directConnection=true',
      }),
      inject: [ConfigService],
    }),
    CacheModule,
    AppQueueModule,
    AuditModule,
    UsersModule,
    AuthModule,
    InstitutionsModule,
    LibraryModule,
    ProjectsModule,
    BlueprintModule,
    EngineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EventBus,
    TransactionHelper,
    MetricsService,
    MetricsInterceptor,
  ],
  exports: [EventBus, TransactionHelper, MetricsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
