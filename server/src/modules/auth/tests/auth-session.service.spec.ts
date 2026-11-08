// Unit tests for AuthSessionService validating session issuance, device tracking, and MFA challenge generation.
import { AuthSessionService } from '../services/auth-session.service';
import type { SessionsService } from '../services/sessions.service';
import type { AuditService } from '../../../common/audit/audit.service';
import type { EmailAdapter } from '../adapters/email.adapter';
import type { UserRepository } from '../../users/repositories/user.repository';

describe('AuthSessionService', () => {
  let service: AuthSessionService;
  let mockSessionsService: jest.Mocked<SessionsService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEmailAdapter: jest.Mocked<EmailAdapter>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockSessionsService = {
      createSession: jest.fn().mockResolvedValue({
        session: {
          sessionId: 'ses_123',
          userId: 'user_123',
          role: 'ADMIN',
          status: 'active',
          device: 'Macintosh',
          browser: 'Chrome',
          ip: '127.0.0.1',
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          expiresAt: Date.now() + 7 * 86400000,
          mfaVerified: true,
        },
        accessToken: 'access.token.jwt',
        refreshToken: 'refresh.token.val',
      }),
      validateSession: jest.fn(),
      revokeSession: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      rotateRefreshToken: jest.fn(),
      listUserSessions: jest.fn(),
      setStepUp: jest.fn(),
      isStepUpValid: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    mockEmailAdapter = {
      sendOtp: jest.fn().mockResolvedValue(undefined),
      sendSecurityAlert: jest.fn().mockResolvedValue(undefined),
    };

    mockUserRepo = {
      findById: jest.fn().mockResolvedValue({
        _id: 'user_123',
        email: 'test@slotly.local',
        devices: [],
      }),
      update: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<UserRepository>;

    service = new AuthSessionService(
      mockSessionsService,
      mockAuditService,
      mockEmailAdapter,
      mockUserRepo,
    );
  });

  it('issues session with access and refresh tokens and records audit log', async () => {
    const user = {
      id: 'user_123',
      email: 'test@slotly.local',
      role: 'ADMIN' as const,
      institutionId: 'inst_123',
    };
    const meta = { ip: '10.0.0.1', device: 'Windows', browser: 'Firefox' };

    const result = await service.issueSession(user, meta, {
      mfaVerified: true,
      auditAction: 'AUTH_LOGIN_SUCCESS',
    });

    expect(result.session.sessionId).toBe('ses_123');
    expect(result.accessToken).toBe('access.token.jwt');
    expect(result.refreshToken).toBe('refresh.token.val');
    expect(mockSessionsService.createSession).toHaveBeenCalledWith(
      'user_123',
      'ADMIN',
      expect.objectContaining({
        device: 'Windows',
        browser: 'Firefox',
        mfaVerified: true,
      }),
    );
    expect(mockAuditService.log).toHaveBeenCalledWith(
      'AUTH_LOGIN_SUCCESS',
      'user_123',
      expect.any(Object),
      expect.any(Object),
      '10.0.0.1',
    );
  });

  it('sends new device security alert on unrecognized device for existing account', async () => {
    const user = {
      id: 'user_123',
      email: 'test@slotly.local',
      role: 'DESIGNER' as const,
    };
    const meta = { ip: '192.168.1.1', device: 'Linux', browser: 'Chrome' };

    await service.issueSession(user, meta, { isNewSignup: false });

    expect(mockUserRepo.update).toHaveBeenCalledWith(
      'user_123',
      expect.objectContaining({
        devices: expect.any(Array) as unknown,
      }),
    );
    expect(mockEmailAdapter.sendSecurityAlert).toHaveBeenCalledWith(
      'test@slotly.local',
      'New Sign-in from Unrecognized Device',
      expect.any(Object),
    );
  });

  it('does not send security alert on new signup', async () => {
    const user = {
      id: 'user_new',
      email: 'new@slotly.local',
      role: 'STUDENT' as const,
    };
    const meta = { ip: '127.0.0.1', device: 'iOS', browser: 'Safari' };

    await service.issueSession(user, meta, { isNewSignup: true });

    expect(mockEmailAdapter.sendSecurityAlert).not.toHaveBeenCalled();
  });

  it('issues signed MFA challenge with 5-minute expiry', () => {
    const challenge = service.issueMfaChallenge('user_xyz');
    expect(challenge.mfaRequired).toBe(true);
    expect(challenge.mfaToken.startsWith('mfa_')).toBe(true);

    const base64Part = challenge.mfaToken.replace('mfa_', '');
    const decoded = JSON.parse(
      Buffer.from(base64Part, 'base64url').toString('utf-8'),
    ) as { userId: string; exp: number };
    expect(decoded.userId).toBe('user_xyz');
    expect(decoded.exp).toBeGreaterThan(Date.now() + 290000);
  });
});
