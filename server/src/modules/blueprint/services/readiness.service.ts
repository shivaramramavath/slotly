import { Injectable } from '@nestjs/common';
import type {
  BlueprintMissingItem,
  BlueprintNodeDto,
  BlueprintReadinessDto,
} from '@slotly/contracts';

@Injectable()
export class ReadinessService {
  computeReadiness(nodes: BlueprintNodeDto[]): BlueprintReadinessDto {
    const totalNodes = nodes.length;
    if (totalNodes === 0) {
      return {
        totalNodes: 0,
        completedCount: 0,
        incompleteCount: 0,
        blockedCount: 0,
        percentComplete: 0,
        missingItems: [],
        healthScore: 0,
        isReadyForBuild: false,
      };
    }

    let completedCount = 0;
    let incompleteCount = 0;
    let blockedCount = 0;
    const missingItems: BlueprintMissingItem[] = [];

    for (const node of nodes) {
      if (node.effectiveStatus === 'blocked') {
        blockedCount++;
        missingItems.push({
          nodeId: node.id,
          nodeType: node.type,
          nodeName: (node.data?.['name'] as string) || node.id,
          field: 'effectiveStatus',
          message: 'Node is blocked because an ancestor node is incomplete',
          fixHint: { nodeId: node.parentId || node.id, field: 'status' },
        });
      } else if (node.status === 'complete') {
        completedCount++;
      } else {
        incompleteCount++;
        for (const m of node.missing || []) {
          missingItems.push({
            nodeId: node.id,
            nodeType: node.type,
            nodeName: (node.data?.['name'] as string) || node.id,
            field: m.field,
            message: m.message,
            fixHint: { nodeId: node.id, field: m.field },
          });
        }
      }
    }

    const percentComplete = Math.round((completedCount / totalNodes) * 100);

    // Health score: 100 - penalties for incomplete and blocked
    const penalty = (incompleteCount * 10 + blockedCount * 15) / totalNodes;
    const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    const isReadyForBuild =
      totalNodes > 0 &&
      incompleteCount === 0 &&
      blockedCount === 0 &&
      completedCount === totalNodes;

    return {
      totalNodes,
      completedCount,
      incompleteCount,
      blockedCount,
      percentComplete,
      missingItems,
      healthScore,
      isReadyForBuild,
    };
  }
}
