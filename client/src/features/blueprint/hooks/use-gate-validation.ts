// Custom React hook for use-gate-validation.
import { useCallback } from 'react';
import type { BlueprintNodeType } from '@slotly/contracts';
import type { BlueprintCanvasNode, BlueprintCanvasEdge } from '../types/canvas.types';
import type { Connection, Edge } from '@xyflow/react';

// Hierarchy map: node type -> allowed parent types
const ALLOWED_PARENTS: Record<BlueprintNodeType, BlueprintNodeType[]> = {
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

// Allowed child types map: node type -> valid child types
const ALLOWED_CHILDREN: Record<BlueprintNodeType, BlueprintNodeType[]> = {
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

/** Custom React hook for use gate validation. */
export function useGateValidation(nodes: BlueprintCanvasNode[], edges: BlueprintCanvasEdge[]) {
  const getNodeById = useCallback(
    (id: string | null | undefined): BlueprintCanvasNode | undefined => {
      if (!id) return undefined;
      return nodes.find((n) => n.id === id);
    },
    [nodes],
  );

  /**
   * Evaluates whether a given node type can be added under the currently selected parent.
   */
  const canAddNodeType = useCallback(
    (
      type: BlueprintNodeType,
      parent: BlueprintCanvasNode | null | undefined,
    ): { allowed: boolean; reason?: string } => {
      // Roots and independent resources require NO parent
      if (type === 'institution') {
        const hasInstitution = nodes.some((n) => n.data.nodeType === 'institution');
        if (hasInstitution) {
          return { allowed: false, reason: 'Institution root already exists' };
        }
        return { allowed: true };
      }

      if (type === 'faculty' || type === 'room') {
        return { allowed: true };
      }

      // Hierarchy nodes require a parent
      if (!parent) {
        const allowedParents = ALLOWED_PARENTS[type];
        return {
          allowed: false,
          reason: `Requires selecting a parent of type: ${allowedParents.join(' or ')}`,
        };
      }

      const allowedParents = ALLOWED_PARENTS[type];
      if (!allowedParents.includes(parent.data.nodeType)) {
        return {
          allowed: false,
          reason: `Cannot add ${type} under ${parent.data.nodeType}. Needs ${allowedParents.join(' or ')}.`,
        };
      }

      // G1: Parent must be COMPLETE
      if (parent.data.effectiveStatus !== 'complete') {
        return {
          allowed: false,
          reason: `Complete '${parent.data.label}' first`,
        };
      }

      return { allowed: true };
    },
    [nodes],
  );

  /**
   * Returns child types allowed to be added under this node.
   */
  const getAllowedChildTypes = useCallback((parentType: BlueprintNodeType): BlueprintNodeType[] => {
    return ALLOWED_CHILDREN[parentType] || [];
  }, []);

  /**
   * G2 Connection Gate: Checks whether a connection between two nodes is allowed.
   */
  const isValidConnection = useCallback(
    (connection: Edge | Connection): boolean => {
      const sourceNode = getNodeById(connection.source);
      const targetNode = getNodeById(connection.target);

      if (!sourceNode || !targetNode) return false;
      if (sourceNode.id === targetNode.id) return false;

      // Check allowed child types
      const allowedChildren = ALLOWED_CHILDREN[sourceNode.data.nodeType] || [];
      if (!allowedChildren.includes(targetNode.data.nodeType)) {
        return false;
      }

      // Both endpoints must be complete
      if (
        sourceNode.data.effectiveStatus !== 'complete' ||
        targetNode.data.effectiveStatus !== 'complete'
      ) {
        return false;
      }

      // Check for cycles
      const hasPath = (fromId: string, toId: string, visited = new Set<string>()): boolean => {
        if (fromId === toId) return true;
        visited.add(fromId);
        const outgoing = edges.filter((e) => e.source === fromId);
        for (const edge of outgoing) {
          if (!visited.has(edge.target) && hasPath(edge.target, toId, visited)) {
            return true;
          }
        }
        return false;
      };

      if (hasPath(targetNode.id, sourceNode.id)) {
        return false;
      }

      return true;
    },
    [getNodeById, edges],
  );

  return {
    canAddNodeType,
    getAllowedChildTypes,
    isValidConnection,
    getNodeById,
  };
}
