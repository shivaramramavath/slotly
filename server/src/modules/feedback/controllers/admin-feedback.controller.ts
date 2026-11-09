// Administrative HTTP controller for feedback triage and resolution.
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  UpdateFeedbackDtoSchema,
  type UpdateFeedbackDto,
  type FeedbackDto,
  type FeedbackStatus,
  type FeedbackType,
} from '@slotly/contracts';
import { FeedbackService } from '../services/feedback.service';

/** Administrative controller for viewing, triaging, and responding to feedback. */
@Controller('admin/feedback')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /** Lists all submitted feedback across the institution with status filtering. */
  @Get()
  @RequirePermissions('FEEDBACK_MANAGE')
  async listFeedback(
    @Req() req: { user: RequestUser },
    @Query('status') status?: FeedbackStatus,
    @Query('type') type?: FeedbackType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: FeedbackDto[]; total: number }> {
    return this.feedbackService.listFeedback({
      status,
      type,
      institutionId: req.user.institutionId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /** Updates feedback status and provides administrative reply. */
  @Patch(':id')
  @RequirePermissions('FEEDBACK_MANAGE')
  async updateFeedback(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFeedbackDtoSchema))
    dto: UpdateFeedbackDto,
  ): Promise<FeedbackDto> {
    return this.feedbackService.updateFeedback(id, req.user.id, dto);
  }
}
