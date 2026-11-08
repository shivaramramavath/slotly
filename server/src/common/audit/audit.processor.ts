// Queue processor handling background jobs for audit.processor.
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Job } from 'bullmq';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import type { AuditPayload } from './audit.service';

/** BullMQ queue processor for audit processor jobs. */
@Processor('audit', { concurrency: 5 })
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {
    super();
  }

  async process(job: Job<AuditPayload>): Promise<{ success: boolean }> {
    try {
      if (job.name === 'log-event' && job.data) {
        await this.auditModel.create(job.data as unknown as AuditLog);
        return { success: true };
      }
      return { success: true };
    } catch (err: unknown) {
      this.logger.error(
        `Failed to persist audit job ${job.id}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
