// Strategy implementation for high-level institutional overview counts metric.
import { Injectable } from '@nestjs/common';
import type {
  AnalyticsOverviewDto,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Calculates aggregate counts across faculty, rooms, departments, and active timetables. */
@Injectable()
export class OverviewCountsMetric implements IAnalyticsMetric<AnalyticsOverviewDto> {
  readonly key: AnalyticsMetricKey = 'overview_counts';

  calculate(context: MetricContext): AnalyticsOverviewDto {
    return {
      facultyCount: context.faculties.length,
      departmentCount: context.departments.length,
      roomCount: context.rooms.length,
      subjectCount: context.subjects.length,
      sectionCount: context.sections.length,
      generatedTimetablesCount: context.generatedCount || 0,
      publishedTimetablesCount: context.publishedCount || 0,
      openConflictsCount: context.conflictsCount || 0,
      calculatedAt: new Date().toISOString(),
    };
  }
}
