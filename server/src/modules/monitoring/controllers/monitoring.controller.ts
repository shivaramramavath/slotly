// HTTP controller exposing Prometheus telemetry endpoints and client web vitals intake.
import { Controller, Get, Post, Body, Header, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ClientWebVitalsDtoSchema,
  type ClientWebVitalsDto,
} from '@slotly/contracts';
import { PrometheusMetricsService } from '../services/metrics.service';

/** Controller handling system metrics scraping and client-side web vitals tracking. */
@Controller()
export class MonitoringController {
  constructor(
    private readonly metricsService: PrometheusMetricsService,
    @Optional()
    @InjectQueue('analytics')
    private readonly analyticsQueue?: Queue,
  ) {}

  /** Exposes Prometheus runtime and HTTP metrics for scrapers. */
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  /** Ingests client Core Web Vitals telemetry for asynchronous analysis. */
  @Post('monitoring/vitals')
  async recordVitals(
    @Body(new ZodValidationPipe(ClientWebVitalsDtoSchema))
    dto: ClientWebVitalsDto,
  ): Promise<{ message: string }> {
    if (this.analyticsQueue) {
      await this.analyticsQueue.add('record-vitals', {
        jobType: 'record_client_vitals',
        data: dto as unknown as Record<string, unknown>,
      });
    }

    return { message: 'Web vitals recorded successfully' };
  }
}
