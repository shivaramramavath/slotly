// BullMQ processor handling asynchronous timetable export jobs.
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { CreateExportDto } from '@slotly/contracts';
import { ExportFacade } from '../services/export.facade';

interface ExportJobPayload {
  jobId: string;
  projectId: string;
  userId: string;
  dto: CreateExportDto;
}

/** Processor executing export background queue jobs. */
@Processor('exports')
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly exportFacade: ExportFacade) {
    super();
  }

  async process(job: Job<ExportJobPayload>): Promise<void> {
    const { jobId, projectId, userId, dto } = job.data;
    this.logger.debug(
      `Processing export job ${jobId} (format: ${dto.format}, type: ${dto.entityType})`,
    );

    await this.exportFacade.executeExport(jobId, projectId, userId, dto);
  }
}
