// HTTP controller exposing system operational health, queue depth telemetry, and job retries.
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import type {
  SystemHealthDto,
  QueuesHealthResponseDto,
} from '@slotly/contracts';
import { AdminSystemService } from '../services/admin-system.service';

/** Administrative controller governing platform infrastructure health and queues. */
@Controller('admin/system')
@UseGuards(AuthGuard, PermissionsGuard)
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  /** Retrieves platform operational health and resource metrics. */
  @Get('health')
  @RequirePermissions('SYSTEM_MONITOR')
  async getHealth(): Promise<SystemHealthDto> {
    return this.systemService.getSystemHealth();
  }

  /** Retrieves BullMQ queue status, backlog depths, and error counts. */
  @Get('queues')
  @RequirePermissions('SYSTEM_MONITOR')
  async getQueues(): Promise<QueuesHealthResponseDto> {
    return this.systemService.getQueuesHealth();
  }

  /** Triggers bulk retry of failed jobs within a specific queue. */
  @Post('queues/:queueName/retry-failed')
  @RequirePermissions('SYSTEM_MONITOR')
  async retryFailed(
    @Param('queueName') queueName: string,
  ): Promise<{ retried: number }> {
    return this.systemService.retryFailedJobs(queueName);
  }
}
