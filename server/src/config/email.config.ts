// Configuration factory for email delivery (Brevo or Log driver).
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** Email namespace configuration factory. Supports 'brevo' and 'log' drivers. */
export const emailConfig = registerAs('email', () => ({
  driver: (process.env['EMAIL_DRIVER'] || DEFAULT_CONFIG.email.driver) as
    'brevo' | 'log',
  apiKey: process.env['BREVO_API_KEY'] || DEFAULT_CONFIG.email.apiKey,
  sender: {
    email:
      process.env['BREVO_SENDER_EMAIL'] || DEFAULT_CONFIG.email.sender.email,
    name: process.env['BREVO_SENDER_NAME'] || DEFAULT_CONFIG.email.sender.name,
  },
  timeout: parseInt(
    process.env['EMAIL_TIMEOUT'] || String(DEFAULT_CONFIG.email.timeout),
    10,
  ),
  maxRetries: parseInt(
    process.env['EMAIL_MAX_RETRIES'] || String(DEFAULT_CONFIG.email.maxRetries),
    10,
  ),
}));

/** Inferred TypeScript type for email namespace configuration. */
export type EmailConfig = ConfigType<typeof emailConfig>;
