// Database repository managing cached-schedule-version.repository persistence.
import { Injectable, Inject } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import type { IScheduleVersionRepository } from './schedule-version.repository.interface';
import type { ScheduleVersionDto } from '@slotly/contracts';
import { MongoScheduleVersionRepository } from './mongo-schedule-version.repository';

/** Injectable service providing cached schedule version repository logic. */
@Injectable()
export class CachedScheduleVersionRepository implements IScheduleVersionRepository {
  constructor(
    private readonly inner: MongoScheduleVersionRepository,
    @Inject(CACHE_SERVICE) private readonly cache: CacheService,
  ) {}

  async create(data: Partial<ScheduleVersionDto>): Promise<ScheduleVersionDto> {
    const created = await this.inner.create(data);
    await this.cache.invalidateTag(`project:${created.projectId}`);
    return created;
  }

  async findById(id: string): Promise<ScheduleVersionDto | null> {
    const cacheKey = `slotly:version:${id}`;
    return this.cache.remember(
      cacheKey,
      7200, // 2h TTL
      () => this.inner.findById(id) as Promise<ScheduleVersionDto>,
      [`version:${id}`],
    );
  }

  async findByProjectId(projectId: string): Promise<ScheduleVersionDto[]> {
    const cacheKey = `slotly:project:${projectId}:versions`;
    return this.cache.remember(
      cacheKey,
      3600,
      () => this.inner.findByProjectId(projectId),
      [`project:${projectId}`],
    );
  }

  async findLatestByProjectId(
    projectId: string,
  ): Promise<ScheduleVersionDto | null> {
    return this.inner.findLatestByProjectId(projectId);
  }

  async countByProjectId(projectId: string): Promise<number> {
    return this.inner.countByProjectId(projectId);
  }

  async update(
    id: string,
    data: Partial<ScheduleVersionDto>,
    session?: ClientSession,
  ): Promise<ScheduleVersionDto | null> {
    const updated = await this.inner.update(id, data, session);
    if (updated) {
      await this.cache.del(`slotly:version:${id}`);
      await this.cache.invalidateTag(`project:${updated.projectId}`);
      await this.cache.invalidateTag(`version:${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.inner.findById(id);
    const deleted = await this.inner.delete(id);
    if (existing) {
      await this.cache.del(`slotly:version:${id}`);
      await this.cache.invalidateTag(`project:${existing.projectId}`);
      await this.cache.invalidateTag(`version:${id}`);
    }
    return deleted;
  }
}
