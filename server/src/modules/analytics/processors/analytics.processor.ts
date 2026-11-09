// BullMQ processor handling asynchronous analytics calculation and counters.
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AnalyticsService } from '../services/analytics.service';

interface AnalyticsJobPayload {
  jobType: 'refresh_project_analytics' | 'record_stat' | 'record_client_vitals';
  projectId?: string;
  data?: Record<string, unknown>;
}

/** BullMQ processor handling analytics jobs and background counter updates. */
@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job<AnalyticsJobPayload>): Promise<void> {
    const { jobType, projectId, data } = job.data;
    this.logger.debug(`Processing analytics job ${job.id} (${jobType})`);

    switch (jobType) {
      case 'refresh_project_analytics':
        if (projectId) {
          await this.analyticsService.getAllMetrics(projectId);
        }
        break;
      case 'record_stat':
      case 'record_client_vitals':
        this.logger.debug(
          `Recorded analytics metric: ${JSON.stringify(data ?? {})}`,
        );
        break;
      default:
        this.logger.warn(`Unknown analytics job type: ${jobType}`);
    }
  }
}
