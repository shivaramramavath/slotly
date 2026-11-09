// Strategy implementation computing departmental workload, section counts, and resource aggregates.
import { Injectable } from '@nestjs/common';
import type {
  DepartmentStatsDto,
  DepartmentStatsItem,
  AnalyticsMetricKey,
} from '@slotly/contracts';
import type {
  IAnalyticsMetric,
  MetricContext,
} from '../../interfaces/analytics-metric.interface';

/** Summarizes resource counts and teaching hours aggregated by academic department. */
@Injectable()
export class DepartmentStatsMetric implements IAnalyticsMetric<DepartmentStatsDto> {
  readonly key: AnalyticsMetricKey = 'department_stats';

  calculate(context: MetricContext): DepartmentStatsDto {
    const items: DepartmentStatsItem[] = [];

    for (const dept of context.departments) {
      const deptId =
        (dept as unknown as { _id?: { toString(): string } })._id?.toString() ||
        dept.id ||
        '';

      const facultyCount = context.faculties.filter(
        (f) => f.departmentId === deptId,
      ).length;

      const deptFacultyIds = new Set(
        context.faculties
          .filter((f) => f.departmentId === deptId)
          .map(
            (f) =>
              (
                f as unknown as { _id?: { toString(): string } }
              )._id?.toString() ||
              f.id ||
              '',
          ),
      );

      const deptSubjectIds = new Set(
        context.subjects
          .filter((s) => s.departmentId === deptId)
          .map(
            (s) =>
              (
                s as unknown as { _id?: { toString(): string } }
              )._id?.toString() ||
              s.id ||
              '',
          ),
      );

      const deptSections = context.sections.filter(
        (s) =>
          (s as unknown as { departmentId?: string }).departmentId === deptId,
      );
      const sectionsCount = deptSections.length;

      const deptSectionIds = new Set(
        deptSections.map(
          (s) =>
            (
              s as unknown as { _id?: { toString(): string } }
            )._id?.toString() ||
            s.id ||
            '',
        ),
      );

      const roomsCount = context.rooms.filter(
        (r) =>
          (r as unknown as { departmentId?: string }).departmentId === deptId,
      ).length;

      const totalWeeklyHours = context.entries
        .filter(
          (e) =>
            deptSectionIds.has(e.sectionId) ||
            (e.subjectId && deptSubjectIds.has(e.subjectId)) ||
            (e.facultyId && deptFacultyIds.has(e.facultyId)),
        )
        .reduce((sum, e) => sum + (e.span || 1), 0);

      items.push({
        departmentId: deptId,
        departmentName: dept.name,
        sectionsCount,
        facultyCount,
        roomsCount,
        totalWeeklyHours,
      });
    }

    return { items };
  }
}
