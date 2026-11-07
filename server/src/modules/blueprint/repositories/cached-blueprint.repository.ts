import { Injectable, Inject } from '@nestjs/common';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { Blueprint } from '../schemas/blueprint.schema';
import type { IBlueprintRepository } from './blueprint.repository.interface';
import { MongoBlueprintRepository } from './mongo-blueprint.repository';
import type { BlueprintGraphDto } from '@slotly/contracts';

@Injectable()
export class CachedBlueprintRepository
  extends CachedRepository<Blueprint>
  implements IBlueprintRepository
{
  private readonly blueprintRepo: MongoBlueprintRepository;

  constructor(
    inner: MongoBlueprintRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(inner, cache, 'blueprint', 7200);
    this.blueprintRepo = inner;
  }

  async findByProject(projectId: string): Promise<Blueprint | null> {
    const key = `slotly:blueprint:${projectId}`;
    return this.cache.remember(key, 7200, () => this.blueprintRepo.findByProject(projectId));
  }

  async saveGraph(
    projectId: string,
    graph: Partial<BlueprintGraphDto>,
    expectedRevision?: number,
  ): Promise<Blueprint | null> {
    const updated = await this.blueprintRepo.saveGraph(projectId, graph, expectedRevision);
    if (updated) {
      await this.cache.del(`slotly:blueprint:${projectId}`);
      await this.cache.del(`slotly:blueprint:${projectId}:readiness`);
      await this.cache.invalidateTag(`project:${projectId}`);
      await this.cache.invalidateTag(`blueprint:${projectId}`);
    }
    return updated;
  }

  async resetGraph(projectId: string): Promise<Blueprint> {
    const doc = await this.blueprintRepo.resetGraph(projectId);
    await this.cache.del(`slotly:blueprint:${projectId}`);
    await this.cache.del(`slotly:blueprint:${projectId}:readiness`);
    await this.cache.invalidateTag(`project:${projectId}`);
    return doc;
  }
}
