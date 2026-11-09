// Strategy implementation tracking syllabus allocation and weekly hours fulfillment.
import { Injectable } from '@nestjs/common';
import type {
  SubjectAllocationDto,
  SubjectAllocationItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Evaluates weekly scheduled hours versus prescribed syllabus requirements per subject. */
@Injectable()
export class SubjectAllocationMetric implements IAnalyticsMetric<SubjectAllocationDto> {
  readonly key: AnalyticsMetricKey = 'subject_allocation';

  calculate(context: MetricContext): SubjectAllocationDto {
    const items: SubjectAllocationItem[] = [];

    for (const subject of context.subjects) {
      const subjectId =
        (
          subject as unknown as { _id?: { toString(): string } }
        )._id?.toString() ||
        subject.id ||
        '';

      const subjectEntries = context.entries.filter(
        (e) => e.subjectId === subjectId,
      );
      const allocatedHours = subjectEntries.reduce(
        (sum, e) => sum + (e.span || 1),
        0,
      );

      const requiredWeeklyHours =
        (subject as unknown as { weeklyHours?: number }).weeklyHours ||
        (subject as unknown as { weeklyPeriods?: number }).weeklyPeriods ||
        4;

      const fulfillmentPercentage =
        requiredWeeklyHours > 0
          ? Math.min(
              100,
              Math.round((allocatedHours / requiredWeeklyHours) * 1000) / 10,
            )
          : 100;

      items.push({
        subjectId,
        subjectName: subject.name,
        departmentId: subject.departmentId || undefined,
        requiredWeeklyHours,
        allocatedHours,
        fulfillmentPercentage,
      });
    }

    const fullyAllocatedCount = items.filter(
      (i) => i.fulfillmentPercentage >= 100,
    ).length;
    const partiallyAllocatedCount = items.length - fullyAllocatedCount;

    return {
      items,
      fullyAllocatedCount,
      partiallyAllocatedCount,
    };
  }
}
