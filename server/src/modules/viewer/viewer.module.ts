// NestJS module configuring viewer timetable dependencies, clock token, and controller.
import { Module } from '@nestjs/common';
import { ViewerController } from './controllers/viewer.controller';
import { ViewerService } from './services/viewer.service';
import { CurrentPeriodService } from './services/current-period.service';
import { CLOCK, SystemClock } from './services/clock.token';
import { ProjectsModule } from '../projects/projects.module';
import { BuildsModule } from '../builds/builds.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { LibraryModule } from '../library/library.module';

/** NestJS module managing timetable viewers and current period computation. */
@Module({
  imports: [
    ProjectsModule,
    BuildsModule,
    SchedulesModule,
    InstitutionsModule,
    LibraryModule,
  ],
  controllers: [ViewerController],
  providers: [
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    CurrentPeriodService,
    ViewerService,
  ],
  exports: [ViewerService, CurrentPeriodService, CLOCK],
})
export class ViewerModule {}
