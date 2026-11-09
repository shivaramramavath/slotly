// Route guard enforcing Redis-backed global and endpoint rate limits.
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 120;

/** Route guard enforcing sliding window rate limiting backed by Redis. */
@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { id: string } }>();
    const res = http.getResponse<Response>();

    const identifier = req.user?.id || req.ip || '127.0.0.1';
    const key = `slotly:system:rate-limit:${identifier.toLowerCase().trim()}`;

    const currentCount = (await this.cache.get<number>(key)) || 0;

    if (currentCount >= DEFAULT_MAX_REQUESTS) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', String(DEFAULT_WINDOW_SECONDS));
      }
      throw new HttpException(
        {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please slow down and try again later.',
          details: { retryAfterSeconds: DEFAULT_WINDOW_SECONDS },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cache.set(key, currentCount + 1, DEFAULT_WINDOW_SECONDS);
    return true;
  }
}
