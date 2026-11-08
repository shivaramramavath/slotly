// Core implementation for blueprint-gates in server/src/modules/blueprint/gates.
import type {
  BlueprintNodeDto,
  ProjectLifecycleStatus,
} from '@slotly/contracts';
import type { GateContext, GateResult, IGate } from './gate.interface';
import { NodeTypeRegistry } from '../model/node-type.registry';
import { ProjectStateFactory } from '../../projects/lifecycle/project-state.factory';

function getNodeName(node?: BlueprintNodeDto | null, fallback = ''): string {
  if (!node) return fallback;
  const nameVal = node.data?.['name'];
  return typeof nameVal === 'string' && nameVal.trim()
    ? nameVal
    : node.id || fallback;
}

/** Class implementing project not locked gate. */
export class ProjectNotLockedGate implements IGate {
  readonly name = 'ProjectNotLockedGate';

  evaluate(ctx: GateContext): GateResult {
    if (ctx.project.isLocked || ctx.project.isDeleted) {
      return {
        allowed: false,
        reasonCode: 'PROJECT_LOCKED',
        message: 'Project is locked or deleted and cannot be modified',
      };
    }

    const state = ProjectStateFactory.create(
      ctx.project.status as ProjectLifecycleStatus,
    );
    if (!state.canEdit()) {
      return {
        allowed: false,
        reasonCode: 'PROJECT_LOCKED',
        message: `Project in status "${ctx.project.status}" is not editable`,
      };
    }

    return { allowed: true };
  }
}

/** Class implementing permission gate. */
export class PermissionGate implements IGate {
  readonly name = 'PermissionGate';

  evaluate(ctx: GateContext): GateResult {
    if (!ctx.user) {
      return { allowed: true }; // system operations allowed
    }

    if (ctx.user.role === 'SUPER_ADMIN' || ctx.user.role === 'ADMIN') {
      return { allowed: true };
    }

    if (ctx.user.role === 'DESIGNER') {
      return { allowed: true };
    }

    if (ctx.user.permissions?.includes('BLUEPRINT_EDIT')) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reasonCode: 'PERMISSION_DENIED',
      message: 'User does not have permission to modify the blueprint',
    };
  }
}

/** Class implementing parent exists gate. */
export class ParentExistsGate implements IGate {
  readonly name = 'ParentExistsGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_node' && operation.type !== 'move_node') {
      return { allowed: true };
    }

    const parentId = operation.parentId ?? operation.node?.parentId;
    if (!parentId) {
      return { allowed: true }; // root or independent node
    }

    const parent = graph.nodes.find((n) => n.id === parentId);
    if (!parent) {
      return {
        allowed: false,
        reasonCode: 'PARENT_MISSING',
        message: `Parent node with ID "${parentId}" does not exist in the graph`,
        fixHint: { nodeId: parentId, field: 'parentId' },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing parent type allowed gate. */
export class ParentTypeAllowedGate implements IGate {
  readonly name = 'ParentTypeAllowedGate';
  constructor(private readonly registry: NodeTypeRegistry) {}

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_node' && operation.type !== 'move_node') {
      return { allowed: true };
    }

    const nodeType = operation.node?.type;
    const parentId = operation.parentId ?? operation.node?.parentId;

    if (!nodeType) {
      return { allowed: true };
    }

    const def = this.registry.get(nodeType);
    if (!def) {
      return { allowed: true };
    }

    // Root or independent resource
    if (def.allowedParentTypes.length === 0) {
      if (parentId) {
        return {
          allowed: false,
          reasonCode: 'PARENT_TYPE_NOT_ALLOWED',
          message: `Node of type "${nodeType}" cannot have a parent`,
          fixHint: { nodeId: operation.targetId, field: 'parentId' },
        };
      }
      return { allowed: true };
    }

    // Must have a parent of allowed type
    if (!parentId) {
      return {
        allowed: false,
        reasonCode: 'PARENT_MISSING',
        message: `Node of type "${nodeType}" requires a parent of type: ${def.allowedParentTypes.join(', ')}`,
        fixHint: { nodeId: operation.targetId, field: 'parentId' },
      };
    }

    const parent = graph.nodes.find((n) => n.id === parentId);
    if (!parent) {
      return {
        allowed: false,
        reasonCode: 'PARENT_MISSING',
        message: `Parent node with ID "${parentId}" does not exist`,
        fixHint: { nodeId: parentId, field: 'parentId' },
      };
    }

    const normalizedParentType = this.registry.normalizeType(parent.type);
    if (!def.allowedParentTypes.includes(normalizedParentType)) {
      return {
        allowed: false,
        reasonCode: 'PARENT_TYPE_NOT_ALLOWED',
        message: `Node of type "${nodeType}" cannot be placed under parent of type "${parent.type}". Allowed: ${def.allowedParentTypes.join(', ')}`,
        fixHint: { nodeId: parent.id, field: 'type' },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing parent complete gate. */
export class ParentCompleteGate implements IGate {
  readonly name = 'ParentCompleteGate';
  constructor(private readonly registry: NodeTypeRegistry) {}

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_node' && operation.type !== 'move_node') {
      return { allowed: true };
    }

    const nodeType = operation.node?.type;
    const parentId = operation.parentId ?? operation.node?.parentId;

    if (!nodeType || !parentId) {
      return { allowed: true };
    }

    const def = this.registry.get(nodeType);
    if (def && (def.isResource || def.allowedParentTypes.length === 0)) {
      return { allowed: true };
    }

    const parent = graph.nodes.find((n) => n.id === parentId);
    if (!parent) {
      return { allowed: true }; // handled by ParentExistsGate
    }

    // G1 Creation gate: a node can be created only under a COMPLETE parent!
    if (parent.status !== 'complete') {
      const parentName = (parent.data?.['name'] as string) || parent.type;
      const firstMissingField = parent.missing?.[0]?.field || 'name';

      return {
        allowed: false,
        reasonCode: 'PARENT_INCOMPLETE',
        message: `Cannot create child under incomplete parent "${parentName}". Complete parent configuration first.`,
        fixHint: { nodeId: parent.id, field: firstMissingField },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing single parent gate. */
export class SingleParentGate implements IGate {
  readonly name = 'SingleParentGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_edge') {
      return { allowed: true };
    }

    const edge = operation.edge;
    if (!edge || edge.type !== 'hierarchy') {
      return { allowed: true }; // resource edges can be multiple
    }

    // Check if target already has an incoming hierarchy edge or parentId
    const targetNode = graph.nodes.find((n) => n.id === edge.target);
    if (targetNode?.parentId && targetNode.parentId !== edge.source) {
      return {
        allowed: false,
        reasonCode: 'SINGLE_PARENT_VIOLATION',
        message: `Node "${getNodeName(targetNode)}" already has a parent`,
        fixHint: { nodeId: targetNode.id, field: 'parentId' },
      };
    }

    const existingIncoming = graph.edges.some(
      (e) =>
        e.target === edge.target &&
        e.type === 'hierarchy' &&
        e.source !== edge.source,
    );
    if (existingIncoming) {
      return {
        allowed: false,
        reasonCode: 'SINGLE_PARENT_VIOLATION',
        message: `Target node already has a parent edge`,
        fixHint: { nodeId: edge.target || '', field: 'parentId' },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing no cycle gate. */
export class NoCycleGate implements IGate {
  readonly name = 'NoCycleGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    let sourceId: string | undefined;
    let targetId: string | undefined;

    if (operation.type === 'add_edge') {
      sourceId = operation.edge?.source;
      targetId = operation.edge?.target;
    } else if (
      operation.type === 'move_node' ||
      operation.type === 'update_node'
    ) {
      targetId = operation.targetId;
      sourceId = operation.parentId ?? operation.node?.parentId ?? undefined;
    }

    if (!sourceId || !targetId || sourceId === targetId) {
      if (sourceId && targetId && sourceId === targetId) {
        return {
          allowed: false,
          reasonCode: 'CYCLE',
          message: 'A node cannot connect to itself as a parent or dependency',
          fixHint: { nodeId: targetId, field: 'parentId' },
        };
      }
      return { allowed: true };
    }

    // Check if targetId is an ancestor of sourceId (which would create a cycle)
    const nodesMap = new Map<string, BlueprintNodeDto>(
      graph.nodes.map((n) => [n.id, n]),
    );
    let curr = nodesMap.get(sourceId);
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      if (curr.id === targetId) {
        return {
          allowed: false,
          reasonCode: 'CYCLE',
          message: `Cycle detected: node "${targetId}" is an ancestor of "${sourceId}"`,
          fixHint: { nodeId: targetId, field: 'parentId' },
        };
      }
      visited.add(curr.id);
      curr = curr.parentId ? nodesMap.get(curr.parentId) : undefined;
    }

    return { allowed: true };
  }
}

/** Class implementing duplicate name gate. */
export class DuplicateNameGate implements IGate {
  readonly name = 'DuplicateNameGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_node' && operation.type !== 'update_node') {
      return { allowed: true };
    }

    const data = operation.data ?? operation.node?.data;
    const name =
      typeof data?.['name'] === 'string'
        ? data['name'].trim().toLowerCase()
        : '';
    if (!name) {
      return { allowed: true };
    }

    const type = operation.node?.type;
    const parentId = operation.parentId ?? operation.node?.parentId;
    const targetId = operation.targetId;

    const duplicate = graph.nodes.find((n) => {
      if (n.id === targetId) return false;
      if (type && n.type !== type) return false;
      if (n.parentId !== (parentId ?? null)) return false;
      const otherName =
        typeof n.data?.['name'] === 'string'
          ? n.data['name'].trim().toLowerCase()
          : '';
      return otherName === name;
    });

    if (duplicate) {
      return {
        allowed: false,
        reasonCode: 'DUPLICATE_NAME',
        message: `A sibling ${type || 'node'} with the name "${typeof data?.['name'] === 'string' ? data['name'] : ''}" already exists under this parent`,
        fixHint: { nodeId: targetId, field: 'name' },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing capacity gate. */
export class CapacityGate implements IGate {
  readonly name = 'CapacityGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_node' && operation.type !== 'update_node') {
      return { allowed: true };
    }

    const nodeType = operation.node?.type;
    if (nodeType !== 'batch') {
      return { allowed: true };
    }

    const data = operation.data ?? operation.node?.data;
    const size = typeof data?.['size'] === 'number' ? data['size'] : 0;
    const parentId = operation.parentId ?? operation.node?.parentId;

    if (!parentId || size <= 0) {
      return { allowed: true };
    }

    const section = graph.nodes.find((n) => n.id === parentId);
    if (!section) {
      return { allowed: true };
    }

    const strength =
      typeof section.data?.['strength'] === 'number'
        ? section.data['strength']
        : 0;
    if (strength <= 0) {
      return { allowed: true };
    }

    const siblingBatches = graph.nodes.filter(
      (n) =>
        n.type === 'batch' &&
        n.parentId === parentId &&
        n.id !== operation.targetId,
    );
    const totalSiblingSize = siblingBatches.reduce(
      (acc, curr) =>
        acc + (typeof curr.data?.['size'] === 'number' ? curr.data['size'] : 0),
      0,
    );

    if (totalSiblingSize + size > strength) {
      return {
        allowed: false,
        reasonCode: 'CAPACITY_EXCEEDED',
        message: `Sum of batch capacities (${totalSiblingSize + size}) exceeds Section strength (${strength})`,
        fixHint: { nodeId: operation.targetId, field: 'size' },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing connection endpoint gate. */
export class ConnectionEndpointGate implements IGate {
  readonly name = 'ConnectionEndpointGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_edge') {
      return { allowed: true };
    }

    const edge = operation.edge;
    if (!edge) {
      return { allowed: true };
    }

    const source = graph.nodes.find((n) => n.id === edge.source);
    const target = graph.nodes.find((n) => n.id === edge.target);

    if (!source) {
      return {
        allowed: false,
        reasonCode: 'ENDPOINT_INCOMPLETE',
        message: `Source endpoint node "${edge.source}" does not exist`,
        fixHint: { nodeId: edge.source || '', field: 'id' },
      };
    }

    if (!target) {
      return {
        allowed: false,
        reasonCode: 'ENDPOINT_INCOMPLETE',
        message: `Target endpoint node "${edge.target}" does not exist`,
        fixHint: { nodeId: edge.target || '', field: 'id' },
      };
    }

    // G2 Connection gate: both endpoints must be complete
    if (source.status !== 'complete') {
      return {
        allowed: false,
        reasonCode: 'ENDPOINT_INCOMPLETE',
        message: `Source node "${getNodeName(source)}" is incomplete (${source.status})`,
        fixHint: {
          nodeId: source.id,
          field: source.missing?.[0]?.field || 'status',
        },
      };
    }

    if (target.status !== 'complete') {
      return {
        allowed: false,
        reasonCode: 'ENDPOINT_INCOMPLETE',
        message: `Target node "${getNodeName(target)}" is incomplete (${target.status})`,
        fixHint: {
          nodeId: target.id,
          field: target.missing?.[0]?.field || 'status',
        },
      };
    }

    return { allowed: true };
  }
}

/** Class implementing qualification gate. */
export class QualificationGate implements IGate {
  readonly name = 'QualificationGate';

  evaluate(ctx: GateContext): GateResult {
    const { operation, graph } = ctx;
    if (operation.type !== 'add_edge' && operation.type !== 'update_node') {
      return { allowed: true };
    }

    let facultyNode: BlueprintNodeDto | undefined;
    let subjectNode: BlueprintNodeDto | undefined;

    if (operation.type === 'add_edge' && operation.edge) {
      const source = graph.nodes.find((n) => n.id === operation.edge!.source);
      const target = graph.nodes.find((n) => n.id === operation.edge!.target);

      if (
        source?.type === 'faculty' &&
        ((target?.type as string) === 'subjectAssignment' ||
          (target?.type as string) === 'Subject')
      ) {
        facultyNode = source;
        subjectNode = target;
      } else if (
        target?.type === 'faculty' &&
        ((source?.type as string) === 'subjectAssignment' ||
          (source?.type as string) === 'Subject')
      ) {
        facultyNode = target;
        subjectNode = source;
      }
    }

    if (facultyNode && subjectNode) {
      const subjectId =
        (subjectNode.data?.['subjectId'] as string) ||
        (subjectNode.refId as string) ||
        subjectNode.id;
      const qualifiedSubjectIds = Array.isArray(
        facultyNode.data?.['subjectIds'],
      )
        ? (facultyNode.data['subjectIds'] as string[])
        : Array.isArray(facultyNode.data?.['qualifiedSubjectIds'])
          ? (facultyNode.data['qualifiedSubjectIds'] as string[])
          : [];

      // If faculty node has qualifications listed and subject is not in it
      if (
        qualifiedSubjectIds.length > 0 &&
        !qualifiedSubjectIds.includes(subjectId)
      ) {
        return {
          allowed: false,
          reasonCode: 'NOT_QUALIFIED',
          message: `Faculty "${getNodeName(facultyNode)}" is not qualified to teach subject "${getNodeName(subjectNode, subjectId)}"`,
          fixHint: { nodeId: facultyNode.id, field: 'subjectIds' },
        };
      }
    }

    return { allowed: true };
  }
}
