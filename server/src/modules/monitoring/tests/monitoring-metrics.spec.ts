// Unit tests validating Prometheus metrics registry and Redis rate limiting guard.
import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { PrometheusMetricsService } from '../services/metrics.service';
import { RedisRateLimitGuard } from '../guards/rate-limit.guard';
import type { CacheService } from '../../../common/cache/cache.interface';

describe('Monitoring and Rate Limiting', () => {
  describe('PrometheusMetricsService', () => {
    it('initializes collectors and produces Prometheus formatted metric output', async () => {
      const service = new PrometheusMetricsService();
      service.onModuleInit();

      service.httpRequestsTotal.inc({
        method: 'GET',
        path: '/analytics',
        status: '200',
      });
      service.activeBuildJobs.set(2);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('active_build_jobs');
      expect(service.getContentType()).toContain('text/plain');
    });
  });

  describe('RedisRateLimitGuard', () => {
    let mockCache: jest.Mocked<CacheService>;
    let guard: RedisRateLimitGuard;

    beforeEach(() => {
      mockCache = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        remember: jest.fn(),
        invalidateTag: jest.fn(),
      } as unknown as jest.Mocked<CacheService>;

      guard = new RedisRateLimitGuard(mockCache);
    });

    it('allows request when current count is below limit', async () => {
      mockCache.get.mockResolvedValueOnce(5);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '192.168.1.10',
            user: { id: 'user-1' },
          }),
          getResponse: () => ({
            setHeader: jest.fn(),
          }),
        }),
      } as unknown as ExecutionContext;

      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
      expect(mockCache.set).toHaveBeenCalledWith(
        'slotly:system:rate-limit:user-1',
        6,
        60,
      );
    });

    it('throws HttpException with TOO_MANY_REQUESTS when limit is exceeded', async () => {
      mockCache.get.mockResolvedValueOnce(150);
      const setHeader = jest.fn();

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: '192.168.1.10',
            user: { id: 'user-1' },
          }),
          getResponse: () => ({
            setHeader,
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        HttpException,
      );
      expect(setHeader).toHaveBeenCalledWith('Retry-After', '60');
    });
  });
});
