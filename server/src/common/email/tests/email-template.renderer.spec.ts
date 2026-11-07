import { EmailTemplateRenderer } from '../email-template.renderer';

describe('EmailTemplateRenderer', () => {
  let renderer: EmailTemplateRenderer;

  beforeEach(() => {
    renderer = new EmailTemplateRenderer();
  });

  it('renders OTP verification email with code and styling', () => {
    const rendered = renderer.render({
      to: 'student@college.edu',
      subject: 'Verify Email',
      template: 'verify',
      variables: { code: '849201', expiryMinutes: 10 },
    });

    expect(rendered.html).toContain('849201');
    expect(rendered.html).toContain('Verify Your Email Address');
    expect(rendered.html).toContain('Expires in 10 minutes');
    expect(rendered.text).toContain('849201');
  });

  it('renders password recovery email with warning note', () => {
    const rendered = renderer.render({
      to: 'faculty@college.edu',
      subject: 'Reset Password',
      template: 'recovery',
      variables: { code: '112233' },
    });

    expect(rendered.html).toContain('112233');
    expect(rendered.html).toContain('Reset Your Password');
    expect(rendered.html).toContain('If you did not request a password reset');
    expect(rendered.text).toContain('112233');
  });

  it('renders security alert email with activity table', () => {
    const rendered = renderer.render({
      to: 'admin@college.edu',
      subject: 'Security Alert: Password Changed',
      template: 'security-alert',
      variables: {
        event: 'Password Changed',
        details: { ip: '10.0.0.1', device: 'Firefox on macOS' },
        timestamp: 'Fri, 07 Nov 2026 12:00:00 GMT',
      },
    });

    expect(rendered.html).toContain('Password Changed');
    expect(rendered.html).toContain('10.0.0.1');
    expect(rendered.html).toContain('Firefox on macOS');
    expect(rendered.text).toContain('Password Changed');
  });

  it('returns raw html when htmlContent is provided directly', () => {
    const rendered = renderer.render({
      to: 'custom@user.com',
      subject: 'Custom Announcement',
      htmlContent: '<h1>Welcome to Slotly</h1>',
      textContent: 'Welcome to Slotly',
    });

    expect(rendered.html).toBe('<h1>Welcome to Slotly</h1>');
    expect(rendered.text).toBe('Welcome to Slotly');
  });
});
