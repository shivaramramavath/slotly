import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { EngineValidationService } from '../services/engine-validation.service';
import type {
  ValidateProjectDto,
  ValidateVersionDto,
  ValidationReportDto,
} from '@slotly/contracts';

@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class EngineController {
  constructor(
    private readonly engineValidationService: EngineValidationService,
  ) {}

  @Post('projects/:projectId/validate')
  @RequirePermissions('BLUEPRINT_READ')
  async validateProject(
    @Param('projectId') projectId: string,
    @Body() dto: ValidateProjectDto,
  ): Promise<ValidationReportDto> {
    return this.engineValidationService.validateProject(
      projectId,
      dto?.slots || [],
    );
  }

  @Post('versions/:versionId/validate')
  @RequirePermissions('PROJECT_READ')
  async validateVersion(
    @Param('versionId') versionId: string,
    @Body() dto: ValidateVersionDto,
  ): Promise<ValidationReportDto> {
    return this.engineValidationService.validateVersion(
      versionId,
      dto?.slots || [],
    );
  }
}
