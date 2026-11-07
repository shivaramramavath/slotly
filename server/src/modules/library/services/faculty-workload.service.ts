import { Injectable } from '@nestjs/common';
import type { FacultyWorkloadDto } from '@slotly/contracts';
import { Faculty } from '../schemas/faculty.schema';
import { Subject } from '../schemas/subject.schema';

@Injectable()
export class FacultyWorkloadService {
  computeWorkload(
    faculty: Faculty,
    assignedSubjects: Subject[] = [],
  ): FacultyWorkloadDto {
    const facultyId = faculty.id ?? (faculty._id as string)?.toString() ?? '';

    // Sum weekly hours for subjects assigned to this faculty
    const assignedHours = assignedSubjects.reduce(
      (sum, s) => sum + (s.weeklyHours || 0) + (s.labHours || 0),
      0,
    );

    const minHours = faculty.minHoursPerWeek || 0;
    const maxHours = faculty.maxHoursPerWeek || 20;
    const maxDaily = faculty.maxHoursPerDay || 6;

    let status: 'under' | 'optimal' | 'near' | 'over' = 'optimal';
    if (assignedHours < minHours) {
      status = 'under';
    } else if (assignedHours > maxHours) {
      status = 'over';
    } else if (assignedHours >= maxHours * 0.85) {
      status = 'near';
    } else {
      status = 'optimal';
    }

    const percentage =
      maxHours > 0 ? Math.round((assignedHours / maxHours) * 100) : 0;

    return {
      facultyId,
      facultyName: faculty.name,
      assignedHours,
      minHoursPerWeek: minHours,
      maxHoursPerWeek: maxHours,
      maxHoursPerDay: maxDaily,
      status,
      percentage,
    };
  }
}
