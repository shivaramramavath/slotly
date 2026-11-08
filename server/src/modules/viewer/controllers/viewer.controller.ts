// HTTP controller managing viewer timetable query endpoints.
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ViewerTimetableQueryDtoSchema,
  type ViewerTimetableDto,
  type ViewerTimetableQueryDto,
} from '@slotly/contracts';
import { ViewerService } from '../services/viewer.service';

/** Controller handling read-only published timetable viewer requests. */
@Controller('viewer')
@UseGuards(AuthGuard, PermissionsGuard)
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  /** Retrieves published timetable with live period context for an entity. */
  @Get('projects/:projectId/timetable')
  @RequirePermissions('TIMETABLE_READ')
  async getTimetable(
    @Param('projectId') projectId: string,
    @Query(new ZodValidationPipe(ViewerTimetableQueryDtoSchema))
    query: ViewerTimetableQueryDto,
  ): Promise<ViewerTimetableDto> {
    return this.viewerService.getTimetable(projectId, query);
  }

  /** Resolves landing timetable for currently authenticated faculty or student. */
  @Get('me')
  @RequirePermissions('TIMETABLE_READ')
  async getMyTimetable(
    @Req() req: { user: RequestUser },
  ): Promise<ViewerTimetableDto> {
    return this.viewerService.getLandingTimetable(
      req.user.id,
      req.user.role,
      req.user.email || '',
      req.user.institutionId,
    );
  }
}
