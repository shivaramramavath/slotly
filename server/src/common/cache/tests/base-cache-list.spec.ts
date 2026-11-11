// Unit test suite for BaseCacheList validating atomic concurrent updates, corruption resilience, and single-flight lists.
import { BaseCacheList } from '../base/base-cache-list';
import { CacheKeyFactory } from '../factories/cache-key.factory';
import { JsonCacheSerializer } from '../serializers/json-cache.serializer';
import { CacheMetricsService } from '../metrics/cache-metrics.service';
import { MockRedis } from './mock-redis';

describe('BaseCacheList', () => {
  let redis: MockRedis;
  let listCache: BaseCacheList<{ id: string; value: number }>;
  let metrics: CacheMetricsService;

  beforeEach(() => {
    redis = new MockRedis();
    const keyFactory = new CacheKeyFactory();
    const serializer = new JsonCacheSerializer();
    metrics = new CacheMetricsService();
    listCache = new BaseCacheList(
      redis as any,
      'test_list',
      3600,
      keyFactory,
      serializer,
      metrics,
    );
  });

  it('add, remove and update maintain consistency under concurrent operations without lost updates (Bug 2 fix)', async () => {
    await listCache.setList('concur_list', []);

    // 20 concurrent adds
    const additions = Array.from({ length: 20 }, (_, i) =>
      listCache.addToList('concur_list', { id: `item_${i}`, value: i }),
    );
    await Promise.all(additions);

    const afterAdds = await listCache.getList('concur_list');
    expect(afterAdds).toHaveLength(20);

    // Remove item_5
    await listCache.removeFromList('concur_list', (i) => i.id === 'item_5');
    const afterRemove = await listCache.getList('concur_list');
    expect(afterRemove).toHaveLength(19);
    expect(afterRemove?.some((i) => i.id === 'item_5')).toBe(false);

    // Update item_0
    await listCache.updateInList('concur_list', (i) => i.id === 'item_0', {
      id: 'item_0',
      value: 999,
    });
    const afterUpdate = await listCache.getList('concur_list');
    const updatedItem = afterUpdate?.find((i) => i.id === 'item_0');
    expect(updatedItem?.value).toBe(999);
  });

  it('corrupted or malformed JSON payload becomes a miss and deletes the corrupted key', async () => {
    const key = listCache.buildKey('corrupt_key');
    await redis.set(key, 'INVALID_JSON_CORRUPTED');

    const result = await listCache.getList('corrupt_key');
    expect(result).toBeNull();

    // Verify key was removed from Redis
    const exists = await redis.exists(key);
    expect(exists).toBe(0);
  });

  it('getOrSetList invokes loader once for concurrent cache misses (single-flight)', async () => {
    let loaderCalls = 0;
    const slowListLoader = async () => {
      await new Promise((res) => setTimeout(res, 25));
      loaderCalls++;
      return [
        { id: '1', value: 10 },
        { id: '2', value: 20 },
      ];
    };

    const results = await Promise.all([
      listCache.getOrSetList('sf_list', slowListLoader),
      listCache.getOrSetList('sf_list', slowListLoader),
      listCache.getOrSetList('sf_list', slowListLoader),
    ]);

    expect(loaderCalls).toBe(1);
    expect(results[0]).toHaveLength(2);
    expect(results[1]).toHaveLength(2);
  });
});
