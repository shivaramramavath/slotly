// Unit test suite for BaseCacheObject testing object storage, field updates, non-existent key guards, and date round-trips.
import { BaseCacheObject } from '../base/base-cache-object';
import { CacheKeyFactory } from '../factories/cache-key.factory';
import { JsonCacheSerializer } from '../serializers/json-cache.serializer';
import { CacheMetricsService } from '../metrics/cache-metrics.service';
import { MockRedis } from './mock-redis';

describe('BaseCacheObject', () => {
  let redis: MockRedis;
  let cache: BaseCacheObject;
  let metrics: CacheMetricsService;

  beforeEach(() => {
    redis = new MockRedis();
    const keyFactory = new CacheKeyFactory();
    const serializer = new JsonCacheSerializer();
    metrics = new CacheMetricsService();
    cache = new BaseCacheObject(
      redis as any,
      'user_object',
      3600,
      keyFactory,
      serializer,
      metrics,
    );
  });

  it('performs set and get round trip preserving real Date instances', async () => {
    const createdAt = new Date('2026-11-10T12:00:00.000Z');
    const user = { id: 'u1', name: 'Alice', createdAt };

    await cache.setObject('u1', user, 1800);
    const retrieved = await cache.getObject<typeof user>('u1', ['createdAt']);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('u1');
    expect(retrieved?.name).toBe('Alice');
    expect(retrieved?.createdAt).toBeInstanceOf(Date);
    expect(retrieved?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('updateFields and setField on a missing key do NOT create an incomplete object (Bug 1 fix)', async () => {
    // Attempting to update a missing key
    await cache.updateFields('missing_key', { name: 'Ghost' });
    const check1 = await cache.getObject('missing_key');
    expect(check1).toBeNull();

    // Attempting to setField on a missing key
    await cache.setField<{ name: string }, 'name'>(
      'missing_key',
      'name',
      'Ghost',
    );
    const check2 = await cache.getObject('missing_key');
    expect(check2).toBeNull();
  });

  it('updateFields and setField correctly modify an existing cached object', async () => {
    await cache.setObject('u2', { id: 'u2', name: 'Bob', age: 30 });

    await cache.updateFields('u2', { age: 31 });
    const updated = await cache.getObject<{
      id: string;
      name: string;
      age: number;
    }>('u2');
    expect(updated?.age).toBe(31);
    expect(updated?.name).toBe('Bob');

    await cache.setField<{ id: string; name: string; age: number }, 'name'>(
      'u2',
      'name',
      'Robert',
    );
    const updatedName = await cache.getObject<{
      id: string;
      name: string;
      age: number;
    }>('u2');
    expect(updatedName?.name).toBe('Robert');
  });

  it('deleteField removes single field from cached object', async () => {
    await cache.setObject('u3', { id: 'u3', name: 'Charlie', tempFlag: true });
    await cache.deleteField('u3', 'tempFlag');

    const result = await cache.getObject<{
      id: string;
      name: string;
      tempFlag?: boolean;
    }>('u3');
    expect(result?.tempFlag).toBeUndefined();
    expect(result?.name).toBe('Charlie');
  });

  it('deleteObject purges entire object from Redis', async () => {
    await cache.setObject('u4', { id: 'u4', name: 'Dave' });
    await cache.deleteObject('u4');

    const result = await cache.getObject('u4');
    expect(result).toBeNull();
  });

  it('getOrSetObject executes loader only once under concurrent requests (single-flight)', async () => {
    let loaderCalls = 0;
    const slowLoader = async () => {
      await new Promise((res) => setTimeout(res, 30));
      loaderCalls++;
      return { id: 'sf_1', value: 'calculated' };
    };

    const results = await Promise.all([
      cache.getOrSetObject('sf_1', slowLoader),
      cache.getOrSetObject('sf_1', slowLoader),
      cache.getOrSetObject('sf_1', slowLoader),
    ]);

    expect(loaderCalls).toBe(1);
    expect(results[0]).toEqual({ id: 'sf_1', value: 'calculated' });
    expect(results[1]).toEqual({ id: 'sf_1', value: 'calculated' });
  });
});
