import { RedisThrottlerService } from '../services/throttler.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { HttpException } from '@nestjs/common';

describe('RedisThrottlerService - Progressive Rate Limiting', () => {
  let throttler: RedisThrottlerService;
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    throttler = new RedisThrottlerService(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should allow requests within limit and throw 429 when threshold exceeded', async () => {
    const action = 'login';
    const id = '127.0.0.1:attacker@example.com';

    // Limit is 3 attempts
    await throttler.consume(action, id, 3, 60);
    await throttler.consume(action, id, 3, 60);
    await throttler.consume(action, id, 3, 60);

    // 4th attempt should throw HttpException with status 429
    await expect(throttler.consume(action, id, 3, 60)).rejects.toThrow(
      HttpException,
    );
  });

  it('should reset counter upon successful authentication', async () => {
    const action = 'login';
    const id = '127.0.0.1:legit@example.com';

    await throttler.consume(action, id, 2, 60);
    await throttler.consume(action, id, 2, 60);

    // Resetting should allow new requests
    await throttler.reset(action, id);
    await expect(throttler.consume(action, id, 2, 60)).resolves.not.toThrow();
  });
});
