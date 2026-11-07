import type { BaseRepository } from '../../../common/database/base.repository';
import type { Blueprint } from '../schemas/blueprint.schema';
import type { BlueprintGraphDto } from '@slotly/contracts';

export interface IBlueprintRepository extends BaseRepository<Blueprint> {
  findByProject(projectId: string): Promise<Blueprint | null>;
  saveGraph(
    projectId: string,
    graph: Partial<BlueprintGraphDto>,
    expectedRevision?: number,
  ): Promise<Blueprint | null>;
  resetGraph(projectId: string): Promise<Blueprint>;
}
