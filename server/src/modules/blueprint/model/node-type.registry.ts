// Core implementation for node-type.registry in server/src/modules/blueprint/model.
import { Injectable } from '@nestjs/common';
import {
  type BlueprintNodeType,
  normalizeAvailabilityMatrix,
} from '@slotly/contracts';
import type { CompletionRuleStrategy } from './completion-rule.strategy';
import {
  AcademicYearCompletionRule,
  BatchCompletionRule,
  DepartmentCompletionRule,
  ElectiveGroupCompletionRule,
  FacultyCompletionRule,
  InstitutionCompletionRule,
  ProgramCompletionRule,
  RoomCompletionRule,
  SectionCompletionRule,
  SemesterCompletionRule,
  SubjectAssignmentCompletionRule,
} from './rules/blueprint-completion.rules';

/** Interface defining structure for node type definition. */
export interface NodeTypeDefinition {
  type: BlueprintNodeType;
  allowedParentTypes: BlueprintNodeType[];
  defaultData: Record<string, unknown>;
  completionRule: CompletionRuleStrategy;
  constraintScope: string;
  isResource: boolean;
}

/** Injectable service providing node type registry logic. */
@Injectable()
export class NodeTypeRegistry {
  private readonly definitions = new Map<
    BlueprintNodeType,
    NodeTypeDefinition
  >();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register({
      type: 'institution',
      allowedParentTypes: [],
      defaultData: {
        name: '',
        code: '',
        workingDays: [1, 2, 3, 4, 5],
        periodConfig: {
          startTime: '09:00',
          periodsPerDay: 7,
          periodDuration: 50,
          breaks: [],
        },
      },
      completionRule: new InstitutionCompletionRule(),
      constraintScope: 'global',
      isResource: false,
    });

    this.register({
      type: 'department',
      allowedParentTypes: ['institution'],
      defaultData: { name: '', code: '' },
      completionRule: new DepartmentCompletionRule(),
      constraintScope: 'department',
      isResource: false,
    });

    this.register({
      type: 'program',
      allowedParentTypes: ['department'],
      defaultData: { name: '', durationYears: 4 },
      completionRule: new ProgramCompletionRule(),
      constraintScope: 'program',
      isResource: false,
    });

    this.register({
      type: 'academicYear',
      allowedParentTypes: ['program'],
      defaultData: { yearNumber: 1, label: 'Year 1' },
      completionRule: new AcademicYearCompletionRule(),
      constraintScope: 'academicYear',
      isResource: false,
    });

    this.register({
      type: 'semester',
      allowedParentTypes: ['academicYear'],
      defaultData: { semesterNumber: 1, startDate: '', endDate: '' },
      completionRule: new SemesterCompletionRule(),
      constraintScope: 'semester',
      isResource: false,
    });

    this.register({
      type: 'section',
      allowedParentTypes: ['semester'],
      defaultData: { name: 'Section A', strength: 60 },
      completionRule: new SectionCompletionRule(),
      constraintScope: 'section',
      isResource: false,
    });

    this.register({
      type: 'batch',
      allowedParentTypes: ['section'],
      defaultData: { name: 'Batch 1', size: 30 },
      completionRule: new BatchCompletionRule(),
      constraintScope: 'batch',
      isResource: false,
    });

    this.register({
      type: 'subjectAssignment',
      allowedParentTypes: ['section'],
      defaultData: {
        subjectId: '',
        type: 'theory',
        weeklyHours: 4,
        facultyId: '',
        roomType: 'lecture',
      },
      completionRule: new SubjectAssignmentCompletionRule(),
      constraintScope: 'subject',
      isResource: false,
    });

    this.register({
      type: 'electiveGroup',
      allowedParentTypes: ['semester'],
      defaultData: { name: '', subjectIds: [], mustBeSimultaneous: true },
      completionRule: new ElectiveGroupCompletionRule(),
      constraintScope: 'electiveGroup',
      isResource: false,
    });

    this.register({
      type: 'faculty',
      allowedParentTypes: [],
      defaultData: {
        name: '',
        availability: normalizeAvailabilityMatrix(undefined),
        maxHoursPerDay: 4,
        maxHoursPerWeek: 16,
      },
      completionRule: new FacultyCompletionRule(),
      constraintScope: 'faculty',
      isResource: true,
    });

    this.register({
      type: 'room',
      allowedParentTypes: [],
      defaultData: {
        name: '',
        type: 'lecture',
        capacity: 60,
      },
      completionRule: new RoomCompletionRule(),
      constraintScope: 'room',
      isResource: true,
    });
  }

  register(def: NodeTypeDefinition): void {
    this.definitions.set(def.type, def);
  }

  get(type: string): NodeTypeDefinition | undefined {
    // Handle both lowercase and capitalized if needed
    const normalized = this.normalizeType(type);
    return this.definitions.get(normalized);
  }

  getAll(): NodeTypeDefinition[] {
    return Array.from(this.definitions.values());
  }

  normalizeType(type: string): BlueprintNodeType {
    const lower = type.charAt(0).toLowerCase() + type.slice(1);
    if (lower === 'subject') return 'subjectAssignment';
    return lower as BlueprintNodeType;
  }
}
