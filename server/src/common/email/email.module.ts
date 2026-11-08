// Core implementation for email.module in server/src/common/email.
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { emailConfig, EmailConfig } from '../../config';
import { EMAIL_SENDER, NOTIFICATIONS_QUEUE } from './email.interface';
import { EmailTemplateRenderer } from './email-template.renderer';
import { BrevoEmailSender } from './brevo-email.sender';
import { LogEmailSender } from './log-email.sender';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

/** Class implementing email module. */
@Global()
@Module({
  imports: [
    ConfigModule.forFeature(emailConfig),
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  providers: [
    EmailTemplateRenderer,
    BrevoEmailSender,
    LogEmailSender,
    {
      provide: EMAIL_SENDER,
      inject: [emailConfig.KEY, BrevoEmailSender, LogEmailSender],
      useFactory: (
        config: EmailConfig,
        brevoSender: BrevoEmailSender,
        logSender: LogEmailSender,
      ) => {
        return config.driver === 'log' ? logSender : brevoSender;
      },
    },
    EmailService,
    EmailProcessor,
  ],
  exports: [
    EMAIL_SENDER,
    EmailService,
    EmailTemplateRenderer,
    BrevoEmailSender,
    LogEmailSender,
  ],
})
export class EmailModule {}
