// HTTP controller handling timetable version queries, labeling, duplicating, restoring, diffing, and ratings.
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { VersionsService } from '../services/versions.service';
import {
  DuplicateVersionDtoSchema,
  TimetableRatingDtoSchema,
  UpdateVersionLabelDtoSchema,
} from '@slotly/contracts';
import type {
  DuplicateVersionDto,
  ScheduleVersionDto,
  TimetableRatingDto,
  TimetableRatingResponseDto,
  UpdateVersionLabelDto,
  VersionDiffDto,
} from '@slotly/contracts';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

/** Controller exposing version management, comparison, and rating HTTP endpoints. */
@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  /**
   * Retrieves all schedule versions for a project.
   * GET /projects/:projectId/versions
   */
  @Get('projects/:projectId/versions')
  @RequirePermissions('PROJECT_READ')
  async listVersions(
    @Param('projectId') projectId: string,
  ): Promise<ScheduleVersionDto[]> {
    return this.versionsService.listVersions(projectId);
  }

  /**
   * Retrieves a specific schedule version.
   * GET /versions/:versionId
   */
  @Get('versions/:versionId')
  @RequirePermissions('PROJECT_READ')
  async getVersion(
    @Param('versionId') versionId: string,
  ): Promise<ScheduleVersionDto> {
    return this.versionsService.getVersion(versionId);
  }

  /**
   * Updates human-readable label of a version.
   * PATCH /versions/:versionId/label
   */
  @Patch('versions/:versionId/label')
  @RequirePermissions('PROJECT_MANAGE')
  async updateLabel(
    @Param('versionId') versionId: string,
    @Body(new ZodValidationPipe(UpdateVersionLabelDtoSchema))
    dto: UpdateVersionLabelDto,
  ): Promise<ScheduleVersionDto> {
    return this.versionsService.updateLabel(versionId, dto);
  }

  /**
   * Duplicates an existing version into a new draft.
   * POST /versions/:versionId/duplicate
   */
  @Post('versions/:versionId/duplicate')
  @RequirePermissions('PROJECT_MANAGE')
  async duplicateVersion(
    @Param('versionId') versionId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(DuplicateVersionDtoSchema.optional()))
    dto?: DuplicateVersionDto,
  ): Promise<ScheduleVersionDto> {
    return this.versionsService.duplicateVersion(
      versionId,
      req.user?.id || 'system',
      dto?.label,
    );
  }

  /**
   * Restores an older version as a new active draft.
   * POST /versions/:versionId/restore
   */
  @Post('versions/:versionId/restore')
  @RequirePermissions('PROJECT_MANAGE')
  async restoreVersion(
    @Param('versionId') versionId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(DuplicateVersionDtoSchema.optional()))
    dto?: DuplicateVersionDto,
  ): Promise<ScheduleVersionDto> {
    return this.versionsService.restoreVersion(
      versionId,
      req.user?.id || 'system',
      dto?.label,
    );
  }

  /**
   * Archives a schedule version.
   * POST /versions/:versionId/archive
   */
  @Post('versions/:versionId/archive')
  @RequirePermissions('PROJECT_MANAGE')
  async archiveVersion(
    @Param('versionId') versionId: string,
  ): Promise<ScheduleVersionDto> {
    return this.versionsService.archiveVersion(versionId);
  }

  /**
   * Compares two schedule versions and computes structured diff and readable text summaries.
   * GET /versions/:leftVersionId/diff/:rightVersionId
   */
  @Get('versions/:leftVersionId/diff/:rightVersionId')
  @RequirePermissions('PROJECT_READ')
  async compareVersions(
    @Param('leftVersionId') leftVersionId: string,
    @Param('rightVersionId') rightVersionId: string,
  ): Promise<VersionDiffDto> {
    return this.versionsService.compareVersions(leftVersionId, rightVersionId);
  }

  /**
   * Submits a quality rating for a timetable version.
   * POST /versions/:versionId/rate
   */
  @Post('versions/:versionId/rate')
  @RequirePermissions('TIMETABLE_READ')
  async rateVersion(
    @Param('versionId') versionId: string,
    @Request() req: { user: RequestUser },
    @Body(new ZodValidationPipe(TimetableRatingDtoSchema))
    dto: TimetableRatingDto,
  ): Promise<TimetableRatingResponseDto> {
    return this.versionsService.rateVersion(
      versionId,
      req.user?.id || 'anonymous',
      dto,
    );
  }

  /**
   * Retrieves all quality ratings submitted for a version.
   * GET /versions/:versionId/ratings
   */
  @Get('versions/:versionId/ratings')
  @RequirePermissions('PROJECT_READ')
  async getRatings(
    @Param('versionId') versionId: string,
  ): Promise<TimetableRatingResponseDto[]> {
    return this.versionsService.getRatings(versionId);
  }
}
