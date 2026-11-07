// HTTP controller handling template.controller endpoints.
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { TemplateService } from '../services/template.service';
import type {
  ApplyTemplateDto,
  BatchOperationResult,
  CreateGraphTemplateDto,
  GraphTemplateDto,
} from '@slotly/contracts';

/** Controller handling template controller HTTP endpoints. */
@Controller('blueprint-templates')
@UseGuards(AuthGuard, PermissionsGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @RequirePermissions('BLUEPRINT_READ')
  async list(
    @Request() req: { user: RequestUser },
  ): Promise<GraphTemplateDto[]> {
    return this.templateService.listTemplates(req.user?.institutionId);
  }

  @Post()
  @RequirePermissions('BLUEPRINT_TEMPLATE_MANAGE')
  async create(
    @Body() dto: CreateGraphTemplateDto,
    @Request() req: { user: RequestUser },
  ): Promise<GraphTemplateDto> {
    return this.templateService.createTemplate(
      dto,
      req.user.id,
      req.user.institutionId,
    );
  }

  @Get(':templateId')
  @RequirePermissions('BLUEPRINT_READ')
  async getById(
    @Param('templateId') templateId: string,
  ): Promise<GraphTemplateDto | null> {
    return this.templateService.getTemplate(templateId);
  }

  @Post(':templateId/apply')
  @RequirePermissions('BLUEPRINT_EDIT')
  async apply(
    @Param('templateId') templateId: string,
    @Query('projectId') projectId: string,
    @Body() dto: ApplyTemplateDto,
    @Request() req: { user: RequestUser },
  ): Promise<BatchOperationResult> {
    return this.templateService.applyTemplate(
      projectId,
      templateId,
      dto.anchorNodeId,
      req.user.id,
    );
  }

  @Post(':templateId/duplicate')
  @RequirePermissions('BLUEPRINT_TEMPLATE_MANAGE')
  async duplicate(
    @Param('templateId') templateId: string,
    @Request() req: { user: RequestUser },
  ): Promise<GraphTemplateDto> {
    return this.templateService.duplicateTemplate(templateId, req.user.id);
  }

  @Get(':templateId/export')
  @RequirePermissions('BLUEPRINT_READ')
  async export(
    @Param('templateId') templateId: string,
  ): Promise<GraphTemplateDto | null> {
    return this.templateService.getTemplate(templateId);
  }

  @Post('import')
  @RequirePermissions('BLUEPRINT_TEMPLATE_MANAGE')
  async import(
    @Body() dto: CreateGraphTemplateDto,
    @Request() req: { user: RequestUser },
  ): Promise<GraphTemplateDto> {
    return this.templateService.createTemplate(
      dto,
      req.user.id,
      req.user.institutionId,
    );
  }
}
