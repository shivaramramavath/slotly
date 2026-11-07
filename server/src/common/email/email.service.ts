// Domain service orchestrating email.service business logic.
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_SENDER, NOTIFICATIONS_QUEUE } from './email.interface';
import type {
  IEmailSender,
  EmailMessage,
  EmailSendResult,
} from './email.interface';

/** Injectable service providing email service logic. */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
    @Optional()
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue?: Queue,
  ) {}

  /**
   * Enqueues an email for asynchronous delivery via BullMQ.
   * If `immediate: true` or the queue is unavailable, sends synchronously.
   */
  async send(
    message: EmailMessage,
    options?: { immediate?: boolean },
  ): Promise<EmailSendResult> {
    if (options?.immediate || !this.notificationsQueue) {
      return this.emailSender.send(message);
    }

    try {
      const job = await this.notificationsQueue.add('send-email', message, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.debug(
        `Enqueued email job ${job.id} for "${typeof message.to === 'string' ? message.to : JSON.stringify(message.to)}"`,
      );

      return { success: true, messageId: `queued_${job.id}` };
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to enqueue email to BullMQ, falling back to direct delivery: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.emailSender.send(message);
    }
  }

  /**
   * Convenience helper to send verification or recovery OTP codes.
   */
  async sendOtp(
    email: string,
    code: string,
    type: 'verify' | 'recovery',
  ): Promise<EmailSendResult> {
    const subject =
      type === 'verify'
        ? 'Slotly: Verify Your Email Address'
        : 'Slotly: Reset Your Password';

    return this.send({
      to: email,
      subject,
      template: type,
      variables: { code },
    });
  }

  /**
   * Convenience helper to send security activity alerts.
   */
  async sendSecurityAlert(
    email: string,
    event: string,
    details: Record<string, unknown>,
  ): Promise<EmailSendResult> {
    return this.send({
      to: email,
      subject: `Slotly Security Alert: ${event}`,
      template: 'security-alert',
      variables: { event, details, timestamp: new Date().toUTCString() },
    });
  }
}
