// Core implementation for cache.module in server/src/common/cache.
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig, cacheConfig } from '../../config';
import type { RedisConfig } from '../../config';
import { CACHE_SERVICE } from './cache.interface';
import { RedisCacheService } from './redis-cache.service';
import { InMemoryCacheService } from './in-memory-cache.service';
import {
  REDIS_CLIENT,
  CACHE_SERIALIZER,
  CACHE_METRICS,
  CACHE_KEY_FACTORY,
} from './interfaces/tokens';
import { JsonCacheSerializer } from './serializers/json-cache.serializer';
import { CacheKeyFactory } from './factories/cache-key.factory';
import { CacheMetricsService } from './metrics/cache-metrics.service';

/** Global cache module exporting CacheService, Redis client, serializers, factories, and metrics. */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(cacheConfig),
  ],
  providers: [
    InMemoryCacheService,
    {
      provide: CACHE_SERVICE,
      useClass: RedisCacheService,
    },
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: (rConf: RedisConfig) => {
        return new Redis({
          host: rConf.host,
          port: rConf.port,
          password: rConf.password || undefined,
          db: rConf.db,
          tls: rConf.tls ? {} : undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: () => 3000,
        });
      },
    },
    {
      provide: CACHE_SERIALIZER,
      useClass: JsonCacheSerializer,
    },
    {
      provide: CACHE_METRICS,
      useClass: CacheMetricsService,
    },
    {
      provide: CACHE_KEY_FACTORY,
      useClass: CacheKeyFactory,
    },
  ],
  exports: [
    CACHE_SERVICE,
    InMemoryCacheService,
    REDIS_CLIENT,
    CACHE_SERIALIZER,
    CACHE_METRICS,
    CACHE_KEY_FACTORY,
  ],
})
export class CacheModule {}
