// HTTP controller managing authenticated share links for timetables.
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateShareDtoSchema,
  type CreateShareDto,
  type ShareDto,
} from '@slotly/contracts';
import { SharesService } from '../services/shares.service';
import { ShareRepository } from '../repositories/share.repository';

/** Controller exposing authenticated endpoints to manage timetable share links. */
@Controller('shares')
@UseGuards(AuthGuard, PermissionsGuard)
export class SharesController {
  constructor(
    private readonly sharesService: SharesService,
    private readonly shareRepo: ShareRepository,
  ) {}

  /** Creates a new revocable share link for a project. */
  @Post('projects/:projectId')
  @RequirePermissions('TIMETABLE_SHARE')
  async createShare(
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(CreateShareDtoSchema))
    dto: CreateShareDto,
    @Req() req: { user: RequestUser },
  ): Promise<ShareDto> {
    return this.sharesService.createShare(
      projectId,
      req.user.institutionId || '',
      req.user.id,
      dto,
    );
  }

  /** Lists share links for a project. */
  @Get('projects/:projectId')
  @RequirePermissions('TIMETABLE_READ')
  async listShares(@Param('projectId') projectId: string): Promise<ShareDto[]> {
    return this.sharesService.listShares(projectId);
  }

  /** Revokes a share link. */
  @Delete(':shareId')
  @RequirePermissions('TIMETABLE_SHARE')
  async revokeShare(
    @Param('shareId') shareId: string,
    @Req() req: { user: RequestUser },
  ): Promise<{ success: boolean }> {
    const share = await this.shareRepo.findById(shareId);
    if (!share) {
      throw new NotFoundException(`Share link "${shareId}" not found`);
    }
    await this.sharesService.revokeShare(share.projectId, shareId, req.user.id);
    return { success: true };
  }
}
