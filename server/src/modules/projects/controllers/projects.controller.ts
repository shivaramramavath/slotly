import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ProjectsService } from '../services/projects.service';
import type {
  CreateProjectDto,
  DuplicateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from '@slotly/contracts';

@Controller('projects')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequirePermissions('PROJECT_CREATE')
  async create(
    @Body() dto: CreateProjectDto,
    @Request() req: { user: RequestUser },
  ): Promise<ProjectDto> {
    return this.projectsService.create(
      dto,
      req.user.id,
      req.user.institutionId,
    );
  }

  @Get()
  @RequirePermissions('PROJECT_READ')
  async list(
    @Request() req: { user: RequestUser },
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.projectsService.findProjects(
      req.user.role === 'SUPER_ADMIN' ? undefined : req.user.institutionId,
      undefined,
      status,
      search,
      pageNum,
      limitNum,
    );
  }

  @Get(':projectId')
  @RequirePermissions('PROJECT_READ')
  async getById(@Param('projectId') projectId: string): Promise<ProjectDto> {
    return this.projectsService.findById(projectId);
  }

  @Patch(':projectId')
  @RequirePermissions('PROJECT_MANAGE')
  async update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @Headers('if-match') ifMatch?: string,
  ): Promise<ProjectDto> {
    const revision = ifMatch ? parseInt(ifMatch, 10) : undefined;
    return this.projectsService.update(projectId, dto, revision);
  }

  @Delete(':projectId')
  @RequirePermissions('PROJECT_DELETE')
  async delete(
    @Param('projectId') projectId: string,
    @Request() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    const success = await this.projectsService.delete(projectId, req.user.id);
    return { success };
  }

  @Post(':projectId/duplicate')
  @RequirePermissions('PROJECT_CREATE')
  async duplicate(
    @Param('projectId') projectId: string,
    @Body() dto: DuplicateProjectDto,
    @Request() req: { user: RequestUser },
  ): Promise<ProjectDto> {
    return this.projectsService.duplicate(projectId, dto, req.user.id);
  }

  @Post(':projectId/archive')
  @RequirePermissions('PROJECT_ARCHIVE')
  async archive(
    @Param('projectId') projectId: string,
    @Request() req: { user: RequestUser },
  ): Promise<ProjectDto> {
    return this.projectsService.archive(projectId, req.user.id);
  }
}
