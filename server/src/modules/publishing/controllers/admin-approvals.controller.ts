// HTTP controller handling administrator publication approval inbox, reviews, and rejections.
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import {
  PublishingService,
  PublishResult,
} from '../services/publishing.service';
import { ReviewPublishDtoSchema } from '@slotly/contracts';
import type { PublishRequestDto, ReviewPublishDto } from '@slotly/contracts';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/** Controller exposing admin approvals inbox and review actions. */
@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminApprovalsController {
  constructor(private readonly publishingService: PublishingService) {}

  /**
   * Retrieves pending publication requests for administrator review inbox.
   * GET /admin/approvals
   */
  @Get('admin/approvals')
  @RequirePermissions('TIMETABLE_APPROVE')
  async getPendingApprovals(): Promise<PublishRequestDto[]> {
    return this.publishingService.getPendingApprovals();
  }

  /**
   * Approves a publication request and publishes timetable in an atomic transaction.
   * POST /publish-requests/:requestId/approve
   */
  @Post('publish-requests/:requestId/approve')
  @RequirePermissions('TIMETABLE_APPROVE')
  async approvePublishRequest(
    @Param('requestId') requestId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(ReviewPublishDtoSchema))
    dto: ReviewPublishDto,
  ): Promise<PublishResult> {
    return this.publishingService.approvePublishRequest(
      requestId,
      req.user?.id || 'admin',
      dto,
    );
  }

  /**
   * Rejects a publication request with a mandatory explanation comment.
   * POST /publish-requests/:requestId/reject
   */
  @Post('publish-requests/:requestId/reject')
  @RequirePermissions('TIMETABLE_APPROVE')
  async rejectPublishRequest(
    @Param('requestId') requestId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(ReviewPublishDtoSchema))
    dto: ReviewPublishDto,
  ): Promise<PublishRequestDto> {
    return this.publishingService.rejectPublishRequest(
      requestId,
      req.user?.id || 'admin',
      dto,
    );
  }
}
