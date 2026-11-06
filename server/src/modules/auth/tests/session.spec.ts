import { RedisSessionsService } from '../services/sessions.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { UnauthorizedException } from '@nestjs/common';

describe('RedisSessionsService - Lifecycle & Invalidation', () => {
  let sessionsService: RedisSessionsService;
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    sessionsService = new RedisSessionsService(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should validate an active session and fail for non-existent session', async () => {
    const { session } = await sessionsService.createSession(
      'usr-10',
      'FACULTY',
      {
        device: 'Mobile',
        ip: '192.168.1.1',
      },
    );

    const validated = await sessionsService.validateSession(session.sessionId);
    expect(validated.sessionId).toBe(session.sessionId);
    expect(validated.userId).toBe('usr-10');
    expect(validated.status).toBe('active');

    await expect(
      sessionsService.validateSession('ses_non_existent'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should revoke a single session and leave other user sessions active', async () => {
    const s1 = await sessionsService.createSession('usr-multi', 'DESIGNER');
    const s2 = await sessionsService.createSession('usr-multi', 'DESIGNER');

    await sessionsService.revokeSession(s1.session.sessionId);

    await expect(
      sessionsService.validateSession(s1.session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
    const validS2 = await sessionsService.validateSession(s2.session.sessionId);
    expect(validS2.sessionId).toBe(s2.session.sessionId);
  });

  it('should revoke all user sessions when requested', async () => {
    const s1 = await sessionsService.createSession('usr-logout-all', 'STUDENT');
    const s2 = await sessionsService.createSession('usr-logout-all', 'STUDENT');

    await sessionsService.revokeAllUserSessions('usr-logout-all');

    await expect(
      sessionsService.validateSession(s1.session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      sessionsService.validateSession(s2.session.sessionId),
    ).rejects.toThrow(UnauthorizedException);
  });
});
