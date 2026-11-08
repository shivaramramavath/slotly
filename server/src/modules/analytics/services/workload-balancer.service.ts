// Workload balancing recommendation service proposing load transfers between faculties.
import { Injectable } from '@nestjs/common';
import type {
  WorkloadBalancingSuggestion,
  WorkloadBalancingSuggestionsResponse,
} from '@slotly/contracts';
import type { MetricContext } from '../interfaces/analytics-metric.interface';

/** Service calculating non-destructive suggestions to balance teaching workloads across faculty. */
@Injectable()
export class WorkloadBalancerService {
  /**
   * Generates workload rebalancing suggestions for a schedule without mutating any entries.
   *
   * @param context Metric evaluation context with schedule entries and institution library.
   * @returns List of proposed transfers and overall imbalance score.
   */
  suggestBalancing(
    context: MetricContext,
  ): WorkloadBalancingSuggestionsResponse {
    const { faculties, entries, subjects, sections } = context;

    if (!faculties.length || !entries.length) {
      return { suggestions: [], imbalanceScore: 0 };
    }

    const subjectMap = new Map(subjects.map((s) => [String(s.id ?? s._id), s]));
    const sectionMap = new Map(
      sections.map((sec) => [String(sec.id ?? sec._id), sec]),
    );

    // Calculate current scheduled hours per faculty
    const scheduledHours = new Map<string, number>();
    for (const f of faculties) {
      scheduledHours.set(String(f.id ?? f._id), 0);
    }

    for (const entry of entries) {
      if (entry.facultyId && scheduledHours.has(entry.facultyId)) {
        const span = entry.span ?? 1;
        scheduledHours.set(
          entry.facultyId,
          (scheduledHours.get(entry.facultyId) ?? 0) + span,
        );
      }
    }

    // Identify overloaded and underloaded faculties
    interface FacultyLoadInfo {
      id: string;
      name: string;
      departmentId: string;
      scheduled: number;
      target: number;
      difference: number;
      subjectIds: string[];
    }

    const overloaded: FacultyLoadInfo[] = [];
    const underloaded: FacultyLoadInfo[] = [];
    const loadRatios: number[] = [];

    for (const f of faculties) {
      const fId = String(f.id ?? f._id);
      const scheduled = scheduledHours.get(fId) ?? 0;
      const target =
        f.maxHoursPerWeek && f.maxHoursPerWeek > 0 ? f.maxHoursPerWeek : 18;
      const difference = scheduled - target;
      loadRatios.push(target > 0 ? scheduled / target : 1);

      const info: FacultyLoadInfo = {
        id: fId,
        name: f.name,
        departmentId: String(f.departmentId),
        scheduled,
        target,
        difference,
        subjectIds: (f.subjectIds ?? []).map(String),
      };

      if (difference > 0) {
        overloaded.push(info);
      } else if (difference < 0) {
        underloaded.push(info);
      }
    }

    // Sort overloaded descending by excess hours, underloaded ascending by ratio (most spare capacity first)
    overloaded.sort((a, b) => b.difference - a.difference);
    underloaded.sort((a, b) => a.scheduled / a.target - b.scheduled / b.target);

    const suggestions: WorkloadBalancingSuggestion[] = [];

    // For each overloaded faculty, inspect their assigned subject/sections in entries
    for (const source of overloaded) {
      let excessToTransfer = source.difference;
      if (excessToTransfer <= 0) continue;

      // Group source's entries by (subjectId, sectionId)
      const assignmentHours = new Map<
        string,
        { subjectId: string; sectionId: string; hours: number }
      >();
      for (const entry of entries) {
        if (
          entry.facultyId === source.id &&
          entry.subjectId &&
          entry.sectionId
        ) {
          const key = `${entry.subjectId}::${entry.sectionId}`;
          const current = assignmentHours.get(key) ?? {
            subjectId: entry.subjectId,
            sectionId: entry.sectionId,
            hours: 0,
          };
          current.hours += entry.span ?? 1;
          assignmentHours.set(key, current);
        }
      }

      // Try matching assignments to qualified underloaded faculty
      for (const assignment of assignmentHours.values()) {
        if (excessToTransfer <= 0) break;

        const candidateTarget = underloaded.find((target) => {
          // Check capacity
          const spareHours = target.target - target.scheduled;
          if (spareHours < assignment.hours) return false;

          // Check subject qualification or same department
          const qualified =
            target.subjectIds.includes(assignment.subjectId) ||
            target.departmentId === source.departmentId;

          return qualified;
        });

        if (candidateTarget) {
          const subject = subjectMap.get(assignment.subjectId);
          const section = sectionMap.get(assignment.sectionId);

          suggestions.push({
            id: `sug_${source.id}_${candidateTarget.id}_${assignment.subjectId}_${assignment.sectionId}`,
            fromFacultyId: source.id,
            fromFacultyName: source.name,
            toFacultyId: candidateTarget.id,
            toFacultyName: candidateTarget.name,
            subjectId: assignment.subjectId,
            subjectName: subject?.name ?? assignment.subjectId,
            sectionId: assignment.sectionId,
            sectionName: section?.name ?? assignment.sectionId,
            hoursToTransfer: assignment.hours,
            reason: `${source.name} is ${source.difference}h over max load (${source.scheduled}h / ${source.target}h). ${candidateTarget.name} has ${candidateTarget.target - candidateTarget.scheduled}h available capacity in the same department/discipline.`,
          });

          // Adjust simulated numbers
          excessToTransfer -= assignment.hours;
          candidateTarget.scheduled += assignment.hours;
        }
      }
    }

    // Compute imbalance score: coefficient of variation or normalized deviation (0 - 100)
    const meanRatio =
      loadRatios.reduce((sum, r) => sum + r, 0) / (loadRatios.length || 1);
    const variance =
      loadRatios.reduce((sum, r) => sum + Math.pow(r - meanRatio, 2), 0) /
      (loadRatios.length || 1);
    const stdDev = Math.sqrt(variance);
    const imbalanceScore = Math.min(100, Math.round(stdDev * 100));

    return {
      suggestions,
      imbalanceScore,
    };
  }
}
