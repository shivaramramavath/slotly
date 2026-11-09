// Strategy interface and context definitions for analytical timetable metrics.
import type {
  AnalyticsMetricKey,
  ProjectSettings,
  ScheduleEntryDto,
} from '@slotly/contracts';
import type { Faculty } from '../../library/schemas/faculty.schema';
import type { Room } from '../../library/schemas/room.schema';
import type { Subject } from '../../library/schemas/subject.schema';
import type { Section } from '../../institutions/schemas/section.schema';
import type { Department } from '../../institutions/schemas/department.schema';

/** Execution context supplied to analytical metric calculators. */
export interface MetricContext {
  projectId: string;
  institutionId: string;
  versionId: string;
  entries: ScheduleEntryDto[];
  settings: ProjectSettings;
  faculties: Faculty[];
  rooms: Room[];
  subjects: Subject[];
  sections: Section[];
  departments: Department[];
  generatedCount?: number;
  publishedCount?: number;
  conflictsCount?: number;
}

/** Strategy contract defining an analytical metric calculation. */
export interface IAnalyticsMetric<T = unknown> {
  readonly key: AnalyticsMetricKey;
  calculate(context: MetricContext): Promise<T> | T;
}
