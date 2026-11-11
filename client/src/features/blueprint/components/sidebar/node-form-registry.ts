// Open/Closed registry mapping blueprint node types to their form schemas, metadata, and field specifications.
import {
  NodeFormSchemas,
  NodeFormFieldMeta,
  type BlueprintNodeType,
  type FieldMeta,
} from '@slotly/contracts';
import type { ZodTypeAny } from 'zod';

/** Interface defining node form configuration. */
export interface NodeFormConfig {
  type: BlueprintNodeType;
  schema: ZodTypeAny;
  fieldMeta: Record<string, FieldMeta>;
  fieldKeys: string[];
}

/** Registry mapping BlueprintNodeType to its form schema and metadata. */
export const NodeFormRegistry: Partial<Record<BlueprintNodeType, NodeFormConfig>> = {
  institution: {
    type: 'institution',
    schema: NodeFormSchemas.institution,
    fieldMeta: NodeFormFieldMeta['institution'] ?? {},
    fieldKeys: [
      'name',
      'code',
      'address',
      'workingDays',
      'startTime',
      'periodLength',
      'periodsPerDay',
      'breaks',
      'defaultAutoFillMode',
    ],
  },
  department: {
    type: 'department',
    schema: NodeFormSchemas.department,
    fieldMeta: NodeFormFieldMeta['department'] ?? {},
    fieldKeys: ['name', 'code', 'headOfDepartmentId'],
  },
  program: {
    type: 'program',
    schema: NodeFormSchemas.program,
    fieldMeta: NodeFormFieldMeta['program'] ?? {},
    fieldKeys: ['name', 'code', 'durationYears', 'degreeLevel', 'intake'],
  },
  academicYear: {
    type: 'academicYear',
    schema: NodeFormSchemas.academicYear,
    fieldMeta: NodeFormFieldMeta['academicYear'] ?? {},
    fieldKeys: ['yearNumber', 'label', 'expectedStrength'],
  },
  semester: {
    type: 'semester',
    schema: NodeFormSchemas.semester,
    fieldMeta: NodeFormFieldMeta['semester'] ?? {},
    fieldKeys: ['number', 'startDate', 'endDate'],
  },
  section: {
    type: 'section',
    schema: NodeFormSchemas.section,
    fieldMeta: NodeFormFieldMeta['section'] ?? {},
    fieldKeys: ['name', 'strength', 'classTeacherId', 'homeRoomId'],
  },
  batch: {
    type: 'batch',
    schema: NodeFormSchemas.batch,
    fieldMeta: NodeFormFieldMeta['batch'] ?? {},
    fieldKeys: ['name', 'size', 'labSubjectIds'],
  },
};

/** Helper to retrieve form config for a given node type. */
export function getNodeFormConfig(type: BlueprintNodeType): NodeFormConfig {
  const config = NodeFormRegistry[type];
  if (!config) {
    throw new Error(`Unregistered node form type: ${type}`);
  }
  return config;
}
