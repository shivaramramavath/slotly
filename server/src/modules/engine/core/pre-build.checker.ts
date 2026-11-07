import type { EngineInput, PreBuildCheckError } from './types';

export class PreBuildChecker {
  /**
   * Evaluates institutional preconditions before running the timetable solver.
   * Returns friendly, actionable, fixable error reports.
   */
  check(input: EngineInput): PreBuildCheckError[] {
    const errors: PreBuildCheckError[] = [];

    // 1. INSUFFICIENT_LAB_CAPACITY Check
    const labSubjects = input.subjects.filter((s) => s.type === 'lab');
    const labRooms = input.rooms.filter((r) => r.type === 'lab');

    const totalLabHoursNeeded = labSubjects.reduce(
      (sum, sub) => sum + (sub.weeklyHours || 2),
      0,
    );

    const workingDaysCount = input.settings.days.length || 5;
    const periodsPerDay = input.settings.periodsPerDay || 7;
    const breaksCount = (input.settings.breaks || []).length;
    const availablePeriodsPerDay = Math.max(1, periodsPerDay - breaksCount);
    const totalLabCapacity = labRooms.length * workingDaysCount * availablePeriodsPerDay;

    if (labRooms.length === 0 && labSubjects.length > 0) {
      errors.push({
        code: 'INSUFFICIENT_LAB_CAPACITY',
        message: `Project requires ${totalLabHoursNeeded} weekly laboratory hours, but no Laboratory rooms exist in the library.`,
        fixHint: { field: 'rooms' },
        details: { totalLabHoursNeeded, availableLabCapacity: 0, labRoomsCount: 0 },
      });
    } else if (totalLabHoursNeeded > totalLabCapacity) {
      errors.push({
        code: 'INSUFFICIENT_LAB_CAPACITY',
        message: `Insufficient lab capacity: ${totalLabHoursNeeded} weekly lab hours required, but only ${totalLabCapacity} hours available across ${labRooms.length} lab room(s).`,
        fixHint: { field: 'rooms' },
        details: { totalLabHoursNeeded, totalLabCapacity, labRoomsCount: labRooms.length },
      });
    }

    // 2. MISSING_ALLOCATION Check
    for (const section of input.sections) {
      if (input.subjects.length === 0) {
        errors.push({
          code: 'MISSING_ALLOCATION',
          message: `Section ${section.name} has no subjects assigned. Add subjects to the section curriculum before building.`,
          fixHint: { nodeId: section.id, field: 'subjects' },
        });
      }

      for (const subject of input.subjects) {
        const hasFaculty = subject.facultyIds && subject.facultyIds.length > 0;
        if (!hasFaculty) {
          errors.push({
            code: 'MISSING_ALLOCATION',
            message: `Subject ${subject.name} (${subject.code}) has no faculty instructor assigned.`,
            fixHint: { nodeId: subject.id, field: 'facultyId' },
            details: { sectionId: section.id, subjectId: subject.id },
          });
        }
      }
    }

    // 3. FACULTY_OVERLOAD Check
    const facultyWorkload = new Map<string, number>();
    for (const subject of input.subjects) {
      if (subject.facultyIds && subject.facultyIds.length > 0) {
        for (const facultyId of subject.facultyIds) {
          const current = facultyWorkload.get(facultyId) || 0;
          facultyWorkload.set(facultyId, current + (subject.weeklyHours || 3));
        }
      }
    }

    for (const [facultyId, totalHours] of facultyWorkload.entries()) {
      const faculty = input.faculty.find((f) => f.id === facultyId);
      const maxWeekly = faculty?.maxHoursPerWeek || 18;

      if (totalHours > maxWeekly) {
        errors.push({
          code: 'FACULTY_OVERLOAD',
          message: `Faculty ${faculty?.name || facultyId} is assigned ${totalHours} weekly hours, exceeding their maximum workload of ${maxWeekly}h/week.`,
          fixHint: { nodeId: facultyId, field: 'maxHoursPerWeek' },
          details: { facultyId, totalHours, maxWeekly },
        });
      }
    }

    // 4. INVALID_GRAPH Check
    if (input.sections.length === 0) {
      errors.push({
        code: 'INVALID_GRAPH',
        message: 'Blueprint contains no sections. At least one section is required to generate a schedule.',
        fixHint: { field: 'sections' },
      });
    }

    const invalidRooms = input.rooms.filter((r) => r.capacity <= 0);
    if (invalidRooms.length > 0) {
      errors.push({
        code: 'INVALID_GRAPH',
        message: `Found ${invalidRooms.length} room(s) with zero or negative seating capacity: ${invalidRooms.map((r) => r.name).join(', ')}.`,
        fixHint: { nodeId: invalidRooms[0]?.id, field: 'capacity' },
      });
    }

    return errors;
  }
}
