import { BaseRepository } from './base.repository';
import { CacheService } from '../cache/cache.interface';

export abstract class CachedRepository<
  T extends { id?: string | undefined; _id?: unknown },
> implements BaseRepository<T> {
  constructor(
    protected readonly inner: BaseRepository<T>,
    protected readonly cache: CacheService,
    protected readonly entityName: string,
    protected readonly defaultTtl: number = 3600,
  ) {}

  protected getKey(id: string): string {
    return `slotly:${this.entityName}:${id}`;
  }

  protected getTag(id?: string): string[] {
    const tags = [`${this.entityName}:all`];
    if (id) {
      tags.push(`${this.entityName}:${id}`);
    }
    return tags;
  }

  async findById(id: string): Promise<T | null> {
    const key = this.getKey(id);
    return this.cache.remember<T | null>(
      key,
      this.defaultTtl,
      () => this.inner.findById(id),
      this.getTag(id),
    );
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    return this.inner.findOne(filter);
  }

  async find(filter: Record<string, unknown> = {}): Promise<T[]> {
    return this.inner.find(filter);
  }

  async create(doc: Partial<T>): Promise<T> {
    const created = await this.inner.create(doc);
    await this.cache.invalidateTag(`${this.entityName}:all`);
    return created;
  }

  async update(id: string, update: Partial<T>): Promise<T | null> {
    const updated = await this.inner.update(id, update);
    await this.cache.del(this.getKey(id));
    await this.cache.invalidateTag(`${this.entityName}:${id}`);
    await this.cache.invalidateTag(`${this.entityName}:all`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const success = await this.inner.delete(id);
    if (success) {
      await this.cache.del(this.getKey(id));
      await this.cache.invalidateTag(`${this.entityName}:${id}`);
      await this.cache.invalidateTag(`${this.entityName}:all`);
    }
    return success;
  }
}
