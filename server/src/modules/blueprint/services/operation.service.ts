import { Injectable } from '@nestjs/common';
import type {
  BlueprintEdgeDto,
  BlueprintNodeDto,
  BlueprintOp,
  OperationResultApplied,
  OperationResultSkipped,
} from '@slotly/contracts';
import { GateChain } from '../gates/gate-chain';
import { CompletionService } from './completion.service';

export interface ApplyBatchResult {
  applied: OperationResultApplied[];
  skipped: OperationResultSkipped[];
  nodes: BlueprintNodeDto[];
  edges: BlueprintEdgeDto[];
}

@Injectable()
export class OperationService {
  constructor(
    private readonly gateChain: GateChain,
    private readonly completionService: CompletionService,
  ) {}

  /**
   * Sorts operations topologically:
   * 1. Add nodes (parents before children)
   * 2. Update / Move nodes
   * 3. Add edges
   * 4. Delete edges
   * 5. Delete nodes (children before parents)
   */
  topologicalSort(ops: BlueprintOp[]): BlueprintOp[] {
    const addNodes = ops.filter((o) => o.type === 'add_node');
    const updateOrMoveNodes = ops.filter(
      (o) => o.type === 'update_node' || o.type === 'move_node',
    );
    const addEdges = ops.filter((o) => o.type === 'add_edge');
    const deleteEdges = ops.filter((o) => o.type === 'delete_edge');
    const deleteNodes = ops.filter((o) => o.type === 'delete_node');

    // Sort addNodes such that parents come before children
    const sortedAddNodes: BlueprintOp[] = [];
    const addedNodeIds = new Set<string>();
    let remaining = [...addNodes];
    let safetyCounter = 0;

    while (remaining.length > 0 && safetyCounter <= remaining.length * 2) {
      safetyCounter++;
      const nextBatch = remaining.filter((op) => {
        const parentId = op.parentId ?? op.node?.parentId;
        // Ready if parent is already added in sortedAddNodes OR parent is not in this batch of addNodes
        const isParentInBatch = addNodes.some(
          (other) => other.targetId === parentId,
        );
        return !parentId || !isParentInBatch || addedNodeIds.has(parentId);
      });

      if (nextBatch.length === 0) {
        // Break any cycle in definitions
        sortedAddNodes.push(...remaining);
        break;
      }

      for (const op of nextBatch) {
        sortedAddNodes.push(op);
        addedNodeIds.add(op.targetId);
      }
      remaining = remaining.filter((op) => !addedNodeIds.has(op.targetId));
    }

    return [
      ...sortedAddNodes,
      ...updateOrMoveNodes,
      ...addEdges,
      ...deleteEdges,
      ...deleteNodes.reverse(),
    ];
  }

  async applyBatch(
    ops: BlueprintOp[],
    currentNodes: BlueprintNodeDto[],
    currentEdges: BlueprintEdgeDto[],
    project: {
      id: string;
      status: string;
      isLocked?: boolean;
      isDeleted?: boolean;
    },
    user?: { id: string; role: string; permissions?: string[] },
  ): Promise<ApplyBatchResult> {
    const sortedOps = this.topologicalSort(ops);
    const nodes = currentNodes.map((n) => ({ ...n }));
    const edges = currentEdges.map((e) => ({ ...e }));

    const applied: OperationResultApplied[] = [];
    const skipped: OperationResultSkipped[] = [];
    const failedNodeIds = new Set<string>();

    for (const op of sortedOps) {
      const parentId = op.parentId ?? op.node?.parentId;
      const edgeSource = op.edge?.source;
      const edgeTarget = op.edge?.target;

      // Skip propagation (G6): If parent or connected endpoint failed, skip automatically
      if (parentId && failedNodeIds.has(parentId)) {
        failedNodeIds.add(op.targetId);
        skipped.push({
          opId: op.opId,
          type: op.type,
          targetId: op.targetId,
          reasonCode: 'PARENT_INCOMPLETE',
          message: `Parent operation for node "${parentId}" failed; dependent operation skipped`,
          fixHint: { nodeId: parentId, field: 'parentId' },
        });
        continue;
      }

      if (
        (edgeSource && failedNodeIds.has(edgeSource)) ||
        (edgeTarget && failedNodeIds.has(edgeTarget))
      ) {
        const failedEndpoint =
          edgeSource && failedNodeIds.has(edgeSource)
            ? edgeSource
            : edgeTarget!;
        skipped.push({
          opId: op.opId,
          type: op.type,
          targetId: op.targetId,
          reasonCode: 'ENDPOINT_INCOMPLETE',
          message: `Endpoint node "${failedEndpoint}" failed; connection skipped`,
          fixHint: { nodeId: failedEndpoint, field: 'id' },
        });
        continue;
      }

      // Gate evaluation
      const gateResult = await this.gateChain.evaluate({
        operation: op,
        project,
        user,
        graph: { nodes, edges },
      });

      if (!gateResult.allowed) {
        failedNodeIds.add(op.targetId);
        skipped.push({
          opId: op.opId,
          type: op.type,
          targetId: op.targetId,
          reasonCode: gateResult.reasonCode ?? 'INVALID_OPERATION',
          message: gateResult.message || 'Operation rejected by gate chain',
          fixHint: gateResult.fixHint,
        });
        continue;
      }

      // Apply operation in-memory
      this.applyOpToMemory(op, nodes, edges);
      applied.push({
        opId: op.opId,
        type: op.type,
        targetId: op.targetId,
      });

      // Update completion for newly added or modified nodes
      const { updatedNodes } = this.completionService.recomputeGraph(nodes);
      nodes.length = 0;
      nodes.push(...updatedNodes);
    }

    return {
      applied,
      skipped,
      nodes,
      edges,
    };
  }

  private applyOpToMemory(
    op: BlueprintOp,
    nodes: BlueprintNodeDto[],
    edges: BlueprintEdgeDto[],
  ): void {
    switch (op.type) {
      case 'add_node': {
        const node: BlueprintNodeDto = {
          id: op.targetId,
          projectId: op.node?.projectId || '',
          type: op.node?.type || 'department',
          refId: op.node?.refId,
          parentId: op.parentId ?? op.node?.parentId ?? null,
          position: op.position || op.node?.position || { x: 0, y: 0 },
          data: op.data || op.node?.data || {},
          locked: false,
          hidden: false,
          groupId: op.node?.groupId,
          createdBy: op.node?.createdBy,
          status: 'incomplete',
          missing: [],
          effectiveStatus: 'incomplete',
          constraints: op.node?.constraints,
        };
        nodes.push(node);
        break;
      }
      case 'update_node': {
        const existing = nodes.find((n) => n.id === op.targetId);
        if (existing) {
          if (op.data) {
            existing.data = { ...existing.data, ...op.data };
          }
          if (op.node?.data) {
            existing.data = { ...existing.data, ...op.node.data };
          }
          if (op.position) {
            existing.position = op.position;
          }
          if (typeof op.parentId !== 'undefined') {
            existing.parentId = op.parentId;
          }
        }
        break;
      }
      case 'move_node': {
        const existing = nodes.find((n) => n.id === op.targetId);
        if (existing) {
          if (op.position) {
            existing.position = op.position;
          }
          if (typeof op.parentId !== 'undefined') {
            existing.parentId = op.parentId;
          }
        }
        break;
      }
      case 'delete_node': {
        const index = nodes.findIndex((n) => n.id === op.targetId);
        if (index >= 0) {
          nodes.splice(index, 1);
        }
        // Remove connected edges
        for (let i = edges.length - 1; i >= 0; i--) {
          if (
            edges[i]!.source === op.targetId ||
            edges[i]!.target === op.targetId
          ) {
            edges.splice(i, 1);
          }
        }
        break;
      }
      case 'add_edge': {
        if (op.edge) {
          edges.push({
            id: op.targetId,
            projectId: op.edge.projectId || '',
            source: op.edge.source || '',
            target: op.edge.target || '',
            type: op.edge.type || 'default',
          });
        }
        break;
      }
      case 'delete_edge': {
        const index = edges.findIndex((e) => e.id === op.targetId);
        if (index >= 0) {
          edges.splice(index, 1);
        }
        break;
      }
    }
  }
}
