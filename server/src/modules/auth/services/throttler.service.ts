// Domain service orchestrating throttler.service business logic.
import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

/** Constant representing throttler service. */
export const THROTTLER_SERVICE = Symbol('THROTTLER_SERVICE');

/** Interface defining structure for throttler service. */
export interface ThrottlerService {
  consume(
    action: string,
    identifier: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<void>;
  reset(action: string, identifier: string): Promise<void>;
}

/** Injectable service providing redis throttler service logic. */
@Injectable()
export class RedisThrottlerService implements ThrottlerService {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  private getKey(action: string, identifier: string): string {
    return `slotly:throttle:${action}:${identifier.toLowerCase().trim()}`;
  }

  async consume(
    action: string,
    identifier: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<void> {
    const key = this.getKey(action, identifier);
    const current = (await this.cache.get<number>(key)) || 0;

    if (current >= maxAttempts) {
      throw new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: `Too many ${action} attempts. Please wait before trying again.`,
          details: { retryAfterSeconds: windowSeconds },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cache.set(key, current + 1, windowSeconds);
  }

  async reset(action: string, identifier: string): Promise<void> {
    const key = this.getKey(action, identifier);
    await this.cache.del(key);
  }
}
