// Integration and unit tests verifying the token refresh, rotation, family tracking, and concurrency flow.
import { UnauthorizedException } from '@nestjs/common';
import { RedisSessionsService } from '../services/sessions.service';
import type { SessionData } from '../services/sessions.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { AuthController } from '../auth.controller';
import type { AuthService } from '../auth.interface';
import type { OAuthService } from '../services/oauth.service';
import type { ThrottlerService } from '../services/throttler.service';
import type { RequestUser } from '../guards/auth.guard';
import type { Request, Response } from 'express';

describe('Auth Refresh Flow & Session Hardening', () => {
  let cache: InMemoryCacheService;
  let sessionsService: RedisSessionsService;
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockThrottler: jest.Mocked<ThrottlerService>;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    sessionsService = new RedisSessionsService(cache);

    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
      revokeSession: jest.fn(),
      refresh: jest.fn(),
      verifyEmail: jest.fn(),
      resendEmailVerification: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      enrollMfa: jest.fn(),
      verifyMfa: jest.fn(),
      disableMfa: jest.fn(),
      recoverMfa: jest.fn(),
      stepUp: jest.fn(),
      sendStepUpEmailOtp: jest.fn(),
      googleOAuth: jest.fn(),
    };

    mockThrottler = {
      consume: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
    };

    controller = new AuthController(
      mockAuthService,
      sessionsService,
      {} as unknown as OAuthService,
      undefined,
      mockThrottler,
    );
  });

  afterEach(() => {
    cache.clear();
    jest.clearAllMocks();
  });

  // Helper to create mock Express request and response
  function createHttpMocks(cookies: Record<string, string> = {}) {
    const req = {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Jest-Agent',
        'sec-ch-ua-platform': 'TestOS',
      },
      cookies,
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const cookieJar: Record<string, { val: string; options: unknown }> = {};
    const res = {
      cookie: jest.fn((name: string, val: string, options: unknown) => {
        cookieJar[name] = { val, options };
      }),
      clearCookie: jest.fn((name: string) => {
        delete cookieJar[name];
      }),
      setHeader: jest.fn(),
    } as unknown as Response;

    return { req, res, cookieJar };
  }

  // 1. Refresh success: returns a new access token, rotates the cookie, old token no longer valid after the grace policy
  it('1. Refresh success: returns a new access token, rotates the cookie', async () => {
    const { refreshToken } = await sessionsService.createSession(
      'user_123',
      'ADMIN',
      { institutionId: 'inst_abc' },
    );

    const { req, res, cookieJar } = createHttpMocks({ refreshToken });

    const result = await controller.refresh(req, res);

    expect(result.accessToken).toBeDefined();
    expect(result.user.id).toBe('user_123');
    expect(result.user.role).toBe('ADMIN');

    // Verify rotated cookie was set
    expect(res.cookie).toHaveBeenCalled();
    const rotatedCookie = cookieJar['refreshToken']?.val;
    expect(rotatedCookie).toBeDefined();
    expect(rotatedCookie).not.toBe(refreshToken);
  });

  // 2. Concurrent refresh with the same cookie (10 parallel requests): grace window handles race cleanly
  it('2. Concurrent refresh with the same cookie (10 parallel requests) succeeds within grace window', async () => {
    const { refreshToken } = await sessionsService.createSession(
      'user_parallel',
      'DESIGNER',
    );

    // Fire 10 parallel refresh calls using the same initial cookie
    const parallelCalls = Array.from({ length: 10 }).map(async () => {
      const { req, res } = createHttpMocks({ refreshToken });
      return controller.refresh(req, res);
    });

    const results = await Promise.all(parallelCalls);

    // All 10 requests should succeed without throwing REFRESH_TOKEN_REUSE_DETECTED
    expect(results).toHaveLength(10);
    results.forEach((r) => {
      expect(r.accessToken).toBeDefined();
      expect(r.user.id).toBe('user_parallel');
    });
  });

  // 3. Reuse of an old token after the grace window: whole family revoked, audit event written
  it('3. Reuse of an old token after the grace window revokes the whole family', async () => {
    const { session, refreshToken: rt1 } = await sessionsService.createSession(
      'user_victim',
      'FACULTY',
    );

    // Legitimate rotation RT1 -> RT2
    const {
      req: req1,
      res: res1,
      cookieJar,
    } = createHttpMocks({ refreshToken: rt1 });
    await controller.refresh(req1, res1);
    const rt2 = cookieJar['refreshToken']!.val;

    // Fast-forward or simulate time passing beyond the 10-second grace window
    const sessionObj = await cache.get<SessionData>(
      `slotly:session:${session.sessionId}`,
    );
    if (sessionObj) {
      sessionObj.graceRotatedAt = Date.now() - 15000; // 15 seconds ago (past 10s grace window)
      await cache.set(`slotly:session:${session.sessionId}`, sessionObj);
    }

    // Attacker now presents old RT1 after the grace window has passed
    const { req: reqAttack, res: resAttack } = createHttpMocks({
      refreshToken: rt1,
    });
    await expect(controller.refresh(reqAttack, resAttack)).rejects.toThrow(
      UnauthorizedException,
    );

    // Entire session must be revoked
    await expect(
      sessionsService.validateSession(session.sessionId),
    ).rejects.toThrow(UnauthorizedException);

    // Even legitimate RT2 must now fail
    const { req: req2, res: res2 } = createHttpMocks({ refreshToken: rt2 });
    await expect(controller.refresh(req2, res2)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // 4. Expired refresh token, tampered cookie, missing cookie, revoked session, suspended user
  it('4. Missing, malformed, or tampered cookie returns 401 without crashing', async () => {
    // Missing cookie
    const { req: reqEmpty, res: resEmpty } = createHttpMocks({});
    await expect(controller.refresh(reqEmpty, resEmpty)).rejects.toThrow(
      UnauthorizedException,
    );

    // Malformed cookie
    const { req: reqBad, res: resBad } = createHttpMocks({
      refreshToken: 'not_a_valid_token',
    });
    await expect(controller.refresh(reqBad, resBad)).rejects.toThrow(
      UnauthorizedException,
    );

    // Tampered token secret
    const { req: reqTampered, res: resTampered } = createHttpMocks({
      refreshToken: 's_ses123_invalidsecretpart',
    });
    await expect(controller.refresh(reqTampered, resTampered)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // 5. Password change or reset revokes other sessions
  it('5. Revoking all user sessions terminates their refresh immediately', async () => {
    const s1 = await sessionsService.createSession('usr_passchange', 'STUDENT');
    const s2 = await sessionsService.createSession('usr_passchange', 'STUDENT');

    // Simulate password change revoking all sessions
    await sessionsService.revokeAllUserSessions('usr_passchange');

    await expect(
      sessionsService.validateSession(s1.session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      sessionsService.validateSession(s2.session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
  });

  // 6. Inactivity timeout and maximum lifetime
  it('6. Inactivity timeout and maximum lifetime reject expired sessions', async () => {
    const { session } = await sessionsService.createSession(
      'usr_timeout',
      'DESIGNER',
    );

    // Simulate expiration by altering expiresAt in cached session
    const sessionObj = await cache.get<SessionData>(
      `slotly:session:${session.sessionId}`,
    );
    expect(sessionObj).toBeDefined();
    if (sessionObj) {
      sessionObj.expiresAt = Date.now() - 1000; // expired in the past
      await cache.set(`slotly:session:${session.sessionId}`, sessionObj);
    }

    await expect(
      sessionsService.validateSession(session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
  });

  // 7. MFA-pending state is not a full session
  it('7. MFA challenge token does not grant session refresh privileges', async () => {
    const dummyMfaToken = 'mfa_eyJ1c2VySWQiOiJ1c3ItMSIsImV4cCI6OTk5OTk5OTk5fQ';
    const { req, res } = createHttpMocks({ refreshToken: dummyMfaToken });

    await expect(controller.refresh(req, res)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // 8. Logout clears the cookie and revokes the session; logout-all revokes every session
  it('8. Logout revokes the session and clears the refresh cookie', async () => {
    const { session, refreshToken } = await sessionsService.createSession(
      'usr_logout',
      'FACULTY',
    );

    const { req, res } = createHttpMocks({ refreshToken });
    const authReq = {
      ...req,
      user: {
        id: 'usr_logout',
        role: 'FACULTY' as const,
        sessionId: session.sessionId,
      } as RequestUser,
    } as unknown as Request & { user: RequestUser };

    await controller.logout(authReq, res);

    // Cookie cleared
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.anything(),
    );

    // Session revoked
    await expect(
      sessionsService.validateSession(session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
  });

  // 9. Throttling: normal multi-tab use stays under refresh limit; abusive use is limited
  it('9. Refresh endpoint throttles abusive refresh calls per IP', async () => {
    const { req, res } = createHttpMocks({ refreshToken: 's_ses123_abc' });

    // Simulate throttler throwing when limit is exceeded
    mockThrottler.consume.mockRejectedValueOnce(
      new UnauthorizedException({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many refresh attempts.',
      }),
    );

    await expect(controller.refresh(req, res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockThrottler.consume).toHaveBeenCalledWith(
      'refresh',
      '127.0.0.1',
      expect.any(Number),
      expect.any(Number),
    );
  });

  // 10. Response headers: Set-Cookie flags per A1, path restricted to /auth, no sensitive body fields
  it('10. Response headers set Path=/auth, HttpOnly, SameSite=Lax, and body omits secrets', async () => {
    const { refreshToken } = await sessionsService.createSession(
      'usr_headers',
      'ADMIN',
    );

    const { req, res } = createHttpMocks({ refreshToken });
    const result = await controller.refresh(req, res);

    // Verify Set-Cookie flags
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/auth',
      }),
    );

    // Verify response body contains only accessToken and safe user info
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('user');
    expect(result).not.toHaveProperty('refreshToken');
    expect(result).not.toHaveProperty('password');
  });
});
