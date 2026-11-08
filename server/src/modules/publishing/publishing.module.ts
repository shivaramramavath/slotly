// NestJS feature module packaging publishing requests, state transitions, and approvals.
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PublishRequest,
  PublishRequestSchema,
} from './schemas/publish-request.schema';
import {
  ScheduleVersion,
  ScheduleVersionSchema,
} from '../builds/schemas/schedule-version.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { PublishRequestRepository } from './repositories/publish-request.repository';
import { PublishingService } from './services/publishing.service';
import { PublishingController } from './controllers/publishing.controller';
import { AdminApprovalsController } from './controllers/admin-approvals.controller';
import { BuildsModule } from '../builds/builds.module';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../../common/events/events.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../../common/audit/audit.module';

/** NestJS feature module configuring publication requests, state workflows, and admin reviews. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublishRequest.name, schema: PublishRequestSchema },
      { name: ScheduleVersion.name, schema: ScheduleVersionSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    CacheModule,
    DatabaseModule,
    AuditModule,
    EventsModule,
    forwardRef(() => BuildsModule),
    forwardRef(() => BlueprintModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [PublishingController, AdminApprovalsController],
  providers: [PublishRequestRepository, PublishingService],
  exports: [PublishRequestRepository, PublishingService],
})
export class PublishingModule {}
