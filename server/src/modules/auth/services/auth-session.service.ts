// Domain service orchestrating session creation, device registration, and login audit emission.
import { Injectable, Inject, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UserDto, UserRole } from '@slotly/contracts';
import { SESSIONS_SERVICE } from './sessions.service';
import type { SessionsService, SessionData } from './sessions.service';
import { AuditService } from '../../../common/audit/audit.service';
import { EMAIL_ADAPTER } from '../adapters/email.adapter';
import type { EmailAdapter } from '../adapters/email.adapter';
import { USER_REPOSITORY } from '../../users/repositories/user.repository';
import type { UserRepository } from '../../users/repositories/user.repository';
import type { DeviceRecord } from '../../users/schemas/user.schema';

/** Client metadata extracted from HTTP request. */
export interface ClientMeta {
  ip?: string | undefined;
  device?: string | undefined;
  browser?: string | undefined;
}

/** Result of issuing an authenticated session. */
export interface IssueSessionResult {
  session: SessionData;
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

/** Options configuring session issuance. */
export interface IssueSessionOptions {
  mfaVerified?: boolean | undefined;
  auditAction?: string | undefined;
  isNewSignup?: boolean | undefined;
}

/** Constant representing auth session service dependency injection token. */
export const AUTH_SESSION_SERVICE = Symbol('AUTH_SESSION_SERVICE');

/** Injectable service coordinating session issuance and device logging. */
@Injectable()
export class AuthSessionService {
  constructor(
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    @Optional()
    @Inject(EMAIL_ADAPTER)
    private readonly emailAdapter?: EmailAdapter,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly userRepo?: UserRepository,
  ) {}

  /**
   * Issues a fully authenticated session, updates devices, and records audit trail.
   */
  async issueSession(
    user: {
      id?: string | undefined;
      _id?: unknown;
      email: string;
      role: UserRole;
      institutionId?: unknown;
      name?: string | undefined;
      isEmailVerified?: boolean | undefined;
      mfaEnabled?: boolean | undefined;
      status?: string | undefined;
    },
    meta: ClientMeta,
    options: IssueSessionOptions = {},
  ): Promise<IssueSessionResult> {
    const rawUserId =
      user.id || (user._id as { toString(): string })?.toString() || '';
    const institutionId =
      user.institutionId != null
        ? typeof user.institutionId === 'string'
          ? user.institutionId
          : (user.institutionId as { toString(): string }).toString()
        : undefined;

    const { session, accessToken, refreshToken } =
      await this.sessionsService.createSession(rawUserId, user.role, {
        institutionId,
        device: meta.device,
        browser: meta.browser,
        ip: meta.ip,
        mfaVerified: options.mfaVerified ?? false,
      });

    // Device tracking and new device alert
    await this.recordDevice(rawUserId, user.email, meta, options.isNewSignup);

    // Audit logging
    const action = options.auditAction || 'AUTH_LOGIN_SUCCESS';
    await this.auditService.log(
      action,
      rawUserId,
      { type: 'user', id: rawUserId },
      { sessionId: session.sessionId, role: user.role },
      meta.ip,
    );

    const userDto: UserDto = {
      id: rawUserId,
      email: user.email,
      name: user.name || user.email.split('@')[0] || 'User',
      role: user.role,
      institutionId,
      isEmailVerified: user.isEmailVerified ?? true,
      mfaEnabled: user.mfaEnabled ?? false,
      status:
        (user.status as
          'active' | 'suspended' | 'deactivated' | 'pending_onboarding') ||
        'active',
    };

    return { session, accessToken, refreshToken, user: userDto };
  }

  /**
   * Issues temporary signed MFA challenge token.
   */
  issueMfaChallenge(userId: string): { mfaRequired: true; mfaToken: string } {
    const payload = { userId, exp: Date.now() + 300000 };
    const mfaToken = `mfa_${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
    return { mfaRequired: true, mfaToken };
  }

  private async recordDevice(
    userId: string,
    email: string,
    meta: ClientMeta,
    isNewSignup = false,
  ): Promise<void> {
    if (!this.userRepo) return;

    try {
      const userDoc = await this.userRepo.findById(userId);
      if (!userDoc) return;

      const devices: DeviceRecord[] = userDoc.devices || [];
      const currentIp = meta.ip || '127.0.0.1';
      const currentBrowser = meta.browser || 'Unknown';
      const currentOs = meta.device || 'Unknown';

      const existingDevice = devices.find(
        (d) =>
          d.ip === currentIp &&
          d.browser === currentBrowser &&
          d.os === currentOs,
      );

      if (existingDevice) {
        existingDevice.lastActiveAt = new Date();
      } else {
        const newDevice: DeviceRecord = {
          deviceId: randomUUID(),
          name: `${currentBrowser} on ${currentOs}`,
          browser: currentBrowser,
          os: currentOs,
          ip: currentIp,
          lastActiveAt: new Date(),
          isTrusted: isNewSignup,
        };
        devices.push(newDevice);

        // Security notification for unexpected device login on existing accounts
        if (!isNewSignup && this.emailAdapter) {
          await this.emailAdapter.sendSecurityAlert(
            email,
            'New Sign-in from Unrecognized Device',
            {
              device: newDevice.name,
              ip: newDevice.ip,
              time: new Date().toISOString(),
            },
          );
        }
      }

      await this.userRepo.update(userId, { devices });
    } catch {
      // Non-critical device tracking failures should not break authentication
    }
  }
}
