// Unit test suite for BaseCache validating prefix, id, TTL validation, key format, and jitter bounds.
import { BaseCache } from '../base/base.cache';
import { CacheKeyFactory } from '../factories/cache-key.factory';
import { createMockRedis } from './mock-redis';

class TestCache extends BaseCache {}

describe('BaseCache', () => {
  const redis = createMockRedis();
  const keyFactory = new CacheKeyFactory();

  it('rejects empty or whitespace-only prefix', () => {
    expect(() => new TestCache(redis, '', 3600, keyFactory)).toThrow(
      'Cache prefix must be a non-empty string',
    );
    expect(
      () => new TestCache(redis, 'invalid prefix', 3600, keyFactory),
    ).toThrow('Cache prefix cannot contain whitespace');
  });

  it('rejects invalid or non-positive default TTL', () => {
    expect(() => new TestCache(redis, 'test', 0, keyFactory)).toThrow(
      'Cache TTL must be a positive integer',
    );
    expect(() => new TestCache(redis, 'test', -10, keyFactory)).toThrow(
      'Cache TTL must be a positive integer',
    );
    expect(() => new TestCache(redis, 'test', NaN, keyFactory)).toThrow(
      'Cache TTL must be a positive integer',
    );
  });

  it('formats standardized keys correctly with optional scope', () => {
    const cache = new TestCache(redis, 'project', 3600, keyFactory);

    expect(cache.buildKey('proj_123')).toBe('project:proj_123');
    expect(cache.buildKey('proj_123', 'inst_99')).toBe(
      'project:inst_99:proj_123',
    );
  });

  it('rejects empty or whitespace id on buildKey', () => {
    const cache = new TestCache(redis, 'project', 3600, keyFactory);
    expect(() => cache.buildKey('')).toThrow(
      'Cache identifier must be a non-empty string',
    );
    expect(() => cache.buildKey('id with space')).toThrow(
      'Cache identifier cannot contain whitespace',
    );
  });

  it('calculates jitter strictly between ttl and ttl plus 10%', () => {
    const cache = new TestCache(redis, 'test', 3600, keyFactory);
    const ttl = 1000;

    // Test with Math.random mock bounds
    const originalRandom = Math.random;
    try {
      Math.random = () => 0;
      expect(cache.buildTtl(ttl)).toBe(1000);

      Math.random = () => 0.5;
      expect(cache.buildTtl(ttl)).toBe(1050);

      Math.random = () => 0.9999;
      expect(cache.buildTtl(ttl)).toBe(1099);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('increments and reads namespace version counter', async () => {
    const cache = new TestCache(redis, 'library', 3600, keyFactory);
    const initial = await cache.getNamespaceVersion('inst_1');
    expect(initial).toBe(1);

    const bumped = await cache.bumpNamespaceVersion('inst_1');
    expect(bumped).toBe(2);

    const after = await cache.getNamespaceVersion('inst_1');
    expect(after).toBe(2);
  });
});
