// HTTP controller handling blueprint.controller endpoints.
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { BlueprintService } from '../services/blueprint.service';
import type {
  ApplyOperationsDto,
  BatchOperationResult,
  BlueprintCommentDto,
  BlueprintGraphDto,
  BlueprintHistoryEntryDto,
  BlueprintImpactDto,
  BlueprintReadinessDto,
  BlueprintRecommendationDto,
  BlueprintSnapshotDto,
  CreateBlueprintCommentDto,
  CreateBlueprintSnapshotDto,
  PoolItemType,
  PoolOpPayload,
  ResolvedPool,
} from '@slotly/contracts';

/** Controller handling blueprint controller HTTP endpoints. */
@Controller('projects/:projectId/blueprint')
@UseGuards(AuthGuard, PermissionsGuard)
export class BlueprintController {
  constructor(private readonly blueprintService: BlueprintService) {}

  @Get()
  @RequirePermissions('BLUEPRINT_READ')
  async getGraph(
    @Param('projectId') projectId: string,
  ): Promise<BlueprintGraphDto> {
    return this.blueprintService.getGraph(projectId);
  }

  @Get('readiness')
  @RequirePermissions('BLUEPRINT_READ')
  async getReadiness(
    @Param('projectId') projectId: string,
  ): Promise<BlueprintReadinessDto> {
    return this.blueprintService.getReadiness(projectId);
  }

  @Get('nodes/:nodeId/impact')
  @RequirePermissions('BLUEPRINT_READ')
  async getImpact(
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<BlueprintImpactDto> {
    return this.blueprintService.getImpact(projectId, nodeId);
  }

  @Get('nodes/:nodeId/pool')
  @RequirePermissions('BLUEPRINT_READ')
  async getNodePool(
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<ResolvedPool> {
    return this.blueprintService.getNodePool(projectId, nodeId);
  }

  @Post('nodes/:nodeId/pool')
  @RequirePermissions('BLUEPRINT_EDIT')
  async mutatePool(
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
    @Body() payload: PoolOpPayload,
    @Request() req: { user: RequestUser },
  ) {
    payload.nodeId = nodeId;
    payload.projectId = projectId;
    return this.blueprintService.mutatePool(projectId, payload, req.user.id);
  }

  @Get('where-used')
  @RequirePermissions('BLUEPRINT_READ')
  async getWhereUsed(
    @Param('projectId') projectId: string,
    @Query('refType') refType: PoolItemType,
    @Query('refId') refId: string,
  ) {
    return this.blueprintService.getWhereUsed(projectId, refType, refId);
  }

  @Post('operations')
  @RequirePermissions('BLUEPRINT_EDIT')
  async applyOperations(
    @Param('projectId') projectId: string,
    @Body() dto: ApplyOperationsDto,
    @Headers('if-match') ifMatch: string | undefined,
    @Request() req: { user: RequestUser },
  ): Promise<BatchOperationResult> {
    if (ifMatch && typeof dto.clientRevision !== 'number') {
      dto.clientRevision = parseInt(ifMatch, 10);
    }
    return this.blueprintService.applyOperations(projectId, dto, req.user.id);
  }

  @Get('history')
  @RequirePermissions('BLUEPRINT_READ')
  async getHistory(
    @Param('projectId') projectId: string,
  ): Promise<BlueprintHistoryEntryDto[]> {
    return this.blueprintService.getHistory(projectId);
  }

  @Get('recommendations')
  @RequirePermissions('BLUEPRINT_READ')
  async getRecommendations(
    @Param('projectId') projectId: string,
    @Query('nodeId') nodeId?: string,
  ): Promise<BlueprintRecommendationDto[]> {
    return this.blueprintService.getRecommendations(projectId, nodeId);
  }

  @Get('export')
  @RequirePermissions('BLUEPRINT_READ')
  async export(
    @Param('projectId') projectId: string,
    @Query('format') format?: 'json' | 'svg' | 'png',
  ) {
    return this.blueprintService.exportGraph(projectId, format || 'json');
  }

  @Post('import')
  @RequirePermissions('BLUEPRINT_EDIT')
  async import(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: { user: RequestUser },
  ): Promise<BatchOperationResult> {
    return this.blueprintService.importGraph(projectId, body, req.user.id);
  }

  @Get('nodes/:nodeId/comments')
  @RequirePermissions('BLUEPRINT_READ')
  async getComments(
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<BlueprintCommentDto[]> {
    return this.blueprintService.getComments(projectId, nodeId);
  }

  @Post('nodes/:nodeId/comments')
  @RequirePermissions('BLUEPRINT_EDIT')
  async addComment(
    @Param('projectId') projectId: string,
    @Param('nodeId') nodeId: string,
    @Body() dto: CreateBlueprintCommentDto,
    @Request() req: { user: RequestUser },
  ): Promise<BlueprintCommentDto> {
    return this.blueprintService.addComment(
      projectId,
      nodeId,
      req.user.id,
      req.user.email || 'User',
      dto.text,
    );
  }

  @Post('snapshots')
  @RequirePermissions('BLUEPRINT_EDIT')
  async createSnapshot(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBlueprintSnapshotDto,
  ): Promise<BlueprintSnapshotDto> {
    return this.blueprintService.createSnapshot(projectId, dto.label);
  }

  @Get('snapshots')
  @RequirePermissions('BLUEPRINT_READ')
  async listSnapshots(
    @Param('projectId') projectId: string,
  ): Promise<BlueprintSnapshotDto[]> {
    return this.blueprintService.listSnapshots(projectId);
  }

  @Post('snapshots/:snapshotId/restore')
  @RequirePermissions('BLUEPRINT_EDIT')
  async restoreSnapshot(
    @Param('projectId') projectId: string,
    @Param('snapshotId') snapshotId: string,
  ): Promise<BlueprintGraphDto> {
    return this.blueprintService.restoreSnapshot(projectId, snapshotId);
  }

  @Get('snapshots/:snapshotId/compare')
  @RequirePermissions('BLUEPRINT_READ')
  async compareSnapshot(
    @Param('projectId') projectId: string,
    @Param('snapshotId') snapshotId: string,
  ) {
    return this.blueprintService.compareSnapshot(projectId, snapshotId);
  }
}
