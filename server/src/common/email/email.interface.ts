// Core implementation for email.interface in server/src/common/email.
/** Constant representing email sender. */
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
/** Constant representing notifications queue. */
export const NOTIFICATIONS_QUEUE = 'notifications';

/** Interface defining structure for email recipient. */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/** Interface defining structure for email message. */
export interface EmailMessage {
  to: string | EmailRecipient | Array<string | EmailRecipient>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  template?:
    'verify' | 'recovery' | 'security-alert' | 'invite' | (string & {});
  variables?: Record<string, unknown>;
}

/** Interface defining structure for email send result. */
export interface EmailSendResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

/** Interface defining structure for email sender. */
export interface IEmailSender {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
