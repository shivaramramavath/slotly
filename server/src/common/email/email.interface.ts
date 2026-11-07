export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const NOTIFICATIONS_QUEUE = 'notifications';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: string | EmailRecipient | Array<string | EmailRecipient>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  template?:
    'verify' | 'recovery' | 'security-alert' | 'invite' | (string & {});
  variables?: Record<string, unknown>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}

export interface IEmailSender {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
