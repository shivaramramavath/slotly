import { InMemoryCacheService } from './in-memory-cache.service';

describe('InMemoryCacheService (CacheService contract & Single-Flight)', () => {
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get values with TTL', async () => {
    await cache.set('key1', { foo: 'bar' }, 60);
    const result = await cache.get<{ foo: string }>('key1');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should apply a default 1-hour TTL when ttlSeconds is omitted to prevent unbounded keys', async () => {
    await cache.set('unboundedCandidate', 'boundedValue');
    const result = await cache.get<string>('unboundedCandidate');
    expect(result).toBe('boundedValue');
  });

  it('should return null for expired keys', async () => {
    await cache.set('expiredKey', 'value', -1); // already expired
    const result = await cache.get('expiredKey');
    expect(result).toBeNull();
  });

  it('should populate cache using remember() when key is missing', async () => {
    const loader = jest.fn().mockResolvedValue('loadedValue');
    const result = await cache.remember('key2', 60, loader);

    expect(result).toBe('loadedValue');
    expect(loader).toHaveBeenCalledTimes(1);

    // Second call should return from cache without calling loader
    const secondResult = await cache.remember('key2', 60, loader);
    expect(secondResult).toBe('loadedValue');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('should protect against cache stampede via single-flight execution', async () => {
    let callCount = 0;
    const slowLoader = () =>
      new Promise<string>((resolve) => {
        setTimeout(() => {
          callCount++;
          resolve('expensiveData');
        }, 50);
      });

    // Fire 5 concurrent requests for the exact same uncached key
    const promises = [
      cache.remember('stampedeKey', 60, slowLoader),
      cache.remember('stampedeKey', 60, slowLoader),
      cache.remember('stampedeKey', 60, slowLoader),
      cache.remember('stampedeKey', 60, slowLoader),
      cache.remember('stampedeKey', 60, slowLoader),
    ];

    const results = await Promise.all(promises);

    expect(results).toEqual([
      'expensiveData',
      'expensiveData',
      'expensiveData',
      'expensiveData',
      'expensiveData',
    ]);
    // Single-flight guarantee: loader executed only once!
    expect(callCount).toBe(1);
  });

  it('should invalidate keys by tag', async () => {
    await cache.set('slot1', 'data1', 60, ['project:123']);
    await cache.set('slot2', 'data2', 60, ['project:123']);
    await cache.set('other', 'otherData', 60, ['project:456']);

    await cache.invalidateTag('project:123');

    expect(await cache.get('slot1')).toBeNull();
    expect(await cache.get('slot2')).toBeNull();
    expect(await cache.get('other')).toBe('otherData');
  });
});
