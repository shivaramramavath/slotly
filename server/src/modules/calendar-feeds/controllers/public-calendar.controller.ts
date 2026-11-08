// HTTP controller streaming public calendar .ics feeds.
import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../auth/guards/public.decorator';
import { CalendarFeedsService } from '../services/calendar-feeds.service';

/** Controller streaming unauthenticated RFC 5545 calendar subscription feeds. */
@Controller('public/calendar')
export class PublicCalendarController {
  constructor(private readonly calendarFeedsService: CalendarFeedsService) {}

  /** Streams RFC 5545 iCalendar data for calendar apps (Apple Calendar, Google, Outlook). */
  @Public()
  @Get(':feedFile')
  async getFeed(
    @Param('feedFile') feedFile: string,
    @Res() res: Response,
  ): Promise<void> {
    const rawToken = feedFile.endsWith('.ics')
      ? feedFile.slice(0, -4)
      : feedFile;

    const buffer = await this.calendarFeedsService.renderFeed(rawToken);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(feedFile)}"`,
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buffer);
  }
}
