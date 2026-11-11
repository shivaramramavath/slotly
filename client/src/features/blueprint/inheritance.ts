// Core inheritance mapping and resolution helpers for blueprint hierarchy nodes.
import type { BlueprintNodeType } from '@slotly/contracts';
import type { BlueprintCanvasNode } from './types/canvas.types';

/** Fields that are inherited from parent nodes across the hierarchy. Identity fields (id, name, code, label) are NEVER inherited. */
export const INHERITED_FIELDS_BY_TYPE: Record<BlueprintNodeType, string[]> = {
  institution: [],
  department: ['workingDays', 'startTime', 'periodDurationMinutes', 'periodsPerDay'],
  program: ['workingDays', 'startTime', 'periodDurationMinutes', 'periodsPerDay', 'departmentId'],
  academicYear: ['workingDays', 'startTime', 'periodDurationMinutes', 'periodsPerDay', 'departmentId', 'programId'],
  semester: ['workingDays', 'startTime', 'periodDurationMinutes', 'periodsPerDay', 'departmentId', 'programId', 'academicYearId'],
  section: [
    'workingDays',
    'startTime',
    'periodDurationMinutes',
    'periodsPerDay',
    'startDate',
    'endDate',
    'departmentId',
    'programId',
    'academicYearId',
    'semesterId',
    'pool',
  ],
  batch: [
    'workingDays',
    'startTime',
    'periodDurationMinutes',
    'periodsPerDay',
    'startDate',
    'endDate',
    'departmentId',
    'programId',
    'academicYearId',
    'semesterId',
    'sectionId',
    'pool',
  ],
  // Legacy / fallback types
  subjectAssignment: ['departmentId'],
  electiveGroup: ['departmentId'],
  faculty: [],
  room: [],
};

/** Identity and local-only fields that must never be copied during inheritance. */
const NON_INHERITABLE_KEYS = new Set([
  'id',
  '_id',
  'name',
  'label',
  'code',
  'number',
  'yearNumber',
  'durationYears',
  'strength',
  'size',
  'refId',
  'parentId',
]);

/**
 * Computes snapshot of inherited data from a parent node for a new child node.
 */
export function getInheritedDataSnapshot(
  parent: BlueprintCanvasNode,
  childType: BlueprintNodeType,
): Record<string, unknown> {
  const allowedKeys = INHERITED_FIELDS_BY_TYPE[childType] || [];
  const parentConfig = (parent.data.config || {}) as Record<string, unknown>;
  const snapshot: Record<string, unknown> = {};

  // Store reference to parent for provenance display
  snapshot['_inheritedFrom'] = {
    parentId: parent.id,
    parentLabel: parent.data.label || (parent.data.config?.name as string) || parent.data.nodeType,
    parentType: parent.data.nodeType,
  };

  const inheritedKeys: string[] = [];

  for (const key of allowedKeys) {
    if (NON_INHERITABLE_KEYS.has(key)) continue;

    if (key === 'pool') {
      const parentPool = (parent.data as Record<string, unknown>)['pool'] || parentConfig['pool'];
      if (parentPool && typeof parentPool === 'object') {
        snapshot['pool'] = JSON.parse(JSON.stringify(parentPool));
        inheritedKeys.push('pool');
      }
      continue;
    }

    if (parentConfig[key] !== undefined) {
      snapshot[key] = JSON.parse(JSON.stringify(parentConfig[key]));
      inheritedKeys.push(key);
    }
  }

  // Also inherit parent departmentId if available on parent
  if (allowedKeys.includes('departmentId') && !snapshot['departmentId']) {
    if (parent.data.nodeType === 'department') {
      snapshot['departmentId'] = parent.id;
      inheritedKeys.push('departmentId');
    } else if (parentConfig['departmentId']) {
      snapshot['departmentId'] = parentConfig['departmentId'];
      inheritedKeys.push('departmentId');
    }
  }

  snapshot['_inheritedKeys'] = inheritedKeys;

  return snapshot;
}
