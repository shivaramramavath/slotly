// Strategy implementation computing faculty idle time and unassigned periods across days.
import { Injectable } from '@nestjs/common';
import type {
  FacultyFreePeriodsDto,
  FacultyFreePeriodsItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Identifies unscheduled and idle periods for instructors across academic term days. */
@Injectable()
export class FreePeriodsMetric implements IAnalyticsMetric<FacultyFreePeriodsDto> {
  readonly key: AnalyticsMetricKey = 'free_periods';

  calculate(context: MetricContext): FacultyFreePeriodsDto {
    const items: FacultyFreePeriodsItem[] = [];
    const days = context.settings.days || [1, 2, 3, 4, 5];
    const periodsPerDay = context.settings.periodsPerDay || 7;

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

      const freePeriodsByDay: Record<string, number[]> = {};
      let freePeriodsCount = 0;

      for (const d of days) {
        const dayEntries = facultyEntries.filter((e) => e.day === d);
        const freeInDay: number[] = [];

        for (let p = 1; p <= periodsPerDay; p++) {
          const isOccupied = dayEntries.some(
            (e) => e.startPeriod <= p && e.startPeriod + (e.span || 1) > p,
          );
          if (!isOccupied) {
            freeInDay.push(p);
            freePeriodsCount++;
          }
        }

        freePeriodsByDay[String(d)] = freeInDay;
      }

      items.push({
        facultyId: facId,
        facultyName: faculty.name,
        freePeriodsCount,
        freePeriodsByDay,
      });
    }

    return { items };
  }
}
