// Pure validation functions and selectors for Blueprint node addition and gating.
import type { BlueprintNodeType } from '@slotly/contracts';
import type { BlueprintCanvasNode } from './types/canvas.types';

/** Error codes returned by canAddChild. */
export type CanAddChildCode =
  | 'ok'
  | 'parent-missing'
  | 'parent-incomplete'
  | 'invalid-parent-type'
  | 'cardinality'
  | 'locked';

/** Fix action descriptor indicating next step in the UI. */
export interface CanAddChildFix {
  action: 'open-config' | 'focus-library';
  targetNodeId?: string | undefined;
  targetField?: string | undefined;
  targetType?: BlueprintNodeType | undefined;
  label: string;
}

/** Result returned by canAddChild. */
export interface CanAddChildResult {
  ok: boolean;
  code: CanAddChildCode;
  reason?: string | undefined;
  fix?: CanAddChildFix | undefined;
}

/** Hierarchy map: node type -> allowed parent types in order */
export const ALLOWED_PARENTS: Record<BlueprintNodeType, BlueprintNodeType[]> = {
  institution: [],
  department: ['institution'],
  program: ['department'],
  academicYear: ['program'],
  semester: ['academicYear'],
  section: ['semester'],
  batch: ['section'],
  subjectAssignment: ['section'],
  electiveGroup: ['semester'],
  faculty: [],
  room: [],
};

/** Allowed child types: node type -> valid child types */
export const ALLOWED_CHILDREN: Record<BlueprintNodeType, BlueprintNodeType[]> = {
  institution: ['department'],
  department: ['program'],
  program: ['academicYear'],
  academicYear: ['semester'],
  semester: ['section', 'electiveGroup'],
  section: ['batch', 'subjectAssignment'],
  batch: [],
  subjectAssignment: [],
  electiveGroup: ['subjectAssignment'],
  faculty: ['subjectAssignment'],
  room: ['subjectAssignment'],
};

/** Friendly labels for node types. */
export const NODE_TYPE_DISPLAY_NAMES: Record<BlueprintNodeType, string> = {
  institution: 'Institution',
  department: 'Department',
  program: 'Program',
  academicYear: 'Academic Year',
  semester: 'Semester',
  section: 'Section',
  batch: 'Batch',
  subjectAssignment: 'Subject Assignment',
  electiveGroup: 'Elective Group',
  faculty: 'Faculty',
  room: 'Room',
};

/**
 * Pure function: Evaluates whether a child node of `type` can be added under `parentId`.
 */
export function canAddChild(
  nodes: BlueprintCanvasNode[],
  parentId: string | null | undefined,
  type: BlueprintNodeType,
  isCanvasLocked = false,
): CanAddChildResult {
  if (isCanvasLocked) {
    return {
      ok: false,
      code: 'locked',
      reason: 'Canvas is locked. Unlock canvas to add or modify nodes.',
      fix: {
        action: 'open-config',
        label: 'Unlock canvas',
      },
    };
  }

  // Root Institution check (cardinality: exactly 1 institution allowed)
  if (type === 'institution') {
    const hasInstitution = nodes.some((n) => n.data.nodeType === 'institution');
    if (hasInstitution) {
      return {
        ok: false,
        code: 'cardinality',
        reason: 'Institution root already exists',
        fix: {
          action: 'open-config',
          targetNodeId: nodes.find((n) => n.data.nodeType === 'institution')?.id,
          label: 'View Institution',
        },
      };
    }
    return { ok: true, code: 'ok' };
  }

  // Independent resources (if any in legacy mode)
  if (type === 'faculty' || type === 'room') {
    return { ok: true, code: 'ok' };
  }

  const allowedParents = ALLOWED_PARENTS[type] || [];

  // When no parent is specified
  if (!parentId) {
    // Check if any potential parent exists in the graph
    const potentialParents = nodes.filter((n) => allowedParents.includes(n.data.nodeType));
    if (potentialParents.length === 0) {
      const neededType = allowedParents[0];
      return {
        ok: false,
        code: 'parent-missing',
        reason: neededType
          ? `Add a ${NODE_TYPE_DISPLAY_NAMES[neededType] || neededType} first`
          : 'Missing required parent',
        fix: {
          action: 'focus-library',
          targetType: neededType,
          label: `Add ${NODE_TYPE_DISPLAY_NAMES[neededType || 'institution']}`,
        },
      };
    }

    // Check complete parents among them
    const completeParents = potentialParents.filter(
      (n) => (n.data.effectiveStatus || n.data.status) === 'complete',
    );

    if (completeParents.length === 0) {
      const firstIncomplete = potentialParents[0]!;
      const missingCount = firstIncomplete.data.missing?.length || 1;
      const firstField = firstIncomplete.data.missing?.[0]?.field;
      return {
        ok: false,
        code: 'parent-incomplete',
        reason: `Complete ${firstIncomplete.data.label} first (${missingCount} to fix)`,
        fix: {
          action: 'open-config',
          targetNodeId: firstIncomplete.id,
          targetField: firstField,
          label: `Fix ${firstIncomplete.data.label}`,
        },
      };
    }

    // Multiple complete parents exist, or user didn't specify which one
    return {
      ok: false,
      code: 'parent-missing',
      reason: `Select a parent ${allowedParents.map((t) => NODE_TYPE_DISPLAY_NAMES[t] || t).join(' or ')}`,
      fix: {
        action: 'open-config',
        targetNodeId: completeParents[0]?.id,
        label: `Select ${completeParents[0]?.data.label}`,
      },
    };
  }

  // A parentId was provided
  const parent = nodes.find((n) => n.id === parentId);
  if (!parent) {
    return {
      ok: false,
      code: 'parent-missing',
      reason: 'Parent node not found',
      fix: {
        action: 'focus-library',
        targetType: allowedParents[0],
        label: 'Find parent in library',
      },
    };
  }

  // Type hierarchy gate
  if (!allowedParents.includes(parent.data.nodeType)) {
    return {
      ok: false,
      code: 'invalid-parent-type',
      reason: `Cannot add ${NODE_TYPE_DISPLAY_NAMES[type] || type} under ${parent.data.label} (${NODE_TYPE_DISPLAY_NAMES[parent.data.nodeType] || parent.data.nodeType}). Needs ${allowedParents.map((t) => NODE_TYPE_DISPLAY_NAMES[t] || t).join(' or ')}.`,
      fix: {
        action: 'focus-library',
        targetType: allowedParents[0],
        label: `Add under ${allowedParents.join(' or ')}`,
      },
    };
  }

  // G1: Parent completion gate
  const parentStatus = parent.data.effectiveStatus || parent.data.status;
  if (parentStatus !== 'complete') {
    const missingCount = parent.data.missing?.length || 1;
    const firstField = parent.data.missing?.[0]?.field;
    return {
      ok: false,
      code: 'parent-incomplete',
      reason: `Complete ${parent.data.label} first (${missingCount} to fix)`,
      fix: {
        action: 'open-config',
        targetNodeId: parent.id,
        targetField: firstField,
        label: `Fix ${parent.data.label}`,
      },
    };
  }

  return { ok: true, code: 'ok' };
}

/** Per-type library state info */
export interface LibraryTypeState {
  type: BlueprintNodeType;
  enabled: boolean;
  code: CanAddChildCode;
  reason?: string | undefined;
  fix?: CanAddChildFix | undefined;
  validParents: BlueprintCanvasNode[];
  completeParents: BlueprintCanvasNode[];
}

/**
 * Selector: Computes library state for every node type given current graph and selected node.
 */
export function getLibraryTypesState(
  nodes: BlueprintCanvasNode[],
  selectedNodeId: string | null | undefined,
  isCanvasLocked = false,
): Record<BlueprintNodeType, LibraryTypeState> {
  const allTypes: BlueprintNodeType[] = [
    'institution',
    'department',
    'program',
    'academicYear',
    'semester',
    'section',
    'batch',
    'subjectAssignment',
    'electiveGroup',
    'faculty',
    'room',
  ];

  const result: Partial<Record<BlueprintNodeType, LibraryTypeState>> = {};
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  for (const type of allTypes) {
    const allowedParents = ALLOWED_PARENTS[type] || [];
    const validParents = nodes.filter((n) => allowedParents.includes(n.data.nodeType));
    const completeParents = validParents.filter(
      (n) => (n.data.effectiveStatus || n.data.status) === 'complete',
    );

    // If a valid complete parent is currently selected, check with that parent
    if (selectedNode && allowedParents.includes(selectedNode.data.nodeType)) {
      const check = canAddChild(nodes, selectedNode.id, type, isCanvasLocked);
      result[type] = {
        type,
        enabled: check.ok,
        code: check.code,
        reason: check.reason,
        fix: check.fix,
        validParents,
        completeParents,
      };
      continue;
    }

    // Root Institution check
    if (type === 'institution') {
      const check = canAddChild(nodes, null, type, isCanvasLocked);
      result[type] = {
        type,
        enabled: check.ok,
        code: check.code,
        reason: check.reason,
        fix: check.fix,
        validParents: [],
        completeParents: [],
      };
      continue;
    }

    // Hierarchy nodes without an explicit parent selection:
    // Enabled if AT LEAST ONE valid complete parent exists on the canvas
    if (completeParents.length > 0) {
      result[type] = {
        type,
        enabled: true,
        code: 'ok',
        validParents,
        completeParents,
      };
    } else if (validParents.length > 0) {
      // Parents exist but are incomplete
      const firstParent = validParents[0]!;
      const missingCount = firstParent.data.missing?.length || 1;
      const firstField = firstParent.data.missing?.[0]?.field;
      result[type] = {
        type,
        enabled: false,
        code: 'parent-incomplete',
        reason: `Complete ${firstParent.data.label} first (${missingCount} to fix)`,
        fix: {
          action: 'open-config',
          targetNodeId: firstParent.id,
          targetField: firstField,
          label: `Fix ${firstParent.data.label}`,
        },
        validParents,
        completeParents,
      };
    } else {
      // Parent type missing entirely
      const neededType = allowedParents[0];
      result[type] = {
        type,
        enabled: false,
        code: 'parent-missing',
        reason: neededType
          ? `Add a ${NODE_TYPE_DISPLAY_NAMES[neededType] || neededType} first`
          : 'Missing parent',
        fix: {
          action: 'focus-library',
          targetType: neededType,
          label: `Add ${NODE_TYPE_DISPLAY_NAMES[neededType || 'institution']}`,
        },
        validParents,
        completeParents,
      };
    }
  }

  return result as Record<BlueprintNodeType, LibraryTypeState>;
}
