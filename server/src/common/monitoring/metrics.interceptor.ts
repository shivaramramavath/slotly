import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface RouteMetrics {
  count: number;
  totalDurationMs: number;
  lastDurationMs: number;
}

@Injectable()
export class MetricsService {
  private readonly metrics = new Map<string, RouteMetrics>();

  record(route: string, durationMs: number): void {
    const existing = this.metrics.get(route) || {
      count: 0,
      totalDurationMs: 0,
      lastDurationMs: 0,
    };
    existing.count += 1;
    existing.totalDurationMs += durationMs;
    existing.lastDurationMs = durationMs;
    this.metrics.set(route, existing);
  }

  getMetrics(): Record<string, RouteMetrics> {
    return Object.fromEntries(this.metrics.entries());
  }

  reset(): void {
    this.metrics.clear();
  }
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ method: string; route?: { path: string } }>();
    const routeKey = `${req.method} ${req.route?.path || 'unknown'}`;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.metricsService.record(routeKey, duration);
      }),
    );
  }
}
