// Queue processor handling background jobs for email.processor.
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { EMAIL_SENDER, NOTIFICATIONS_QUEUE } from './email.interface';
import type {
  IEmailSender,
  EmailMessage,
  EmailSendResult,
} from './email.interface';

/** BullMQ queue processor for email processor jobs. */
@Processor(NOTIFICATIONS_QUEUE, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {
    super();
  }

  async process(job: Job<EmailMessage>): Promise<EmailSendResult> {
    if (job.name === 'send-email') {
      this.logger.debug(
        `Processing send-email job ${job.id} for recipient: ${JSON.stringify(job.data.to)}`,
      );

      const result = await this.emailSender.send(job.data);
      if (!result.success) {
        throw new Error(
          result.error || 'Failed to dispatch email via provider',
        );
      }

      return result;
    }

    this.logger.warn(
      `Unknown job name "${job.name}" in ${NOTIFICATIONS_QUEUE} queue`,
    );
    return { success: false };
  }
}
