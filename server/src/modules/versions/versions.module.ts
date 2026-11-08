// NestJS feature module configuring schedule version queries, diffs, duplication, and ratings.
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TimetableRating,
  TimetableRatingSchema,
} from './schemas/timetable-rating.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import {
  ScheduleVersion,
  ScheduleVersionSchema,
} from '../builds/schemas/schedule-version.schema';
import { TimetableRatingRepository } from './repositories/timetable-rating.repository';
import { ChangeSummaryService } from './services/change-summary.service';
import { DiffService } from './services/diff.service';
import { VersionsService } from './services/versions.service';
import { VersionsController } from './controllers/versions.controller';
import { BuildsModule } from '../builds/builds.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { LibraryModule } from '../library/library.module';
import { BlueprintModule } from '../blueprint/blueprint.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../../common/cache/cache.module';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../../common/audit/audit.module';

/** NestJS module managing schedule version entities, comparison diffs, and ratings. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimetableRating.name, schema: TimetableRatingSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ScheduleVersion.name, schema: ScheduleVersionSchema },
    ]),
    CacheModule,
    DatabaseModule,
    AuditModule,
    forwardRef(() => BuildsModule),
    forwardRef(() => SchedulesModule),
    forwardRef(() => LibraryModule),
    forwardRef(() => BlueprintModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [VersionsController],
  providers: [
    ChangeSummaryService,
    DiffService,
    TimetableRatingRepository,
    VersionsService,
  ],
  exports: [
    ChangeSummaryService,
    DiffService,
    TimetableRatingRepository,
    VersionsService,
  ],
})
export class VersionsModule {}
