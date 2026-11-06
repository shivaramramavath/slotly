import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE } from './cache.interface';
import { RedisCacheService } from './redis-cache.service';
import { InMemoryCacheService } from './in-memory-cache.service';

@Global()
@Module({
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
