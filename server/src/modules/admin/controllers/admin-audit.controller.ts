// HTTP controller handling audit log queries and CSV export triggers.
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  AuditQueryDtoSchema,
  type AuditQueryDto,
  type AuditLogListDto,
} from '@slotly/contracts';
import { AuditService } from '../../../common/audit/audit.service';

/** Administrative controller for querying and exporting security and system audit logs. */
@Controller('admin/audit-logs')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminAuditController {
  constructor(
    private readonly auditService: AuditService,
    @Optional() @InjectQueue('exports') private readonly exportsQueue?: Queue,
  ) {}

  /** Queries indexed audit logs with filtering and pagination. */
  @Get()
  @RequirePermissions('SYSTEM_MONITOR')
  async queryAuditLogs(
    @Query(new ZodValidationPipe(AuditQueryDtoSchema)) query: AuditQueryDto,
  ): Promise<AuditLogListDto> {
    const result = await this.auditService.queryLogs(query);
    return {
      items: result.items,
      total: result.total,
      page: query.page ?? 1,
      limit: query.limit ?? 50,
    };
  }

  /** Triggers a background CSV export of filtered audit events via the exports queue. */
  @Post('export')
  @RequirePermissions('SYSTEM_MONITOR')
  async exportAuditLogs(
    @Body(new ZodValidationPipe(AuditQueryDtoSchema)) query: AuditQueryDto,
  ): Promise<{ message: string; jobId?: string | undefined }> {
    if (this.exportsQueue) {
      const job = await this.exportsQueue.add('export-audit-csv', {
        type: 'audit_logs',
        query,
      });
      return {
        message: 'Audit log export job enqueued successfully',
        jobId: job.id,
      };
    }

    return {
      message: 'Export service acknowledged request',
    };
  }
}
