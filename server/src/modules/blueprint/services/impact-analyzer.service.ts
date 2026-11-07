import { Injectable } from '@nestjs/common';
import type { BlueprintImpactDto, BlueprintNodeDto } from '@slotly/contracts';

@Injectable()
export class ImpactAnalyzerService {
  analyze(nodeId: string, nodes: BlueprintNodeDto[]): BlueprintImpactDto {
    const nodesMap = new Map<string, BlueprintNodeDto>(
      nodes.map((n) => [n.id, n]),
    );
    const targetNode = nodesMap.get(nodeId);

    if (!targetNode) {
      return {
        nodeId,
        descendantsCount: 0,
        descendantNodeIds: [],
        subjectAssignmentsCount: 0,
        affectedBuildsCount: 0,
      };
    }

    // Breadth-first or depth-first search for all descendants
    const descendantNodeIds: string[] = [];
    const queue = [nodeId];
    const visited = new Set<string>([nodeId]);

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      for (const node of nodes) {
        if (node.parentId === currentParentId && !visited.has(node.id)) {
          visited.add(node.id);
          descendantNodeIds.push(node.id);
          queue.push(node.id);
        }
      }
    }

    const allInScopeIds = [nodeId, ...descendantNodeIds];
    const subjectAssignmentsCount = nodes.filter(
      (n) => allInScopeIds.includes(n.id) && n.type === 'subjectAssignment',
    ).length;

    // Estimate affected timetable builds (e.g., if semester or higher, affects 1; if institution, affects all)
    const affectedBuildsCount = subjectAssignmentsCount > 0 ? 1 : 0;

    return {
      nodeId,
      descendantsCount: descendantNodeIds.length,
      descendantNodeIds,
      subjectAssignmentsCount,
      affectedBuildsCount,
    };
  }
}
