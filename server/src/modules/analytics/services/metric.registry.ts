// Registry pattern coordinating polymorphic timetable analytical metrics.
import { Injectable } from '@nestjs/common';
import type { AnalyticsMetricKey } from '@slotly/contracts';
import type { IAnalyticsMetric } from '../interfaces/analytics-metric.interface';
import { OverviewCountsMetric } from './metrics/overview-counts.metric';
import { FacultyWorkloadMetric } from './metrics/faculty-workload.metric';
import { RoomUtilizationMetric } from './metrics/room-utilization.metric';
import { SubjectAllocationMetric } from './metrics/subject-allocation.metric';
import { PeriodUtilizationMetric } from './metrics/period-utilization.metric';
import { FreePeriodsMetric } from './metrics/free-periods.metric';
import { DepartmentStatsMetric } from './metrics/department-stats.metric';
import { UnallocatedSubjectsMetric } from './metrics/unallocated-subjects.metric';
import { SchedulingEfficiencyMetric } from './metrics/scheduling-efficiency.metric';

/** Central registry holding all available analytical timetable metric strategies. */
@Injectable()
export class MetricRegistry {
  private readonly metrics = new Map<AnalyticsMetricKey, IAnalyticsMetric>();

  constructor(
    overviewCounts: OverviewCountsMetric,
    facultyWorkload: FacultyWorkloadMetric,
    roomUtilization: RoomUtilizationMetric,
    subjectAllocation: SubjectAllocationMetric,
    periodUtilization: PeriodUtilizationMetric,
    freePeriods: FreePeriodsMetric,
    departmentStats: DepartmentStatsMetric,
    unallocatedSubjects: UnallocatedSubjectsMetric,
    schedulingEfficiency: SchedulingEfficiencyMetric,
  ) {
    this.register(overviewCounts);
    this.register(facultyWorkload);
    this.register(roomUtilization);
    this.register(subjectAllocation);
    this.register(periodUtilization);
    this.register(freePeriods);
    this.register(departmentStats);
    this.register(unallocatedSubjects);
    this.register(schedulingEfficiency);
  }

  /** Registers a metric strategy into the registry. */
  register(metric: IAnalyticsMetric): void {
    this.metrics.set(metric.key, metric);
  }

  /** Retrieves a specific analytical metric calculator by key. */
  getMetric(key: AnalyticsMetricKey): IAnalyticsMetric | undefined {
    return this.metrics.get(key);
  }

  /** Lists all registered metric calculators. */
  getAllMetrics(): IAnalyticsMetric[] {
    return Array.from(this.metrics.values());
  }
}
