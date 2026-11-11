// Unit test suite for WriteBehindPublisher and WriteBehindProcessor verifying enqueue rollback, revision ordering, and failure lifecycle events.
import { WriteBehindPublisher } from '../write-behind/write-behind.publisher';
import { WriteBehindProcessor } from '../write-behind/write-behind.processor';
import { InMemoryCacheService } from '../../cache/in-memory-cache.service';
import { EventBus } from '../../events/event-bus.service';
import { CacheMetricsService } from '../../cache/metrics/cache-metrics.service';
import type { Job } from 'bullmq';
import type { WriteBehindJobPayload } from '../write-behind/write-behind.types';

class TestPublisher extends WriteBehindPublisher {}

class TestProcessor extends WriteBehindProcessor {
  public handledJobs: Array<{ name: string; data: WriteBehindJobPayload }> = [];
  public currentRevisions: Record<string, number> = {};

  protected async getCurrentRevision(
    entity: string,
    id: string,
  ): Promise<number | null> {
    return this.currentRevisions[`${entity}:${id}`] ?? null;
  }

  protected async handleJob(
    jobName: string,
    data: WriteBehindJobPayload,
  ): Promise<void> {
    if (jobName === 'sync-node') {
      this.handledJobs.push({ name: jobName, data });
      return;
    }
    throw new Error(`Unknown job name "${jobName}" in write-behind queue`);
  }
}

describe('Write-Behind Infrastructure (Publisher & Processor)', () => {
  let cache: InMemoryCacheService;
  let eventBus: EventBus;
  let metrics: CacheMetricsService;
  let mockQueue: any;
  let publisher: TestPublisher;
  let processor: TestProcessor;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    eventBus = new EventBus();
    metrics = new CacheMetricsService();

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job_1' }),
    };

    publisher = new TestPublisher(mockQueue, cache, metrics);
    processor = new TestProcessor(cache, eventBus, undefined, metrics);
  });

  afterEach(() => {
    cache.clear();
  });

  it('enqueue writes pending state to cache and adds job to BullMQ queue', async () => {
    const payload: WriteBehindJobPayload = {
      entity: 'node',
      id: 'node_1',
      payload: { x: 10, y: 20 },
      revision: 2,
      timestamp: Date.now(),
    };

    await publisher.enqueue('sync-node', payload);

    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'sync-node',
      expect.objectContaining({ _persistence: 'pending' }),
      expect.objectContaining({ jobId: 'node:node_1:2' }),
    );

    const cached = await cache.get<WriteBehindJobPayload>(
      'slotly:wb:node:node_1',
    );
    expect(cached?._persistence).toBe('pending');
  });

  it('enqueue failure rolls back cache state and throws (contract enforcement)', async () => {
    // Pre-populate cache with an earlier state
    await cache.set('slotly:wb:node:node_fail', {
      entity: 'node',
      id: 'node_fail',
      payload: { x: 0 },
      _persistence: 'persisted',
    });

    // Make BullMQ queue throw on add
    mockQueue.add.mockRejectedValueOnce(new Error('Redis connection refused'));

    const nextPayload: WriteBehindJobPayload = {
      entity: 'node',
      id: 'node_fail',
      payload: { x: 100 },
      revision: 3,
      timestamp: Date.now(),
    };

    await expect(publisher.enqueue('sync-node', nextPayload)).rejects.toThrow(
      'Write-behind enqueue failed',
    );

    // Verify cache was rolled back to previous state
    const rolledBack = await cache.get<any>('slotly:wb:node:node_fail');
    expect(rolledBack?.payload).toEqual({ x: 0 });
  });

  it('processor success marks cache as persisted and emits persisted domain event', async () => {
    const publishedEvents: any[] = [];
    eventBus.subscribe('node.persisted', (e) => {
      publishedEvents.push(e);
    });

    const job = {
      id: 'job_success',
      name: 'sync-node',
      data: {
        entity: 'node',
        id: 'n_success',
        payload: { x: 50 },
        revision: 4,
        timestamp: Date.now(),
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<WriteBehindJobPayload>;

    const res = await processor.process(job);
    expect(res.success).toBe(true);

    // Verify domain event emitted
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].entity).toBe('node');
    expect(publishedEvents[0].id).toBe('n_success');

    // Verify cache persistence marker
    const cached = await cache.get<any>('slotly:wb:node:n_success');
    expect(cached?._persistence).toBe('persisted');
  });

  it('processor skips stale revision jobs preventing out-of-order overwrite', async () => {
    processor.currentRevisions['node:n_stale'] = 10;

    const staleJob = {
      id: 'job_stale',
      name: 'sync-node',
      data: {
        entity: 'node',
        id: 'n_stale',
        payload: { x: 10 },
        revision: 8, // Stale: 8 < 10
        timestamp: Date.now(),
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<WriteBehindJobPayload>;

    const res = await processor.process(staleJob);
    expect(res.success).toBe(true);
    expect(res.skipped).toBe(true);
    expect(processor.handledJobs).toHaveLength(0);
  });

  it('processor throws on unknown job name', async () => {
    const unknownJob = {
      id: 'job_unknown',
      name: 'unrecognized-job-name',
      data: {
        entity: 'node',
        id: 'n1',
        payload: {},
        timestamp: Date.now(),
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job<WriteBehindJobPayload>;

    await expect(processor.process(unknownJob)).rejects.toThrow(
      'Unknown job name',
    );
  });

  it('processor final failure marks failed in cache and emits failure event', async () => {
    const failedEvents: any[] = [];
    eventBus.subscribe('node.persistence_failed', (e) => {
      failedEvents.push(e);
    });

    const failingJob = {
      id: 'job_fail',
      name: 'sync-node',
      data: {
        entity: 'node',
        id: 'n_fail',
        payload: { x: 99 },
        timestamp: Date.now(),
      },
      opts: { attempts: 3 },
      attemptsMade: 2, // 2 + 1 = 3 (final attempt)
    } as unknown as Job<WriteBehindJobPayload>;

    // Cause handleJob to fail
    jest
      .spyOn(processor as any, 'handleJob')
      .mockRejectedValueOnce(new Error('Mongo unique constraint violation'));

    await expect(processor.process(failingJob)).rejects.toThrow(
      'Mongo unique constraint violation',
    );

    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0].entity).toBe('node');
    expect(failedEvents[0].error).toContain(
      'Mongo unique constraint violation',
    );
  });
});
