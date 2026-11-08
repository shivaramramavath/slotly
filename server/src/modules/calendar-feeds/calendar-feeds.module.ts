// NestJS module configuring calendar feed schema, repository, service, and controllers.
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CalendarFeed,
  CalendarFeedSchema,
} from './schemas/calendar-feed.schema';
import { CalendarFeedRepository } from './repositories/calendar-feed.repository';
import { CalendarFeedsService } from './services/calendar-feeds.service';
import { CalendarFeedsController } from './controllers/calendar-feeds.controller';
import { PublicCalendarController } from './controllers/public-calendar.controller';
import { ViewerModule } from '../viewer/viewer.module';
import { ExportsModule } from '../exports/exports.module';
import { ProjectsModule } from '../projects/projects.module';
import { IcsExporter } from '../exports/services/exporters/ics.exporter';

/** NestJS module managing calendar feeds. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarFeed.name, schema: CalendarFeedSchema },
    ]),
    ViewerModule,
    ExportsModule,
    ProjectsModule,
  ],
  controllers: [CalendarFeedsController, PublicCalendarController],
  providers: [CalendarFeedRepository, CalendarFeedsService, IcsExporter],
  exports: [CalendarFeedsService, CalendarFeedRepository],
})
export class CalendarFeedsModule {}
