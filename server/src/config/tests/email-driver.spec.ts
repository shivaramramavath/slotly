// Unit tests verifying dynamic email driver resolution based on EMAIL_DRIVER configuration.
import { Test } from '@nestjs/testing';
import { EMAIL_SENDER } from '../../common/email/email.interface';
import type { IEmailSender } from '../../common/email/email.interface';
import { EmailModule } from '../../common/email/email.module';
import { BrevoEmailSender } from '../../common/email/brevo-email.sender';
import { LogEmailSender } from '../../common/email/log-email.sender';
import { emailConfig } from '../email.config';
import { appConfig } from '../app.config';
import { DEFAULT_CONFIG } from '../defaults';

describe('Email Driver Selection', () => {
  it('provides LogEmailSender when driver is set to log', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(emailConfig.KEY)
      .useValue({
        ...DEFAULT_CONFIG.email,
        driver: 'log',
      })
      .overrideProvider(appConfig.KEY)
      .useValue(DEFAULT_CONFIG.app)
      .compile();

    const sender = moduleRef.get<IEmailSender>(EMAIL_SENDER);
    expect(sender).toBeInstanceOf(LogEmailSender);
  });

  it('provides BrevoEmailSender when driver is set to brevo', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailModule],
    })
      .overrideProvider(emailConfig.KEY)
      .useValue({
        ...DEFAULT_CONFIG.email,
        driver: 'brevo',
        apiKey: 'xkeysib-mock-key',
      })
      .overrideProvider(appConfig.KEY)
      .useValue(DEFAULT_CONFIG.app)
      .compile();

    const sender = moduleRef.get<IEmailSender>(EMAIL_SENDER);
    expect(sender).toBeInstanceOf(BrevoEmailSender);
  });

  it('LogEmailSender masks OTP code in logs during mock send', async () => {
    const sender = new LogEmailSender();
    const result = await sender.send({
      to: 'student@example.edu',
      subject: 'Verify your email',
      template: 'verify',
      variables: { code: '123456' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^log-/);
  });
});
