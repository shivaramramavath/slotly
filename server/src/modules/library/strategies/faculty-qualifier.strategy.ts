// Strategy implementation for faculty-qualifier.strategy.
import { Injectable } from '@nestjs/common';
import type {
  FacultyQualificationRequest,
  FacultyQualificationResult,
} from '@slotly/contracts';
import { Faculty } from '../schemas/faculty.schema';

/** Constant representing faculty qualifier. */
export const FACULTY_QUALIFIER = Symbol('FACULTY_QUALIFIER');

/** Interface defining structure for faculty qualifier. */
export interface IFacultyQualifier {
  qualify(
    faculty: Faculty,
    req: FacultyQualificationRequest,
  ): FacultyQualificationResult;
  findQualifiedFaculties(
    faculties: Faculty[],
    req: FacultyQualificationRequest,
  ): FacultyQualificationResult[];
}

/** Injectable service providing standard faculty qualifier logic. */
@Injectable()
export class StandardFacultyQualifier implements IFacultyQualifier {
  qualify(
    faculty: Faculty,
    req: FacultyQualificationRequest,
  ): FacultyQualificationResult {
    const facultyId = faculty.id ?? (faculty._id as string)?.toString() ?? '';
    const reasons: string[] = [];

    // 1. Subject qualification
    const hasSubjectQualification = faculty.subjectIds.includes(req.subjectId);
    if (!hasSubjectQualification) {
      reasons.push('NOT_QUALIFIED_FOR_SUBJECT');
    }

    // 2. Availability
    let availabilityFit = true;
    if (typeof req.day === 'number' && typeof req.period === 'number') {
      const dayAvail = faculty.availability?.[req.day];
      if (dayAvail && dayAvail[req.period] === false) {
        availabilityFit = false;
        reasons.push('FACULTY_UNAVAILABLE_IN_MATRIX');
      }

      if (faculty.unavailableSlots && faculty.unavailableSlots.length > 0) {
        const isUnavailable = faculty.unavailableSlots.some(
          (s) => s.day === req.day && s.period === req.period,
        );
        if (isUnavailable) {
          availabilityFit = false;
          reasons.push('FACULTY_UNAVAILABLE_SLOT_RESTRICTION');
        }
      }
    }

    // 3. Workload limits
    let workloadWithinLimits = true;
    if (
      typeof req.currentDailyHours === 'number' &&
      req.currentDailyHours >= faculty.maxHoursPerDay
    ) {
      workloadWithinLimits = false;
      reasons.push('EXCEEDS_DAILY_HOURS_LIMIT');
    }

    if (
      typeof req.currentWeeklyHours === 'number' &&
      req.currentWeeklyHours >= faculty.maxHoursPerWeek
    ) {
      workloadWithinLimits = false;
      reasons.push('EXCEEDS_WEEKLY_HOURS_LIMIT');
    }

    // 4. Preferred slot
    let isPreferredSlot = false;
    if (
      typeof req.day === 'number' &&
      typeof req.period === 'number' &&
      faculty.preferredPeriods &&
      faculty.preferredPeriods.length > 0
    ) {
      isPreferredSlot = faculty.preferredPeriods.some(
        (s) => s.day === req.day && s.period === req.period,
      );
    }

    const qualified =
      hasSubjectQualification &&
      availabilityFit &&
      workloadWithinLimits &&
      !faculty.archived &&
      !faculty.isDeleted;

    let score = 100;
    if (!hasSubjectQualification) score -= 60;
    if (!availabilityFit) score -= 50;
    if (!workloadWithinLimits) score -= 40;
    if (faculty.archived) score = 0;

    if (isPreferredSlot && qualified) {
      score = Math.min(100, score + 15);
    }

    return {
      facultyId,
      facultyName: faculty.name,
      facultyCode: faculty.code,
      qualified,
      hasSubjectQualification,
      availabilityFit,
      workloadWithinLimits,
      isPreferredSlot,
      reasons,
      score: Math.max(0, Math.min(100, score)),
    };
  }

  findQualifiedFaculties(
    faculties: Faculty[],
    req: FacultyQualificationRequest,
  ): FacultyQualificationResult[] {
    return faculties
      .map((f) => this.qualify(f, req))
      .filter((res) => res.qualified)
      .sort((a, b) => b.score - a.score);
  }
}
