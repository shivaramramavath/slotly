// Domain service orchestrating in-memory-cache.service business logic.
import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.interface';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  tags: string[];
}

/** Injectable service providing in memory cache service logic. */
@Injectable()
export class InMemoryCacheService implements CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlightLoads = new Map<string, Promise<unknown>>();

  get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return Promise.resolve(null);
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value as T);
  }

  set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = [],
  ): Promise<void> {
    const effectiveTtl = typeof ttlSeconds === 'number' ? ttlSeconds : 3600;
    const expiresAt = Date.now() + effectiveTtl * 1000;
    this.store.set(key, { value, expiresAt, tags });
    return Promise.resolve();
  }

  del(key: string): Promise<void> {
    this.store.delete(key);
    return Promise.resolve();
  }

  async remember<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    tags: string[] = [],
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const inFlight = this.inFlightLoads.get(key);
    if (inFlight) {
      return inFlight as Promise<T>;
    }

    const loadPromise = (async () => {
      try {
        const fresh = await loader();
        await this.set(key, fresh, ttlSeconds, tags);
        return fresh;
      } finally {
        this.inFlightLoads.delete(key);
      }
    })();

    this.inFlightLoads.set(key, loadPromise);
    return loadPromise;
  }

  invalidateTag(tag: string): Promise<void> {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
      }
    }
    return Promise.resolve();
  }

  clear(): void {
    this.store.clear();
    this.inFlightLoads.clear();
  }
}
