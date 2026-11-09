// Strategy implementation calculating faculty workload distribution and load balance status.
import { Injectable } from '@nestjs/common';
import type {
  FacultyWorkloadDistributionDto,
  FacultyWorkloadDistributionItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Analyzes scheduled teaching hours against contractual target hours per instructor. */
@Injectable()
export class FacultyWorkloadMetric implements IAnalyticsMetric<FacultyWorkloadDistributionDto> {
  readonly key: AnalyticsMetricKey = 'faculty_workload';

  calculate(context: MetricContext): FacultyWorkloadDistributionDto {
    const items: FacultyWorkloadDistributionItem[] = [];
    let totalScheduled = 0;

    for (const faculty of context.faculties) {
      const facId =
        (
          faculty as unknown as { _id?: { toString(): string } }
        )._id?.toString() ||
        faculty.id ||
        '';

      const facultyEntries = context.entries.filter(
        (e) => e.facultyId === facId,
      );
      const scheduledHours = facultyEntries.reduce(
        (sum, e) => sum + (e.span || 1),
        0,
      );
      totalScheduled += scheduledHours;

      const targetHours =
        (faculty as unknown as { targetWeeklyHours?: number })
          .targetWeeklyHours || 18;
      const deltaHours = scheduledHours - targetHours;

      let status: 'underloaded' | 'balanced' | 'overloaded' = 'balanced';
      if (deltaHours > 0) {
        status = 'overloaded';
      } else if (deltaHours < -2) {
        status = 'underloaded';
      }

      const dept = context.departments.find(
        (d) =>
          ((d as unknown as { _id?: { toString(): string } })._id?.toString() ||
            d.id) === faculty.departmentId,
      );

      items.push({
        facultyId: facId,
        facultyName: faculty.name,
        departmentId: faculty.departmentId || undefined,
        departmentName: dept?.name || undefined,
        targetHours,
        scheduledHours,
        deltaHours,
        status,
      });
    }

    const count = items.length || 1;
    const averageScheduledHours =
      Math.round((totalScheduled / count) * 10) / 10;
    const overloadedCount = items.filter(
      (i) => i.status === 'overloaded',
    ).length;
    const underloadedCount = items.filter(
      (i) => i.status === 'underloaded',
    ).length;
    const balancedCount = items.filter((i) => i.status === 'balanced').length;

    return {
      items,
      averageScheduledHours,
      overloadedCount,
      underloadedCount,
      balancedCount,
    };
  }
}
