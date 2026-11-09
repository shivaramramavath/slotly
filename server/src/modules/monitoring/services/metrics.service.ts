// Prometheus telemetry service exporting standard runtime and HTTP metric collectors.
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client';

/** Telemetry service maintaining Prometheus registry and application performance metrics. */
@Injectable()
export class PrometheusMetricsService implements OnModuleInit {
  private readonly registry: Registry;
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDurationSeconds: Histogram<string>;
  public readonly activeBuildJobs: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests processed by Slotly server',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.activeBuildJobs = new Gauge({
      name: 'active_build_jobs',
      help: 'Current count of solver build jobs being processed',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Retrieves Prometheus-formatted metrics text.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns content type header required for Prometheus scrapers.
   */
  getContentType(): string {
    return this.registry.contentType;
  }
}
