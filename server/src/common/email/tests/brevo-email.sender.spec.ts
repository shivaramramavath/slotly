import { BrevoEmailSender } from '../brevo-email.sender';
import { EmailTemplateRenderer } from '../email-template.renderer';

describe('BrevoEmailSender', () => {
  let sender: BrevoEmailSender;
  let templateRenderer: EmailTemplateRenderer;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    templateRenderer = new EmailTemplateRenderer();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('simulates mock delivery in development when apiKey is not set', async () => {
    sender = new BrevoEmailSender(templateRenderer, {
      apiKey: '',
      fromEmail: 'noreply@slotly.local',
      fromName: 'Slotly',
    });

    const result = await sender.send({
      to: 'student@university.edu',
      subject: 'Verify your email',
      template: 'verify',
      variables: { code: '123456' },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^mock_/);
  });

  it('aborts when no recipient is provided', async () => {
    sender = new BrevoEmailSender(templateRenderer, {
      apiKey: 'mock-api-key',
    });

    const result = await sender.send({
      to: '',
      subject: 'Test',
      template: 'verify',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('No recipients');
  });

  it('calls Brevo API v3 with correct headers and payload when apiKey is configured', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          messageId: '<brevo-msg-999@smtp-relay.mailin.fr>',
        }),
    });
    global.fetch = mockFetch;

    sender = new BrevoEmailSender(templateRenderer, {
      apiKey: 'xkeysib-test-123456',
      fromEmail: 'noreply@slotly.app',
      fromName: 'Slotly Academic',
    });

    const result = await sender.send({
      to: [{ email: 'dean@mit.edu', name: 'Dean Smith' }],
      subject: 'Security Alert',
      template: 'security-alert',
      variables: {
        event: 'New Device Login',
        details: { ip: '192.168.1.1', browser: 'Chrome' },
      },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<brevo-msg-999@smtp-relay.mailin.fr>');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'api-key': 'xkeysib-test-123456',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    );

    const firstCall = mockFetch.mock.calls[0] as [string, RequestInit];
    const calledBody = JSON.parse(firstCall[1].body as string) as {
      sender: { name: string; email: string };
      to: Array<{ email: string; name?: string }>;
      subject: string;
      htmlContent: string;
    };
    expect(calledBody.sender).toEqual({
      name: 'Slotly Academic',
      email: 'noreply@slotly.app',
    });
    expect(calledBody.to).toEqual([
      { email: 'dean@mit.edu', name: 'Dean Smith' },
    ]);
    expect(calledBody.subject).toBe('Security Alert');
    expect(calledBody.htmlContent).toContain('Security Alert');
  });

  it('handles Brevo API HTTP error responses cleanly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () =>
        Promise.resolve(
          JSON.stringify({ code: 'unauthorized', message: 'Key not found' }),
        ),
    });
    global.fetch = mockFetch;

    sender = new BrevoEmailSender(templateRenderer, {
      apiKey: 'invalid-key',
    });

    const result = await sender.send({
      to: 'admin@school.org',
      subject: 'Reset Password',
      template: 'recovery',
      variables: { code: '654321' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Brevo API error 401');
  });
});
