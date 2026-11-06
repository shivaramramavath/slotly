import { WriteBehindService } from './write-behind.service';
import { InMemoryCacheService } from '../cache/in-memory-cache.service';

describe('WriteBehindService', () => {
  let service: WriteBehindService;
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    service = new WriteBehindService(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should coalesce rapid updates for the same entity and id', async () => {
    // 3 rapid movements of node-123
    await service.enqueue('node', 'node-123', { x: 10, y: 20 }, 'proj-1');
    await service.enqueue('node', 'node-123', { x: 50, y: 60 }, 'proj-1');
    await service.enqueue('node', 'node-123', { x: 100, y: 120 }, 'proj-1');

    // The in-memory coalesced job should retain the latest payload
    const job = service.getQueuedJob('node:node-123');
    expect(job).toBeDefined();
    expect(job?.payload).toEqual({ x: 100, y: 120 });
    expect(job?.entity).toBe('node');
    expect(job?.id).toBe('node-123');
  });

  it('should track pending writes per project', async () => {
    await service.enqueue('node', 'n1', { x: 1 }, 'proj-alpha');
    await service.enqueue('node', 'n2', { x: 2 }, 'proj-alpha');

    const pending = await service.getPendingWrites('proj-alpha');
    expect(pending).toBe(2);

    await service.decrementPendingWrites('proj-alpha');
    expect(await service.getPendingWrites('proj-alpha')).toBe(1);

    await service.decrementPendingWrites('proj-alpha');
    expect(await service.getPendingWrites('proj-alpha')).toBe(0);
  });

  it('should resolve flushOrAwaitPendingWrites when pending writes reach zero', async () => {
    await service.enqueue('node', 'n1', { x: 1 }, 'proj-barrier');

    // Simulate background worker decrementing the write after 50ms
    setTimeout(() => {
      void service.decrementPendingWrites('proj-barrier');
    }, 50);

    const start = Date.now();
    await service.flushOrAwaitPendingWrites('proj-barrier', 1000);
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThanOrEqual(40);
    expect(await service.getPendingWrites('proj-barrier')).toBe(0);
  });
});
