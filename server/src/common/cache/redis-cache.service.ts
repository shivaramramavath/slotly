// Domain service orchestrating redis-cache.service business logic.
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  Inject,
  Optional,
} from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig, cacheConfig } from '../../config';
import type { RedisConfig, CacheConfig } from '../../config';
import { CacheService } from './cache.interface';
import { InMemoryCacheService } from './in-memory-cache.service';

/** Injectable service providing redis cache service logic. */
@Injectable()
export class RedisCacheService implements CacheService, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private readonly fallback = new InMemoryCacheService();
  private readonly inFlightLoads = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConf: RedisConfig,
    @Optional()
    @Inject(cacheConfig.KEY)
    private readonly cacheConf?: CacheConfig,
  ) {
    this.initRedis();
  }

  private initRedis(): void {
    const host = this.redisConf.host;
    const port = this.redisConf.port;
    const password = this.redisConf.password;

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        db: this.redisConf.db,
        tls: this.redisConf.tls ? {} : undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => 3000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });

      this.client.on('error', (err: Error) => {
        if (this.isConnected) {
          this.logger.warn(
            `Redis error, falling back to in-memory cache: ${err.message}`,
          );
        }
        this.isConnected = false;
      });

      this.client.connect().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Initial Redis connection failed (${msg}). Using in-memory fallback.`,
        );
        this.isConnected = false;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to instantiate Redis client (${msg}). Using in-memory fallback.`,
      );
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return this.fallback.get<T>(key);
    }
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: unknown) {
      this.logger.warn(
        `Redis get error on key "${key}", falling back: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = [],
  ): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.fallback.set(key, value, ttlSeconds, tags);
    }
    try {
      const serialized = JSON.stringify(value);
      const effectiveTtl =
        typeof ttlSeconds === 'number'
          ? ttlSeconds
          : (this.cacheConf?.defaultTtl ?? 3600);
      if (effectiveTtl > 0) {
        await this.client.set(key, serialized, 'EX', effectiveTtl);
      } else {
        await this.client.set(key, serialized, 'PX', 1); // immediately expire negative/zero TTL
      }

      // Associate key with tags
      if (tags.length > 0) {
        const pipeline = this.client.pipeline();
        for (const tag of tags) {
          pipeline.sadd(`tag:${tag}`, key);
          pipeline.expire(`tag:${tag}`, Math.max(effectiveTtl * 2, 3600));
        }
        await pipeline.exec();
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Redis set error on key "${key}", fallback applied: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.fallback.set(key, value, ttlSeconds, tags);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.fallback.del(key);
    }
    try {
      await this.client.del(key);
    } catch {
      return this.fallback.del(key);
    }
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

  async invalidateTag(tag: string): Promise<void> {
    await this.fallback.invalidateTag(tag);
    if (!this.isConnected || !this.client) return;

    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.client.smembers(tagKey);
      if (keys.length > 0) {
        const pipeline = this.client.pipeline();
        pipeline.del(...keys);
        pipeline.del(tagKey);
        await pipeline.exec();
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Redis invalidateTag error for "${tag}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore on exit
      }
    }
  }
}
