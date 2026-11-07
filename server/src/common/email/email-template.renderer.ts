import { Injectable } from '@nestjs/common';
import type { EmailMessage } from './email.interface';

export interface RenderedEmail {
  html: string;
  text: string;
}

function str(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

@Injectable()
export class EmailTemplateRenderer {
  /**
   * Renders HTML and text versions of an email message based on its template and variables.
   */
  render(message: EmailMessage): RenderedEmail {
    if (message.htmlContent) {
      return {
        html: message.htmlContent,
        text:
          message.textContent || message.htmlContent.replace(/<[^>]*>?/gm, ''),
      };
    }

    const template = message.template || 'generic';
    const vars = message.variables || {};

    switch (template) {
      case 'verify':
        return this.renderOtpEmail({
          code: str(vars['code']),
          title: 'Verify Your Email Address',
          subtitle:
            'Use the one-time code below to complete your Slotly registration or email verification.',
          expiryMinutes: Number(vars['expiryMinutes'] || 10),
        });

      case 'recovery':
        return this.renderOtpEmail({
          code: str(vars['code']),
          title: 'Reset Your Password',
          subtitle:
            'A password reset was requested for your Slotly account. Use the code below to proceed.',
          expiryMinutes: Number(vars['expiryMinutes'] || 15),
          warning:
            'If you did not request a password reset, you can safely ignore this email. Your account remains secure.',
        });

      case 'security-alert':
        return this.renderSecurityAlert({
          event: str(vars['event'], 'Security Activity Detected'),
          details:
            typeof vars['details'] === 'object' && vars['details'] !== null
              ? (vars['details'] as Record<string, unknown>)
              : vars,
          timestamp: str(vars['timestamp'], new Date().toUTCString()),
        });

      case 'invite':
        return this.renderInviteEmail({
          institutionName: str(
            vars['institutionName'],
            'an Academic Institution',
          ),
          inviterName: str(vars['inviterName'], 'An administrator'),
          role: str(vars['role'], 'Designer'),
          inviteUrl: str(vars['inviteUrl'], '#'),
        });

      default: {
        const msgText = str(
          vars['message'] || message.textContent || message.subject,
        );
        return {
          html: this.wrapBaseLayout(
            `<h2>${message.subject}</h2><p>${msgText}</p>`,
          ),
          text: msgText,
        };
      }
    }
  }

  private renderOtpEmail(params: {
    code: string;
    title: string;
    subtitle: string;
    expiryMinutes: number;
    warning?: string;
  }): RenderedEmail {
    const text = `${params.title}\n\n${params.subtitle}\n\nYour code: ${params.code}\n\nThis code will expire in ${params.expiryMinutes} minutes.\n${params.warning ? '\n' + params.warning : ''}`;

    const content = `
      <div style="margin-bottom: 24px;">
        <h1 style="color: #FAFAFA; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.02em;">
          ${params.title}
        </h1>
        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin: 0;">
          ${params.subtitle}
        </p>
      </div>

      <!-- OTP Box -->
      <div style="background-color: #111111; border: 1px solid #232323; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #FACC15; display: inline-block;">
          ${params.code}
        </span>
        <div style="color: #8A8A8A; font-size: 12px; margin-top: 12px; font-family: ui-monospace, SFMono-Regular, monospace;">
          Expires in ${params.expiryMinutes} minutes
        </div>
      </div>

      ${
        params.warning
          ? `<p style="color: #8A8A8A; font-size: 12px; line-height: 1.5; margin: 16px 0 0 0; border-top: 1px solid #232323; padding-top: 16px;">
               ${params.warning}
             </p>`
          : ''
      }
    `;

    return {
      html: this.wrapBaseLayout(content),
      text,
    };
  }

  private renderSecurityAlert(params: {
    event: string;
    details: Record<string, unknown>;
    timestamp: string;
  }): RenderedEmail {
    const detailRows = Object.entries(params.details)
      .filter(([k]) => k !== 'event' && k !== 'timestamp')
      .map(
        ([key, val]) =>
          `<tr>
            <td style="padding: 6px 12px; color: #8A8A8A; font-size: 12px; font-family: ui-monospace, monospace; text-transform: uppercase;">${key}</td>
            <td style="padding: 6px 12px; color: #FAFAFA; font-size: 13px; font-weight: 500;">${str(val)}</td>
          </tr>`,
      )
      .join('');

    const textDetailLines = Object.entries(params.details)
      .map(([k, v]) => `${k}: ${str(v)}`)
      .join('\n');

    const text = `Security Alert: ${params.event}\n\nTime: ${params.timestamp}\n\n${textDetailLines}\n\nIf you did not perform this action, please change your password immediately.`;

    const content = `
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; padding: 4px 8px; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; color: #EF4444; font-size: 11px; font-weight: 700; text-transform: uppercase; font-family: ui-monospace, monospace; margin-bottom: 12px;">
          Security Alert
        </span>
        <h1 style="color: #FAFAFA; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
          ${params.event}
        </h1>
        <p style="color: #8A8A8A; font-size: 13px; margin: 0;">
          We detected recent security activity on your Slotly account at <strong style="color: #FAFAFA;">${params.timestamp}</strong>.
        </p>
      </div>

      <div style="background-color: #111111; border: 1px solid #232323; border-radius: 8px; overflow: hidden; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <tbody>
            ${detailRows}
          </tbody>
        </table>
      </div>

      <p style="color: #8A8A8A; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0; border-top: 1px solid #232323; padding-top: 16px;">
        If you performed this action, no further response is needed. If you did not authorize this, please <a href="${process.env['CLIENT_URL'] || 'http://localhost:3000'}/users/me/security" style="color: #3B82F6; text-decoration: underline;">review your active sessions and reset your password</a> immediately.
      </p>
    `;

    return {
      html: this.wrapBaseLayout(content),
      text,
    };
  }

  private renderInviteEmail(params: {
    institutionName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
  }): RenderedEmail {
    const text = `You've been invited to join ${params.institutionName} on Slotly as a ${params.role}.\n\nAccept invitation: ${params.inviteUrl}`;

    const content = `
      <div style="margin-bottom: 24px;">
        <h1 style="color: #FAFAFA; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
          Join ${params.institutionName} on Slotly
        </h1>
        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin: 0;">
          ${params.inviterName} has invited you to collaborate on academic timetables as a <strong style="color: #FAFAFA;">${params.role}</strong>.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.inviteUrl}" style="background-color: #FACC15; color: #000000; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
    `;

    return {
      html: this.wrapBaseLayout(content),
      text,
    };
  }

  private wrapBaseLayout(content: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slotly</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FAFAFA;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #0A0A0A; border: 1px solid #232323; border-radius: 12px; overflow: hidden; padding: 32px;">
            <!-- Brand Header -->
            <tr>
              <td style="padding-bottom: 28px; border-bottom: 1px solid #232323;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 16px; font-weight: 800; letter-spacing: 0.1em; color: #FAFAFA;">
                    SLOTLY
                  </span>
                  <span style="color: #FACC15; font-size: 18px; line-height: 1;">●</span>
                </div>
              </td>
            </tr>

            <!-- Main Body -->
            <tr>
              <td style="padding-top: 28px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top: 32px; border-top: 1px solid #232323; margin-top: 32px; text-align: center;">
                <p style="color: #8A8A8A; font-size: 11px; margin: 0 0 6px 0; font-family: ui-monospace, monospace;">
                  Automated notification from Slotly Timetable Platform
                </p>
                <p style="color: #8A8A8A; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} Slotly. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
