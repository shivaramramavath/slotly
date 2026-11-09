// NestJS module configuring analytics services, metrics registry, and queue processing.
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { MetricRegistry } from './services/metric.registry';
import { WorkloadBalancerService } from './services/workload-balancer.service';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { OverviewCountsMetric } from './services/metrics/overview-counts.metric';
import { FacultyWorkloadMetric } from './services/metrics/faculty-workload.metric';
import { RoomUtilizationMetric } from './services/metrics/room-utilization.metric';
import { SubjectAllocationMetric } from './services/metrics/subject-allocation.metric';
import { PeriodUtilizationMetric } from './services/metrics/period-utilization.metric';
import { FreePeriodsMetric } from './services/metrics/free-periods.metric';
import { DepartmentStatsMetric } from './services/metrics/department-stats.metric';
import { UnallocatedSubjectsMetric } from './services/metrics/unallocated-subjects.metric';
import { SchedulingEfficiencyMetric } from './services/metrics/scheduling-efficiency.metric';
import { ProjectsModule } from '../projects/projects.module';
import { BuildsModule } from '../builds/builds.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { LibraryModule } from '../library/library.module';
import { InstitutionsModule } from '../institutions/institutions.module';

/** NestJS module providing analytics metric evaluation and workload balancing endpoints. */
@Module({
  imports: [
    ProjectsModule,
    BuildsModule,
    SchedulesModule,
    LibraryModule,
    InstitutionsModule,
    BullModule.registerQueue({ name: 'analytics' }),
  ],
  controllers: [AnalyticsController],
  providers: [
    OverviewCountsMetric,
    FacultyWorkloadMetric,
    RoomUtilizationMetric,
    SubjectAllocationMetric,
    PeriodUtilizationMetric,
    FreePeriodsMetric,
    DepartmentStatsMetric,
    UnallocatedSubjectsMetric,
    SchedulingEfficiencyMetric,
    MetricRegistry,
    WorkloadBalancerService,
    AnalyticsService,
    AnalyticsProcessor,
  ],
  exports: [AnalyticsService, MetricRegistry, WorkloadBalancerService],
})
export class AnalyticsModule {}
