// Core implementation for builds.module in server/src/modules/builds.
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ScheduleVersion,
  ScheduleVersionSchema,
} from './schemas/schedule-version.schema';
import { MongoScheduleVersionRepository } from './repositories/mongo-schedule-version.repository';
import { CachedScheduleVersionRepository } from './repositories/cached-schedule-version.repository';
import { SCHEDULE_VERSION_REPOSITORY } from './repositories/schedule-version.repository.interface';
import { BuildFacade } from './services/build.facade';
import { BuildsService } from './services/builds.service';
import { BuildsGateway } from './gateways/builds.gateway';
import { BuildsController } from './controllers/builds.controller';
import { CacheModule } from '../../common/cache/cache.module';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { ProjectsModule } from '../projects/projects.module';
import { EngineModule } from '../engine/engine.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../common/audit/audit.module';
import { EventBus } from '../../common/events/event-bus.service';

/** Class implementing builds module. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduleVersion.name, schema: ScheduleVersionSchema },
    ]),
    CacheModule,
    AuditModule,
    forwardRef(() => BlueprintModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => EngineModule),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [BuildsController],
  providers: [
    MongoScheduleVersionRepository,
    CachedScheduleVersionRepository,
    {
      provide: SCHEDULE_VERSION_REPOSITORY,
      useExisting: CachedScheduleVersionRepository,
    },
    BuildFacade,
    BuildsService,
    BuildsGateway,
    EventBus,
  ],
  exports: [
    BuildFacade,
    BuildsService,
    SCHEDULE_VERSION_REPOSITORY,
    CachedScheduleVersionRepository,
  ],
})
export class BuildsModule {}
