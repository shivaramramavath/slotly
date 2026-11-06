import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');

export interface EmailAdapter {
  sendOtp(
    email: string,
    code: string,
    type: 'verify' | 'recovery',
  ): Promise<void>;
  sendSecurityAlert(
    email: string,
    event: string,
    details: Record<string, unknown>,
  ): Promise<void>;
}

@Injectable()
export class QueueEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger(QueueEmailAdapter.name);

  constructor(
    @Optional()
    @InjectQueue('notifications')
    private readonly notificationsQueue?: Queue,
  ) {}

  async sendOtp(
    email: string,
    code: string,
    type: 'verify' | 'recovery',
  ): Promise<void> {
    const subject =
      type === 'verify'
        ? 'Slotly Verification Code'
        : 'Slotly Password Reset Code';
    this.logger.log(
      `[EMAIL] To: ${email} | Subject: ${subject} | OTP: ${code}`,
    );

    if (this.notificationsQueue) {
      try {
        await this.notificationsQueue.add(
          'send-email',
          { to: email, subject, template: type, variables: { code } },
          { removeOnComplete: true, attempts: 3 },
        );
      } catch (err: unknown) {
        this.logger.warn(
          `Could not enqueue email: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  async sendSecurityAlert(
    email: string,
    event: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `[EMAIL SECURITY ALERT] To: ${email} | Event: ${event} | Details: ${JSON.stringify(details)}`,
    );

    if (this.notificationsQueue) {
      try {
        await this.notificationsQueue.add(
          'send-email',
          {
            to: email,
            subject: `Security Alert: ${event}`,
            template: 'security-alert',
            variables: { event, ...details },
          },
          { removeOnComplete: true, attempts: 3 },
        );
      } catch (err: unknown) {
        this.logger.warn(
          `Could not enqueue security alert email: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
