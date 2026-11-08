// Unit tests validating RedisSessionsService token rotation, grace window, and reuse detection.
import { RedisSessionsService } from '../services/sessions.service';
import type { SessionData } from '../services/sessions.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import { UnauthorizedException } from '@nestjs/common';

describe('RedisSessionsService - Token Rotation & Reuse Detection', () => {
  let sessionsService: RedisSessionsService;
  let cache: InMemoryCacheService;

  beforeEach(() => {
    cache = new InMemoryCacheService();
    sessionsService = new RedisSessionsService(cache);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should rotate refresh token and advance session version', async () => {
    const { session, refreshToken: rt1 } = await sessionsService.createSession(
      'usr-1',
      'DESIGNER',
      { device: 'MacBook' },
    );

    expect(session.version).toBe(1);

    // Rotate refresh token (RT1 -> RT2)
    const rotated = await sessionsService.rotateRefreshToken(
      session.sessionId,
      rt1,
    );
    expect(rotated.refreshToken).not.toBe(rt1);
    expect(rotated.session.version).toBe(2);
    expect(rotated.session.usedTokenHashes).toHaveLength(1);

    // Rotate again (RT2 -> RT3)
    const rotatedAgain = await sessionsService.rotateRefreshToken(
      session.sessionId,
      rotated.refreshToken,
    );
    expect(rotatedAgain.session.version).toBe(3);
    expect(rotatedAgain.session.usedTokenHashes).toHaveLength(2);
  });

  it('should detect refresh token reuse and immediately revoke the compromised family', async () => {
    const { session, refreshToken: rt1 } = await sessionsService.createSession(
      'usr-compromise',
      'ADMIN',
    );

    // Legitimate rotation RT1 -> RT2
    const rotated = await sessionsService.rotateRefreshToken(
      session.sessionId,
      rt1,
    );

    // Simulate elapsed grace window so replay is detected as reuse rather than concurrent grace recovery
    const sessionObj = await cache.get<SessionData>(
      `slotly:session:${session.sessionId}`,
    );
    if (sessionObj) {
      sessionObj.graceRotatedAt = Date.now() - 15000;
      await cache.set(`slotly:session:${session.sessionId}`, sessionObj);
    }

    // An attacker attempts to replay the already-used RT1!
    await expect(
      sessionsService.rotateRefreshToken(session.sessionId, rt1),
    ).rejects.toThrow(UnauthorizedException);

    // Verify session has been completely revoked in Redis
    await expect(
      sessionsService.validateSession(session.sessionId),
    ).rejects.toThrow(UnauthorizedException);

    // Even presenting legitimate RT2 should now fail because family was revoked
    await expect(
      sessionsService.rotateRefreshToken(
        session.sessionId,
        rotated.refreshToken,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
