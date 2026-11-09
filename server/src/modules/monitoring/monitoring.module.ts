// NestJS module configuring Prometheus metrics, Terminus health checks, and rate limiters.
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bullmq';
import { PrometheusMetricsService } from './services/metrics.service';
import { MonitoringController } from './controllers/monitoring.controller';
import { RedisRateLimitGuard } from './guards/rate-limit.guard';

/** NestJS module managing application telemetry, Prometheus endpoints, and rate limiting. */
@Module({
  imports: [TerminusModule, BullModule.registerQueue({ name: 'analytics' })],
  controllers: [MonitoringController],
  providers: [PrometheusMetricsService, RedisRateLimitGuard],
  exports: [PrometheusMetricsService, RedisRateLimitGuard],
})
export class MonitoringModule {}
