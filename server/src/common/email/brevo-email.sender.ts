// Core implementation for brevo-email.sender in server/src/common/email.
import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import type {
  IEmailSender,
  EmailMessage,
  EmailSendResult,
  EmailRecipient,
} from './email.interface';
import { EmailTemplateRenderer } from './email-template.renderer';
import { emailConfig, DEFAULT_CONFIG } from '../../config';
import type { EmailConfig } from '../../config';

/** Interface defining structure for brevo config. */
export interface BrevoConfig {
  apiKey?: string | undefined;
  fromEmail?: string | undefined;
  fromName?: string | undefined;
}

/** Constant representing brevo config. */
export const BREVO_CONFIG = Symbol('BREVO_CONFIG');

/** Injectable service providing brevo email sender logic. */
@Injectable()
export class BrevoEmailSender implements IEmailSender {
  private readonly logger = new Logger(BrevoEmailSender.name);
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(
    private readonly templateRenderer: EmailTemplateRenderer,
    @Optional()
    @Inject(emailConfig.KEY)
    private readonly emailConf?: EmailConfig | BrevoConfig,
    @Optional()
    @Inject(BREVO_CONFIG)
    private readonly customConfig?: BrevoConfig,
  ) {}

  private getEffectiveConfig(): {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    timeout: number;
    maxRetries: number;
  } {
    const apiKey =
      this.customConfig?.apiKey ??
      (this.emailConf && 'apiKey' in this.emailConf
        ? this.emailConf.apiKey
        : undefined) ??
      DEFAULT_CONFIG.email.apiKey;
    const fromEmail =
      this.customConfig?.fromEmail ??
      (this.emailConf && 'sender' in this.emailConf
        ? this.emailConf.sender.email
        : this.emailConf?.fromEmail) ??
      DEFAULT_CONFIG.email.sender.email;
    const fromName =
      this.customConfig?.fromName ??
      (this.emailConf && 'sender' in this.emailConf
        ? this.emailConf.sender.name
        : this.emailConf?.fromName) ??
      DEFAULT_CONFIG.email.sender.name;
    const timeout =
      (this.emailConf && 'timeout' in this.emailConf
        ? this.emailConf.timeout
        : DEFAULT_CONFIG.email.timeout) ?? DEFAULT_CONFIG.email.timeout;
    const maxRetries =
      (this.emailConf && 'maxRetries' in this.emailConf
        ? this.emailConf.maxRetries
        : undefined) ?? DEFAULT_CONFIG.email.maxRetries;

    return {
      apiKey: apiKey.trim(),
      fromEmail: fromEmail.trim(),
      fromName: fromName.trim(),
      timeout,
      maxRetries,
    };
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const { apiKey, fromEmail, fromName, timeout } = this.getEffectiveConfig();

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

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
