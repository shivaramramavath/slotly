// Database repository managing cached-project.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import { CachedRepository } from '../../../common/database/cached.repository';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { Project } from '../schemas/project.schema';
import type {
  FindProjectsFilter,
  IProjectRepository,
} from './project.repository.interface';
import { MongoProjectRepository } from './mongo-project.repository';

/** Injectable service providing cached project repository logic. */
@Injectable()
export class CachedProjectRepository
  extends CachedRepository<Project>
  implements IProjectRepository
{
  private readonly projectRepo: MongoProjectRepository;

  constructor(
    inner: MongoProjectRepository,
    @Inject(CACHE_SERVICE) cache: CacheService,
  ) {
    super(inner, cache, 'project', 3600);
    this.projectRepo = inner;
  }

  async findProjects(
    filter: FindProjectsFilter,
    skip = 0,
    limit = 20,
  ): Promise<{ items: Project[]; total: number }> {
    return this.projectRepo.findProjects(filter, skip, limit);
  }

  async findByInstitution(institutionId: string): Promise<Project[]> {
    const key = `slotly:institution:${institutionId}:projects`;
    return this.cache.remember(key, 300, () =>
      this.projectRepo.findByInstitution(institutionId),
    );
  }

  async updateLastOpened(id: string): Promise<void> {
    await this.projectRepo.updateLastOpened(id);
    await this.cache.del(`slotly:project:${id}`);
  }

  async incrementRevision(
    id: string,
    expectedRevision?: number,
  ): Promise<Project | null> {
    const updated = await this.projectRepo.incrementRevision(
      id,
      expectedRevision,
    );
    if (updated) {
      await this.cache.del(`slotly:project:${id}`);
      await this.cache.invalidateTag(`project:${id}`);
    }
    return updated;
  }

  override async create(doc: Partial<Project>): Promise<Project> {
    const created = await super.create(doc);
    if (created.institutionId) {
      await this.cache.del(
        `slotly:institution:${created.institutionId}:projects`,
      );
    }
    return created;
  }

  override async update(
    id: string,
    doc: Partial<Project>,
  ): Promise<Project | null> {
    const updated = await super.update(id, doc);
    if (updated?.institutionId) {
      await this.cache.del(
        `slotly:institution:${updated.institutionId}:projects`,
      );
      await this.cache.invalidateTag(`project:${id}`);
    }
    return updated;
  }

  override async delete(id: string): Promise<boolean> {
    const proj = await this.findById(id);
    const result = await super.delete(id);
    if (proj?.institutionId) {
      await this.cache.del(`slotly:institution:${proj.institutionId}:projects`);
      await this.cache.invalidateTag(`project:${id}`);
    }
    return result;
  }

  async countUserPins(userId: string): Promise<number> {
    return this.projectRepo.countUserPins(userId);
  }

  async pinProject(userId: string, projectId: string): Promise<void> {
    await this.projectRepo.pinProject(userId, projectId);
    await this.cache.del(`slotly:user:${userId}:project-pins`);
    await this.cache.invalidateTag(`user:${userId}:pins`);
  }

  async unpinProject(userId: string, projectId: string): Promise<void> {
    await this.projectRepo.unpinProject(userId, projectId);
    await this.cache.del(`slotly:user:${userId}:project-pins`);
    await this.cache.invalidateTag(`user:${userId}:pins`);
  }

  async getUserPins(
    userId: string,
  ): Promise<Array<{ projectId: string; pinnedAt: Date }>> {
    const key = `slotly:user:${userId}:project-pins`;
    return this.cache.remember(key, 300, () =>
      this.projectRepo.getUserPins(userId),
    );
  }
}
