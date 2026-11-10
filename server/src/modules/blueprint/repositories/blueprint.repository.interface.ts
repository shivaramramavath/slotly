// Database repository managing blueprint.repository.interface persistence.
import type { BaseRepository } from '../../../common/database/base.repository';
import type { Blueprint } from '../schemas/blueprint.schema';
import type {
  Assignment,
  AutoFillMode,
  BlueprintGraphDto,
  NodePool,
  NodePosition,
  NodeStatus,
} from '@slotly/contracts';

/** Interface defining structure for blueprint repository. */
export interface IBlueprintRepository extends BaseRepository<Blueprint> {
  findByProject(projectId: string): Promise<Blueprint | null>;
  saveGraph(
    projectId: string,
    graph: Partial<BlueprintGraphDto>,
    expectedRevision?: number,
  ): Promise<Blueprint | null>;
  resetGraph(projectId: string): Promise<Blueprint>;
  updateNode(
    projectId: string,
    nodeId: string,
    update: {
      position?: NodePosition | undefined;
      data?: Record<string, unknown> | undefined;
      version?: number | undefined;
      pool?: NodePool | undefined;
      assignments?: Assignment[] | undefined;
      autoFill?: AutoFillMode | undefined;
      status?: NodeStatus | undefined;
      effectiveStatus?: NodeStatus | undefined;
      missing?: Array<{ field: string; message: string }> | undefined;
    },
  ): Promise<boolean>;
}
