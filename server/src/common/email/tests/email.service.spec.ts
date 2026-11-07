import { Queue } from 'bullmq';
import { EmailService } from '../email.service';
import type { IEmailSender } from '../email.interface';

describe('EmailService', () => {
  let service: EmailService;
  let mockSender: IEmailSender;
  let mockQueue: Queue;
  let sendMock: jest.Mock;
  let addMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest
      .fn()
      .mockResolvedValue({ success: true, messageId: 'msg_123' });
    addMock = jest.fn().mockResolvedValue({ id: 'job_456' });

    mockSender = {
      send: sendMock,
    };
    mockQueue = {
      add: addMock,
    } as unknown as Queue;

    service = new EmailService(mockSender, mockQueue);
  });

  it('enqueues email job to BullMQ queue by default', async () => {
    const result = await service.send({
      to: 'user@example.com',
      subject: 'Welcome',
      template: 'verify',
      variables: { code: '123456' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('queued_job_456');
    expect(addMock).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ to: 'user@example.com', subject: 'Welcome' }),
      expect.any(Object),
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends directly via emailSender when immediate: true is specified', async () => {
    const result = await service.send(
      {
        to: 'urgent@example.com',
        subject: 'Urgent OTP',
        template: 'verify',
        variables: { code: '999999' },
      },
      { immediate: true },
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_123');
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('falls back to direct delivery if queue throws an exception', async () => {
    addMock.mockRejectedValueOnce(new Error('Redis connection refused'));

    const result = await service.send({
      to: 'fallback@example.com',
      subject: 'Fallback OTP',
      template: 'verify',
      variables: { code: '777777' },
    });

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('sends OTP via helper sendOtp', async () => {
    await service.sendOtp('student@uni.edu', '123123', 'verify');

    expect(addMock).toHaveBeenCalledWith(
      'send-email',
      expect.any(Object),
      expect.any(Object),
    );
    const firstCall = addMock.mock.calls[0] as [
      string,
      {
        to: string;
        subject: string;
        template: string;
        variables: { code: string };
      },
    ];
    expect(firstCall[1].to).toBe('student@uni.edu');
    expect(firstCall[1].subject).toContain('Verify Your Email');
    expect(firstCall[1].template).toBe('verify');
    expect(firstCall[1].variables.code).toBe('123123');
  });
});
