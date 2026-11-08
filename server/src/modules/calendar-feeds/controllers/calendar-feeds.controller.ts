// HTTP controller managing authenticated calendar feed endpoints.
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateCalendarFeedDtoSchema,
  type CreateCalendarFeedDto,
  type CalendarFeedDto,
} from '@slotly/contracts';
import { CalendarFeedsService } from '../services/calendar-feeds.service';

/** Controller exposing authenticated calendar feed management. */
@Controller('calendar-feeds')
@UseGuards(AuthGuard, PermissionsGuard)
export class CalendarFeedsController {
  constructor(private readonly calendarFeedsService: CalendarFeedsService) {}

  /** Creates a tokenized calendar feed. */
  @Post('projects/:projectId')
  @RequirePermissions('TIMETABLE_EXPORT')
  async createFeed(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(CreateCalendarFeedDtoSchema))
    dto: CreateCalendarFeedDto,
    @Req() req: { user: RequestUser },
  ): Promise<CalendarFeedDto> {
    return this.calendarFeedsService.createFeed(projectId, req.user.id, dto);
  }

  /** Lists active calendar feeds for a project. */
  @Get('projects/:projectId')
  @RequirePermissions('TIMETABLE_READ')
  async listFeeds(
    @Param('projectId') projectId: string,
  ): Promise<CalendarFeedDto[]> {
    return this.calendarFeedsService.listFeeds(projectId);
  }

  /** Revokes a calendar feed subscription. */
  @Delete(':feedId')
  @RequirePermissions('TIMETABLE_EXPORT')
  async revokeFeed(
    @Param('feedId') feedId: string,
    @Req() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    return this.calendarFeedsService.revokeFeed(
      feedId,
      req.user.id,
      req.user.role,
    );
  }
}
