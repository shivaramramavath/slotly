// HTTP controller providing administrative views for institutional timetables and reported conflicts.
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type RequestUser } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import type {
  AdminTimetableItemDto,
  AdminReportedConflictDto,
} from '@slotly/contracts';
import { AdminTimetablesService } from '../services/admin-timetables.service';

/** Administrative controller for institutional timetable status and conflict visibility. */
@Controller('admin')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminTimetablesController {
  constructor(private readonly timetablesService: AdminTimetablesService) {}

  /** Lists all timetable projects and publishing progress across the institution. */
  @Get('timetables')
  @RequirePermissions('TIMETABLE_READ')
  async listTimetables(
    @Req() req: { user: RequestUser },
  ): Promise<AdminTimetableItemDto[]> {
    return this.timetablesService.listTimetables(req.user.institutionId);
  }

  /** Lists all solver constraint violations and reported conflicts across all versions. */
  @Get('conflicts')
  @RequirePermissions('TIMETABLE_READ')
  async listConflicts(
    @Req() req: { user: RequestUser },
  ): Promise<AdminReportedConflictDto[]> {
    return this.timetablesService.listReportedConflicts(req.user.institutionId);
  }
}
