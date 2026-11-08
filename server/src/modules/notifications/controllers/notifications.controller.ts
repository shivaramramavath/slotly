// HTTP controller managing user notifications, unread counts, and channel preferences.
import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  NotificationPreferencesDtoSchema,
  type NotificationPreferencesDto,
  type NotificationDto,
} from '@slotly/contracts';
import { NotificationsService } from '../services/notifications.service';

/** Controller exposing notification querying and channel preference configuration. */
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Retrieves the authenticated user's notifications. */
  @Get()
  async getNotifications(
    @Req() req: { user: RequestUser },
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ): Promise<NotificationDto[]> {
    const unreadOnly = unread === 'true';
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    return this.notificationsService.getUserNotifications(
      req.user.id,
      unreadOnly,
      parsedLimit,
    );
  }

  /** Retrieves the count of unread notifications. */
  @Get('unread-count')
  async getUnreadCount(
    @Req() req: { user: RequestUser },
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationsService.getUnreadCount(
      req.user.id,
    );
    return { unreadCount };
  }

  /** Marks a notification as read. */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  /** Marks all notifications as read for current user. */
  @Post('read-all')
  async markAllAsRead(
    @Req() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  /** Retrieves notification preferences for the user. */
  @Get('preferences')
  async getPreferences(
    @Req() req: { user: RequestUser },
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.getPreferences(req.user.id);
  }

  /** Updates communication preferences across in-app and email channels. */
  @Put('preferences')
  async updatePreferences(
    @Req() req: { user: RequestUser },
    @Body(new ZodValidationPipe(NotificationPreferencesDtoSchema))
    dto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.updatePreferences(req.user.id, dto);
  }
}
