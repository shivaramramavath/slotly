// HTTP controller handling user feedback submissions and user feedback history.
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateFeedbackDtoSchema,
  type CreateFeedbackDto,
  type FeedbackDto,
} from '@slotly/contracts';
import { FeedbackService } from '../services/feedback.service';

/** Controller exposing user feedback submission endpoints. */
@Controller('feedback')
@UseGuards(AuthGuard, PermissionsGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  /** Submits a new feedback item or problem report. */
  @Post()
  @RequirePermissions('FEEDBACK_SUBMIT')
  async submitFeedback(
    @Req() req: { user: RequestUser },
    @Body(new ZodValidationPipe(CreateFeedbackDtoSchema))
    dto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const user = req.user;
    return this.feedbackService.submitFeedback(
      user.id,
      user.email || 'Anonymous',
      user.email || 'no-reply@slotly.test',
      user.institutionId,
      dto,
    );
  }

  /** Lists feedback items submitted by the current user. */
  @Get('me')
  @RequirePermissions('FEEDBACK_SUBMIT')
  async getMyFeedback(
    @Req() req: { user: RequestUser },
  ): Promise<FeedbackDto[]> {
    return this.feedbackService.getUserFeedback(req.user.id);
  }
}
