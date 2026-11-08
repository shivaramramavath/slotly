// Core implementation for email.adapter in server/src/modules/auth/adapters.
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../../common/email/email.service';

/** Constant representing email adapter. */
export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');

/** Interface defining structure for email adapter. */
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

/** Injectable service providing queue email adapter logic. */
@Injectable()
export class QueueEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger(QueueEmailAdapter.name);

  constructor(private readonly emailService: EmailService) {}

  async sendOtp(
    email: string,
    code: string,
    type: 'verify' | 'recovery',
  ): Promise<void> {
    this.logger.log(
      `Dispatching OTP email to ${email} (type: ${type}) via EmailService`,
    );
    await this.emailService.sendOtp(email, code, type);
  }

  async sendSecurityAlert(
    email: string,
    event: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(
      `Dispatching security alert to ${email} (event: ${event}) via EmailService`,
    );
    await this.emailService.sendSecurityAlert(email, event, details);
  }
}
