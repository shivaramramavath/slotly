// HTTP controller handling builds.controller endpoints.
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { BuildsService } from '../services/builds.service';
import type { CreateBuildDto, ScheduleVersionDto } from '@slotly/contracts';

/** Controller handling builds controller HTTP endpoints. */
@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  /**
   * Enqueues or executes a timetable build.
   * POST /projects/:projectId/builds
   */
  @Post('projects/:projectId/builds')
  @RequirePermissions('PROJECT_MANAGE')
  async createBuild(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBuildDto,
    @Request() req: { user: RequestUser },
  ): Promise<ScheduleVersionDto[]> {
    return this.buildsService.startBuild(
      projectId,
      dto,
      req.user?.id || 'system',
    );
  }

  /**
   * Checks current build running status.
   * GET /projects/:projectId/builds/current
   */
  @Get('projects/:projectId/builds/current')
  @RequirePermissions('PROJECT_READ')
  async getCurrentBuild(@Param('projectId') projectId: string) {
    return this.buildsService.isBuildRunning(projectId);
  }

  /**
   * Cancels currently running build.
   * POST /projects/:projectId/builds/cancel or DELETE /projects/:projectId/builds/current
   */
  @Post('projects/:projectId/builds/cancel')
  @RequirePermissions('PROJECT_MANAGE')
  async cancelBuildPost(@Param('projectId') projectId: string) {
    const cancelled = await this.buildsService.cancelBuild(projectId);
    return { success: cancelled };
  }

  @Delete('projects/:projectId/builds/current')
  @RequirePermissions('PROJECT_MANAGE')
  async cancelBuildDelete(@Param('projectId') projectId: string) {
    const cancelled = await this.buildsService.cancelBuild(projectId);
    return { success: cancelled };
  }

  /**
   * Returns all schedule versions for a project.
   * GET /projects/:projectId/versions
   */
  @Get('projects/:projectId/versions')
  @RequirePermissions('PROJECT_READ')
  async getProjectVersions(
    @Param('projectId') projectId: string,
  ): Promise<ScheduleVersionDto[]> {
    return this.buildsService.getVersions(projectId);
  }

  /**
   * Returns a specific schedule version.
   * GET /versions/:versionId
   */
  @Get('versions/:versionId')
  @RequirePermissions('PROJECT_READ')
  async getVersion(
    @Param('versionId') versionId: string,
  ): Promise<ScheduleVersionDto> {
    const version = await this.buildsService.getVersion(versionId);
    if (!version) {
      throw new NotFoundException(`ScheduleVersion "${versionId}" not found`);
    }
    return version;
  }
}
