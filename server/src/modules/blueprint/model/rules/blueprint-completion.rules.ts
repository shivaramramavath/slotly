// Core implementation for blueprint-completion.rules in server/src/modules/blueprint/model/rules.
import type { MissingField } from '@slotly/contracts';
import type {
  CompletionContext,
  CompletionResult,
  CompletionRuleStrategy,
} from '../completion-rule.strategy';

function str(val: unknown): string {
  return typeof val === 'string' ? val.trim() : '';
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

/** Class implementing institution completion rule. */
export class InstitutionCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const code = str(data['code']);
    const workingDays = Array.isArray(data['workingDays'])
      ? data['workingDays']
      : [];
    const periodConfig = data['periodConfig'] as
      Record<string, unknown> | undefined;

    if (!name || name.length < 2) {
      missing.push({
        field: 'name',
        message: 'Institution name is required (min 2 chars)',
      });
    }
    if (!code || code.length < 2) {
      missing.push({
        field: 'code',
        message: 'Institution code is required (min 2 chars)',
      });
    }
    if (workingDays.length === 0) {
      missing.push({
        field: 'workingDays',
        message: 'At least one working day must be selected',
      });
    }
    if (
      !periodConfig ||
      !str(periodConfig['startTime']) ||
      num(periodConfig['periodsPerDay']) <= 0
    ) {
      missing.push({
        field: 'periodConfig',
        message:
          'Default period configuration (start time and periods) is required',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing department completion rule. */
export class DepartmentCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const code = str(data['code']);

    if (!name || name.length < 2) {
      missing.push({ field: 'name', message: 'Department name is required' });
    }
    if (!code) {
      missing.push({ field: 'code', message: 'Department code is required' });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing program completion rule. */
export class ProgramCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const duration = num(
      data['durationYears'] ?? data['durationInYears'] ?? data['duration'],
    );

    if (!name || name.length < 2) {
      missing.push({ field: 'name', message: 'Program name is required' });
    }
    if (duration <= 0) {
      missing.push({
        field: 'durationYears',
        message: 'Program duration in years must be greater than 0',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing academic year completion rule. */
export class AcademicYearCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const yearNumber = num(data['yearNumber']);
    const label = str(data['label']);

    if (yearNumber <= 0) {
      missing.push({
        field: 'yearNumber',
        message: 'Academic year number must be greater than 0',
      });
    }
    if (!label) {
      missing.push({
        field: 'label',
        message: 'Academic year label is required (e.g. Year 1 / Freshman)',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing semester completion rule. */
export class SemesterCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const semesterNumber = num(data['semesterNumber'] ?? data['number']);
    const startDate = str(data['startDate']);
    const endDate = str(data['endDate']);

    if (semesterNumber <= 0) {
      missing.push({
        field: 'semesterNumber',
        message: 'Semester number must be greater than 0',
      });
    }
    if (!startDate) {
      missing.push({
        field: 'startDate',
        message: 'Semester start date is required',
      });
    }
    if (!endDate) {
      missing.push({
        field: 'endDate',
        message: 'Semester end date is required',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing section completion rule. */
export class SectionCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const strength = num(data['strength']);

    if (!name) {
      missing.push({
        field: 'name',
        message: 'Section name is required (e.g. Section A)',
      });
    }
    if (strength <= 0) {
      missing.push({
        field: 'strength',
        message: 'Section student strength must be greater than 0',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing batch completion rule. */
export class BatchCompletionRule implements CompletionRuleStrategy {
  compute(
    data: Record<string, unknown>,
    context?: CompletionContext,
  ): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const size = num(data['size']);

    if (!name) {
      missing.push({
        field: 'name',
        message: 'Batch name is required (e.g. Batch 1)',
      });
    }
    if (size <= 0) {
      missing.push({
        field: 'size',
        message: 'Batch size must be greater than 0',
      });
    }

    // Capacity verification: sum of batches <= section strength
    const sectionStrength = num(context?.parentNode?.data?.['strength']);
    if (sectionStrength > 0 && size > 0) {
      const siblingBatches =
        context?.siblingNodes?.filter((n) => n.type === 'batch') ?? [];
      const totalSiblingSize = siblingBatches.reduce(
        (acc, curr) => acc + num(curr.data['size']),
        0,
      );
      if (totalSiblingSize + size > sectionStrength) {
        missing.push({
          field: 'size',
          message: `Total batch size (${totalSiblingSize + size}) exceeds parent section strength (${sectionStrength})`,
        });
      }
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing subject assignment completion rule. */
export class SubjectAssignmentCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const subjectId = str(
      data['subjectId'] ?? data['subjectCode'] ?? data['name'],
    );
    const type = str(data['type']);
    const weeklyHours = num(data['weeklyHours']);
    const facultyId = str(data['facultyId'] ?? data['faculty']);
    const roomType = str(
      data['roomType'] ??
        (data['requirements'] as Record<string, unknown> | undefined)?.[
          'roomType'
        ],
    );

    if (!subjectId) {
      missing.push({
        field: 'subjectId',
        message: 'Subject reference or code is required',
      });
    }
    if (!type) {
      missing.push({
        field: 'type',
        message: 'Subject type (theory, lab, tutorial, seminar) is required',
      });
    }
    if (weeklyHours <= 0) {
      missing.push({
        field: 'weeklyHours',
        message: 'Weekly hours must be greater than 0',
      });
    }
    if (!facultyId) {
      missing.push({
        field: 'facultyId',
        message: 'Assigned faculty is required',
      });
    }
    if (!roomType) {
      missing.push({
        field: 'roomType',
        message: 'Room type requirement must be specified',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing elective group completion rule. */
export class ElectiveGroupCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const name = str(data['name']);
    const subjectIds = Array.isArray(data['subjectIds'])
      ? data['subjectIds']
      : [];
    const mustBeSimultaneous = data['mustBeSimultaneous'];

    if (!name) {
      missing.push({
        field: 'name',
        message: 'Elective group name is required',
      });
    }
    if (subjectIds.length < 2) {
      missing.push({
        field: 'subjectIds',
        message: 'Elective group must include at least 2 subjects',
      });
    }
    if (typeof mustBeSimultaneous !== 'boolean') {
      missing.push({
        field: 'mustBeSimultaneous',
        message: 'Simultaneity flag must be set (true/false)',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing faculty completion rule. */
export class FacultyCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const maxHoursPerDay = num(data['maxHoursPerDay']);
    const maxHoursPerWeek = num(data['maxHoursPerWeek']);
    const availability = data['availability'];

    if (
      !availability ||
      (Array.isArray(availability) && availability.length === 0)
    ) {
      missing.push({
        field: 'availability',
        message: 'Faculty availability grid must be configured',
      });
    }
    if (maxHoursPerDay <= 0) {
      missing.push({
        field: 'maxHoursPerDay',
        message: 'Max hours per day must be greater than 0',
      });
    }
    if (maxHoursPerWeek <= 0) {
      missing.push({
        field: 'maxHoursPerWeek',
        message: 'Max hours per week must be greater than 0',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}

/** Class implementing room completion rule. */
export class RoomCompletionRule implements CompletionRuleStrategy {
  compute(data: Record<string, unknown>): CompletionResult {
    const missing: MissingField[] = [];
    const type = str(data['type']);
    const capacity = num(data['capacity']);

    if (!type) {
      missing.push({
        field: 'type',
        message: 'Room type (lecture, lab, seminar) is required',
      });
    }
    if (capacity <= 0) {
      missing.push({
        field: 'capacity',
        message: 'Room seating capacity must be greater than 0',
      });
    }

    if (Object.keys(data).length === 0) {
      return { status: 'empty', missing };
    }
    return {
      status: missing.length === 0 ? 'complete' : 'incomplete',
      missing,
    };
  }
}
