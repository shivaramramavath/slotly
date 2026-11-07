import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_SENDER, NOTIFICATIONS_QUEUE } from './email.interface';
import { EmailTemplateRenderer } from './email-template.renderer';
import { BrevoEmailSender } from './brevo-email.sender';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  providers: [
    EmailTemplateRenderer,
    BrevoEmailSender,
    {
      provide: EMAIL_SENDER,
      useClass: BrevoEmailSender,
    },
    EmailService,
    EmailProcessor,
  ],
  exports: [EMAIL_SENDER, EmailService, EmailTemplateRenderer],
})
export class EmailModule {}
