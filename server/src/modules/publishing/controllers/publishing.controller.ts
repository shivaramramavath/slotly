// HTTP controller handling timetable publication requests and direct admin publishing.
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
import { RequestPublishDtoSchema } from '@slotly/contracts';
import type { PublishRequestDto, RequestPublishDto } from '@slotly/contracts';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/** Controller exposing publication request endpoints and direct publishing actions. */
@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  /**
   * Designer submits a timetable publication request.
   * POST /versions/:versionId/publish-request
   */
  @Post('versions/:versionId/publish-request')
  @RequirePermissions('PROJECT_MANAGE')
  async requestPublish(
    @Param('versionId') versionId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(RequestPublishDtoSchema.optional()))
    dto?: RequestPublishDto,
  ): Promise<PublishRequestDto> {
    return this.publishingService.requestPublish(
      versionId,
      req.user?.id || 'designer',
      dto,
    );
  }

  /**
   * Lists all publication requests for a project.
   * GET /projects/:projectId/publish-requests
   */
  @Get('projects/:projectId/publish-requests')
  @RequirePermissions('PROJECT_READ')
  async getProjectPublishRequests(
    @Param('projectId') projectId: string,
  ): Promise<PublishRequestDto[]> {
    return this.publishingService.getProjectPublishRequests(projectId);
  }

  /**
   * Admin executes direct publication in an atomic transaction.
   * POST /versions/:versionId/publish
   */
  @Post('versions/:versionId/publish')
  @RequirePermissions('TIMETABLE_PUBLISH')
  async publishDirect(
    @Param('versionId') versionId: string,
    @Request() req: { user: RequestUser },
  ): Promise<PublishResult> {
    return this.publishingService.publishDirect(
      versionId,
      req.user?.id || 'admin',
    );
  }
}
