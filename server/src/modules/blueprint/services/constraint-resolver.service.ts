// Domain service orchestrating constraint-resolver.service business logic.
import { Injectable } from '@nestjs/common';
import type { BlueprintNodeDto } from '@slotly/contracts';

/** Injectable service providing constraint resolver service logic. */
@Injectable()
export class ConstraintResolverService {
  /**
   * Merges inherited constraints from ancestors (Institution -> Department -> Program -> AcademicYear -> Semester -> Section)
   * with overrides defined on the target node.
   */
  effectiveConstraints(
    node: BlueprintNodeDto,
    allNodes: BlueprintNodeDto[],
  ): Record<string, unknown> {
    const nodesMap = new Map<string, BlueprintNodeDto>(
      allNodes.map((n) => [n.id, n]),
    );
    const ancestorChain: BlueprintNodeDto[] = [];

    let curr: BlueprintNodeDto | undefined = node;
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      ancestorChain.unshift(curr); // top-level ancestor first
      curr = curr.parentId ? nodesMap.get(curr.parentId) : undefined;
    }

    const merged: Record<string, unknown> = {};

    for (const item of ancestorChain) {
      const nodeConstraints = item.constraints ?? {};
      const dataConstraints =
        (item.data?.['constraints'] as Record<string, unknown> | undefined) ??
        {};

      Object.assign(merged, nodeConstraints, dataConstraints);
    }

    return merged;
  }
}
