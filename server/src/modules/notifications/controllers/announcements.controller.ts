// HTTP controller managing administrative audience-targeted announcements.
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateAnnouncementDtoSchema,
  type CreateAnnouncementDto,
} from '@slotly/contracts';
import { NotificationsService } from '../services/notifications.service';

/** Controller exposing announcement creation restricted to administrators. */
@Controller('announcements')
@UseGuards(AuthGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Broadcasts and persists an announcement across targeted audience. */
  @Post()
  @RequirePermissions('ANNOUNCEMENT_CREATE')
  async createAnnouncement(
    @Body(new ZodValidationPipe(CreateAnnouncementDtoSchema))
    dto: CreateAnnouncementDto,
    @Req() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    await this.notificationsService.dispatchAnnouncement(
      req.user.institutionId,
      dto,
    );
    return { success: true };
  }
}
