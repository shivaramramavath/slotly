// Log-based email sender implementation for development and testing environments.
import { Injectable, Logger } from '@nestjs/common';
import type {
  IEmailSender,
  EmailMessage,
  EmailSendResult,
} from './email.interface';

/** Redacts OTP codes (6 consecutive digits) from logs to preserve security. */
function redactOtp(content: string): string {
  return content.replace(/\b\d{6}\b/g, '******');
}

/** Injectable email sender logging sanitized email messages without secrets. */
@Injectable()
export class LogEmailSender implements IEmailSender {
  private readonly logger = new Logger(LogEmailSender.name);

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const toRecipients = Array.isArray(message.to)
      ? message.to.map((r) => (typeof r === 'string' ? r : r.email)).join(', ')
      : typeof message.to === 'string'
        ? message.to
        : message.to.email;

    const sanitizedSubject = redactOtp(message.subject);
    const templateName = message.template || 'generic';

    this.logger.log(
      `[LOG_EMAIL_DRIVER] To: ${toRecipients} | Subject: "${sanitizedSubject}" | Template: ${templateName}`,
    );

    return Promise.resolve({
      success: true,
      messageId: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }
}
