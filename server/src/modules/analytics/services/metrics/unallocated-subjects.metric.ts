// Strategy implementation detecting curriculum gaps and unallocated subject hours.
import { Injectable } from '@nestjs/common';
import type {
  UnallocatedSubjectsDto,
  UnallocatedSubjectItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Identifies curriculum subjects where required weekly contact hours remain unallocated in schedule. */
@Injectable()
export class UnallocatedSubjectsMetric implements IAnalyticsMetric<UnallocatedSubjectsDto> {
  readonly key: AnalyticsMetricKey = 'unallocated_subjects';

  calculate(context: MetricContext): UnallocatedSubjectsDto {
    const items: UnallocatedSubjectItem[] = [];
    let totalUnallocatedHours = 0;

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

      const requiredHours =
        (subject as unknown as { weeklyHours?: number }).weeklyHours ||
        (subject as unknown as { weeklyPeriods?: number }).weeklyPeriods ||
        4;

      const unallocatedHours = Math.max(0, requiredHours - allocatedHours);

      if (unallocatedHours > 0) {
        totalUnallocatedHours += unallocatedHours;
        items.push({
          subjectId,
          subjectName: subject.name,
          departmentId: subject.departmentId || undefined,
          requiredHours,
          allocatedHours,
          unallocatedHours,
        });
      }
    }

    return {
      items,
      totalUnallocatedHours,
    };
  }
}
