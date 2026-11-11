// Unit test suite for CacheRepository validating negative caching, fail-open semantics, single-flight loading, and payload size bounds.
import { CacheRepository } from '../base/cache-repository';
import { CacheKeyFactory } from '../factories/cache-key.factory';
import { JsonCacheSerializer } from '../serializers/json-cache.serializer';
import { CacheMetricsService } from '../metrics/cache-metrics.service';
import { MockRedis } from './mock-redis';

interface SampleEntity {
  id: string;
  name: string;
  data?: string;
}

class SampleCacheRepository extends CacheRepository<SampleEntity> {
  constructor(
    redis: any,
    keyFactory: any,
    serializer: any,
    metrics?: any,
    options?: any,
  ) {
    super(redis, 'sample', 3600, keyFactory, serializer, metrics, options);
  }
}

describe('CacheRepository', () => {
  let redis: MockRedis;
  let repo: SampleCacheRepository;
  let metrics: CacheMetricsService;

  beforeEach(() => {
    redis = new MockRedis();
    const keyFactory = new CacheKeyFactory();
    const serializer = new JsonCacheSerializer();
    metrics = new CacheMetricsService();
    repo = new SampleCacheRepository(
      redis as any,
      keyFactory,
      serializer,
      metrics,
      {
        negativeTtl: 2, // 2s negative TTL for test
        maxBytes: 100, // 100 bytes max for testing oversized skip
      },
    );
  });

  it('getOrLoad executes loader once concurrently per key (single-flight)', async () => {
    let loaderCount = 0;
    const slowLoader = async () => {
      await new Promise((res) => setTimeout(res, 25));
      loaderCount++;
      return { id: 'ent_1', name: 'Entity One' };
    };

    const results = await Promise.all([
      repo.getOrLoad('ent_1', slowLoader),
      repo.getOrLoad('ent_1', slowLoader),
      repo.getOrLoad('ent_1', slowLoader),
    ]);

    expect(loaderCount).toBe(1);
    expect(results[0]?.name).toBe('Entity One');
    expect(results[1]?.name).toBe('Entity One');
  });

  it('negative caching caches null responses to avoid repeated database misses', async () => {
    let loaderCalls = 0;
    const nullLoader = async () => {
      loaderCalls++;
      return null;
    };

    // First call returns null and sets negative cache marker
    const res1 = await repo.getOrLoad('missing_id', nullLoader);
    expect(res1).toBeNull();
    expect(loaderCalls).toBe(1);

    // Second call hits negative cache, does not execute loader
    const res2 = await repo.getOrLoad('missing_id', nullLoader);
    expect(res2).toBeNull();
    expect(loaderCalls).toBe(1);

    // Verify negative hit metric was recorded
    const snapshot = metrics.getSnapshot();
    expect(snapshot.negativeHits['sample']).toBeGreaterThanOrEqual(1);
  });

  it('fails open on Redis errors without throwing to preserve application availability', async () => {
    redis.shouldFail = true;

    // Read should fail open (return null)
    const res = await repo.get('any_id');
    expect(res).toBeNull();

    // Loader should still run and return database entity despite Redis being down
    const loaded = await repo.getOrLoad('any_id', async () => ({
      id: 'any_id',
      name: 'Resilient',
    }));
    expect(loaded?.name).toBe('Resilient');

    // Invalidate should fail open without throwing
    await expect(repo.invalidate('any_id')).resolves.not.toThrow();
  });

  it('skips caching payloads exceeding maxBytes limit with a warning log', async () => {
    const hugePayload = {
      id: 'huge_1',
      name: 'Oversized',
      data: 'x'.repeat(200), // exceeds 100 bytes limit
    };

    await repo.set('huge_1', hugePayload);

    // Verify it was NOT written to Redis
    const check = await repo.get('huge_1');
    expect(check).toBeNull();
  });

  it('invalidate and invalidateMany clear cache entries and negative markers', async () => {
    await repo.set('e1', { id: 'e1', name: 'First' });
    await repo.set('e2', { id: 'e2', name: 'Second' });

    await repo.invalidateMany(['e1', 'e2']);

    expect(await repo.get('e1')).toBeNull();
    expect(await repo.get('e2')).toBeNull();
  });
});
