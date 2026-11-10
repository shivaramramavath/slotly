// Domain service orchestrating completion.service business logic.
import { Injectable } from '@nestjs/common';
import type { BlueprintNodeDto, NodeStatus } from '@slotly/contracts';
import { NodeTypeRegistry } from '../model/node-type.registry';
import type { CompletionContext } from '../model/completion-rule.strategy';

/** Interface defining structure for node status change event. */
export interface NodeStatusChangeEvent {
  nodeId: string;
  status: NodeStatus;
  effectiveStatus: NodeStatus;
  missing: Array<{ field: string; message: string }>;
}

/** Injectable service providing completion service logic. */
@Injectable()
export class CompletionService {
  constructor(private readonly nodeTypeRegistry: NodeTypeRegistry) {}

  compute(
    node: BlueprintNodeDto,
    allNodesMap: Map<string, BlueprintNodeDto>,
  ): {
    status: NodeStatus;
    effectiveStatus: NodeStatus;
    missing: Array<{ field: string; message: string }>;
  } {
    const def = this.nodeTypeRegistry.get(node.type);
    if (!def) {
      return {
        status: 'incomplete',
        effectiveStatus: 'incomplete',
        missing: [
          { field: 'type', message: `Unknown node type: ${node.type}` },
        ],
      };
    }

    // Context preparation (parent, siblings)
    let parentNode: { type: string; data: Record<string, unknown> } | undefined;
    const siblingNodes: Array<{ type: string; data: Record<string, unknown> }> =
      [];

    if (node.parentId && allNodesMap.has(node.parentId)) {
      const p = allNodesMap.get(node.parentId)!;
      parentNode = { type: p.type, data: p.data };

      for (const other of allNodesMap.values()) {
        if (other.id !== node.id && other.parentId === node.parentId) {
          siblingNodes.push({ type: other.type, data: other.data });
        }
      }
    }

    const context: CompletionContext = { parentNode, siblingNodes, node };
    const { status, missing } = def.completionRule.compute(node.data, context);

    // Compute effective status:
    // If own status is not complete, effectiveStatus cannot be complete.
    // Check all ancestors: if any ancestor is not complete, effectiveStatus is 'blocked'
    let effectiveStatus: NodeStatus = status;

    if (!def.isResource && def.allowedParentTypes.length > 0) {
      let isAncestorIncomplete = false;
      let currParentId = node.parentId;
      const visited = new Set<string>();

      while (currParentId && !visited.has(currParentId)) {
        visited.add(currParentId);
        const parent = allNodesMap.get(currParentId);
        if (!parent) {
          isAncestorIncomplete = true;
          break;
        }
        if (parent.status !== 'complete') {
          isAncestorIncomplete = true;
          break;
        }
        currParentId = parent.parentId;
      }

      if (isAncestorIncomplete) {
        effectiveStatus = 'blocked';
      }
    }

    return { status, effectiveStatus, missing };
  }

  recomputeGraph(nodes: BlueprintNodeDto[]): {
    updatedNodes: BlueprintNodeDto[];
    changes: NodeStatusChangeEvent[];
  } {
    const nodesMap = new Map<string, BlueprintNodeDto>(
      nodes.map((n) => [n.id, { ...n }]),
    );
    const changes: NodeStatusChangeEvent[] = [];

    // Topological evaluation: roots first, then children
    // Nodes without parentId or with isResource=true first
    const evaluated = new Set<string>();
    let remaining = Array.from(nodesMap.values());
    let iterations = 0;
    const maxIterations = nodes.length + 1;

    while (remaining.length > 0 && iterations < maxIterations) {
      iterations++;
      const nextBatch = remaining.filter(
        (n) =>
          !n.parentId || evaluated.has(n.parentId) || !nodesMap.has(n.parentId),
      );

      if (nextBatch.length === 0) {
        // Cycle or disconnected parent, force remaining
        break;
      }

      for (const node of nextBatch) {
        const { status, effectiveStatus, missing } = this.compute(
          node,
          nodesMap,
        );
        const hasChanged =
          node.status !== status ||
          node.effectiveStatus !== effectiveStatus ||
          JSON.stringify(node.missing) !== JSON.stringify(missing);

        node.status = status;
        node.effectiveStatus = effectiveStatus;
        node.missing = missing;

        if (hasChanged) {
          changes.push({
            nodeId: node.id,
            status,
            effectiveStatus,
            missing,
          });
        }

        evaluated.add(node.id);
      }

      remaining = remaining.filter((n) => !evaluated.has(n.id));
    }

    // Process any remaining circular/unreached nodes
    for (const node of remaining) {
      const { status, effectiveStatus, missing } = this.compute(node, nodesMap);
      node.status = status;
      node.effectiveStatus = effectiveStatus;
      node.missing = missing;
    }

    return {
      updatedNodes: Array.from(nodesMap.values()),
      changes,
    };
  }
}
