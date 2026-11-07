import { Injectable, Logger, Optional } from '@nestjs/common';
import type {
  IEmailSender,
  EmailMessage,
  EmailSendResult,
  EmailRecipient,
} from './email.interface';
import { EmailTemplateRenderer } from './email-template.renderer';

export interface BrevoConfig {
  apiKey?: string | undefined;
  fromEmail?: string | undefined;
  fromName?: string | undefined;
}

export const BREVO_CONFIG = Symbol('BREVO_CONFIG');

@Injectable()
export class BrevoEmailSender implements IEmailSender {
  private readonly logger = new Logger(BrevoEmailSender.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(
    private readonly templateRenderer: EmailTemplateRenderer,
    @Optional()
    private readonly customConfig?: BrevoConfig,
  ) {}

  private getEffectiveConfig(): {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  } {
    const apiKey =
      this.customConfig?.apiKey ?? process.env['BREVO_API_KEY'] ?? '';
    const fromEmail =
      this.customConfig?.fromEmail ??
      process.env['EMAIL_FROM'] ??
      'noreply@slotly.local';
    const fromName =
      this.customConfig?.fromName ?? process.env['EMAIL_FROM_NAME'] ?? 'Slotly';

    return {
      apiKey: apiKey.trim(),
      fromEmail: fromEmail.trim(),
      fromName: fromName.trim(),
    };
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { apiKey, fromEmail, fromName } = this.getEffectiveConfig();

    const recipients = this.normalizeRecipients(message.to);
    if (recipients.length === 0) {
      this.logger.warn('Email send aborted: No valid recipients provided.');
      return { success: false, error: 'No recipients provided' };
    }

    const { html, text } = this.templateRenderer.render(message);

    // If no API key configured, simulate delivery in development/test
    if (!apiKey) {
      const recipientEmails = recipients.map((r) => r.email).join(', ');
      this.logger.log(
        `[BREVO DEV/MOCK] To: ${recipientEmails} | Subject: "${message.subject}" | (Set BREVO_API_KEY to send live emails)`,
      );
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
    }

    try {
      const payload = {
        sender: {
          name: fromName,
          email: fromEmail,
        },
        to: recipients.map((r) => ({
          email: r.email,
          ...(r.name ? { name: r.name } : {}),
        })),
        subject: message.subject,
        htmlContent: html,
        textContent: text,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Brevo API responded with status ${response.status}: ${errorBody}`,
        );
        if (message.variables?.['code']) {
          this.logger.warn(
            `[BREVO FALLBACK] Delivery failed via Brevo. Code for ${recipients.map((r) => r.email).join(', ')} is: >>> ${message.variables['code'] as string} <<<`,
          );
        }
        return {
          success: false,
          error: `Brevo API error ${response.status}: ${errorBody}`,
        };
      }

      const result = (await response.json()) as { messageId?: string };
      this.logger.log(
        `[BREVO EMAIL SENT] MessageId: ${result.messageId || 'unknown'} | To: ${recipients.map((r) => r.email).join(', ')}`,
      );

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email via Brevo: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }

  private normalizeRecipients(
    to: string | EmailRecipient | Array<string | EmailRecipient>,
  ): EmailRecipient[] {
    const arr = Array.isArray(to) ? to : [to];
    const results: EmailRecipient[] = [];

    for (const item of arr) {
      if (typeof item === 'string' && item.trim().length > 0) {
        results.push({ email: item.trim() });
      } else if (item && typeof item === 'object' && item.email) {
        results.push({
          email: item.email.trim(),
          ...(item.name ? { name: item.name.trim() } : {}),
        });
      }
    }

    return results;
  }
}
