// Core implementation for cache.module in server/src/common/cache.
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisConfig, cacheConfig } from '../../config';
import { CACHE_SERVICE } from './cache.interface';
import { RedisCacheService } from './redis-cache.service';
import { InMemoryCacheService } from './in-memory-cache.service';

/** Class implementing cache module. */
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
  ],
  exports: [CACHE_SERVICE, InMemoryCacheService],
})
export class CacheModule {}
