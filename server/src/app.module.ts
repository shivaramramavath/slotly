// Core implementation for app.module in Projects/slotly/server/src.
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule, databaseConfig, DatabaseConfig } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './common/cache/cache.module';
import { AppQueueModule } from './common/queue/queue.module';
import { AuditModule } from './common/audit/audit.module';
import { EventsModule } from './common/events/events.module';
import { EmailModule } from './common/email/email.module';
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
import { BuildsModule } from './modules/builds/builds.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { VersionsModule } from './modules/versions/versions.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { ViewerModule } from './modules/viewer/viewer.module';
import { ExportsModule } from './modules/exports/exports.module';
import { CalendarFeedsModule } from './modules/calendar-feeds/calendar-feeds.module';
import { SharesModule } from './modules/shares/shares.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

/** Class implementing app module. */
@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: DatabaseConfig) => ({
        uri: dbConfig.uri,
        serverSelectionTimeoutMS: dbConfig.options.serverSelectionTimeoutMS,
        maxPoolSize: dbConfig.options.maxPoolSize,
      }),
    }),
    CacheModule,
    AppQueueModule,
    AuditModule,
    EventsModule,
    EmailModule,
    UsersModule,
    AuthModule,
    InstitutionsModule,
    LibraryModule,
    ProjectsModule,
    BlueprintModule,
    EngineModule,
    BuildsModule,
    SchedulesModule,
    VersionsModule,
    PublishingModule,
    ViewerModule,
    ExportsModule,
    CalendarFeedsModule,
    SharesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TransactionHelper,
    MetricsService,
    MetricsInterceptor,
  ],
  exports: [TransactionHelper, MetricsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
