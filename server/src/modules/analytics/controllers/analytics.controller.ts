// HTTP controller exposing analytics and workload balancing endpoints.
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { PermissionsGuard } from '../../../common/rbac/permissions.guard';
import { RequirePermissions } from '../../../common/rbac/roles.decorator';
import { AnalyticsService } from '../services/analytics.service';
import type {
  AnalyticsMetricKey,
  AnalyticsOverviewDto,
  WorkloadBalancingSuggestionsResponse,
} from '@slotly/contracts';

/** Controller exposing analytics metrics, counts, and workload balancing suggestions. */
@Controller('analytics')
@UseGuards(AuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Retrieves overview timetable counts and utilization. */
  @Get('projects/:projectId/overview')
  @RequirePermissions('ANALYTICS_READ')
  async getOverview(
    @Param('projectId') projectId: string,
  ): Promise<AnalyticsOverviewDto> {
    return this.analyticsService.getOverview(projectId);
  }

  /** Retrieves all calculated analytical metrics for a project. */
  @Get('projects/:projectId/metrics')
  @RequirePermissions('ANALYTICS_READ')
  async getAllMetrics(
    @Param('projectId') projectId: string,
  ): Promise<Record<string, unknown>> {
    return this.analyticsService.getAllMetrics(projectId);
  }

  /** Retrieves a specific analytical metric by key. */
  @Get('projects/:projectId/metrics/:metric')
  @RequirePermissions('ANALYTICS_READ')
  async getMetric(
    @Param('projectId') projectId: string,
    @Param('metric') metric: AnalyticsMetricKey,
  ): Promise<unknown> {
    return this.analyticsService.getMetric(projectId, metric);
  }

  /** Retrieves non-destructive faculty workload balancing suggestions. */
  @Get('projects/:projectId/balancing-suggestions')
  @RequirePermissions('ANALYTICS_READ')
  async getBalancingSuggestions(
    @Param('projectId') projectId: string,
  ): Promise<WorkloadBalancingSuggestionsResponse> {
    return this.analyticsService.getBalancingSuggestions(projectId);
  }
}
