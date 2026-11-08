// Domain service orchestrating sessions.service business logic.
import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { UserRole } from '@slotly/contracts';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';

/** Constant representing sessions service. */
export const SESSIONS_SERVICE = Symbol('SESSIONS_SERVICE');

/** Interface defining structure for session data. */
export interface SessionData {
  sessionId: string;
  userId: string;
  role: UserRole;
  institutionId?: string | undefined;
  device: string;
  browser: string;
  ip: string;
  tokenFamilyId: string;
  currentRefreshTokenHash: string;
  usedTokenHashes: string[]; // Track historical hashes in this family to detect reuse
  graceTokenHash?: string | undefined;
  graceRotatedAt?: number | undefined;
  graceAccessToken?: string | undefined;
  graceRefreshToken?: string | undefined;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  status: 'active' | 'revoked';
  mfaVerified: boolean;
  stepUpUntil?: number | undefined;
  version: number;
}

/** Interface defining structure for rotated tokens. */
export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
  session: SessionData;
}

/** Interface defining structure for sessions service. */
export interface SessionsService {
  createSession(
    userId: string,
    role: UserRole,
    meta?: {
      institutionId?: string | undefined;
      device?: string | undefined;
      browser?: string | undefined;
      ip?: string | undefined;
      mfaVerified?: boolean | undefined;
    },
  ): Promise<{
    session: SessionData;
    accessToken: string;
    refreshToken: string;
  }>;
  validateSession(sessionId: string): Promise<SessionData>;
  touchSession(sessionId: string): Promise<void>;
  updateSessionInstitution(
    sessionId: string,
    institutionId: string,
  ): Promise<void>;
  rotateRefreshToken(
    sessionId: string,
    presentedRefreshToken: string,
  ): Promise<RotatedTokens>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void>;
  listUserSessions(userId: string): Promise<SessionData[]>;
  setMfaVerified(sessionId: string): Promise<void>;
  setStepUp(sessionId: string, durationSeconds?: number): Promise<void>;
  isStepUpValid(sessionId: string): Promise<boolean>;
  generateAccessToken(
    userId: string,
    sessionId: string,
    role: UserRole,
  ): string;
}

/** Injectable service providing redis sessions service logic. */
@Injectable()
export class RedisSessionsService implements SessionsService {
  private readonly logger = new Logger(RedisSessionsService.name);
  private readonly inactivityTtl = 7 * 24 * 3600; // 7 days in seconds
  private readonly maxLifetime = 30 * 24 * 3600; // 30 days in seconds

  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  private getSessionKey(sessionId: string): string {
    return `slotly:session:${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `slotly:user_sessions:${userId}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token.trim()).digest('hex');
  }

  generateAccessToken(
    userId: string,
    sessionId: string,
    role: UserRole,
  ): string {
    // Generate stateless signed Bearer token with expiration
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        sid: sessionId,
        role,
        exp,
        iat: Math.floor(Date.now() / 1000),
      }),
    ).toString('base64url');

    const secret =
      process.env['JWT_ACCESS_SECRET'] ||
      'slotly-dev-super-secure-access-token-secret-32-chars';
    const signature = createHash('sha256')
      .update(`${header}.${payload}.${secret}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  async createSession(
    userId: string,
    role: UserRole,
    meta: {
      institutionId?: string | undefined;
      device?: string | undefined;
      browser?: string | undefined;
      ip?: string | undefined;
      mfaVerified?: boolean | undefined;
    } = {},
  ): Promise<{
    session: SessionData;
    accessToken: string;
    refreshToken: string;
  }> {
    const sessionId = `ses_${randomUUID().replace(/-/g, '')}`;
    const tokenFamilyId = `fam_${randomUUID().replace(/-/g, '')}`;
    const rawRefreshToken = `s_${sessionId}_${randomBytes(32).toString('hex')}`;
    const refreshTokenHash = this.hashToken(rawRefreshToken);

    const now = Date.now();
    const session: SessionData = {
      sessionId,
      userId,
      role,
      institutionId: meta.institutionId,
      device: meta.device || 'Unknown Device',
      browser: meta.browser || 'Unknown Browser',
      ip: meta.ip || '127.0.0.1',
      tokenFamilyId,
      currentRefreshTokenHash: refreshTokenHash,
      usedTokenHashes: [],
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + this.maxLifetime * 1000,
      status: 'active',
      mfaVerified: meta.mfaVerified ?? false,
      version: 1,
    };

    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      this.inactivityTtl,
    );

    // Track session ID in user's active session set
    const userSessionsKey = this.getUserSessionsKey(userId);
    const existingList =
      (await this.cache.get<string[]>(userSessionsKey)) || [];
    if (!existingList.includes(sessionId)) {
      existingList.push(sessionId);
      await this.cache.set(userSessionsKey, existingList, this.maxLifetime);
    }

    const accessToken = this.generateAccessToken(userId, sessionId, role);
    return { session, accessToken, refreshToken: rawRefreshToken };
  }

  async validateSession(sessionId: string): Promise<SessionData> {
    const session = await this.cache.get<SessionData>(
      this.getSessionKey(sessionId),
    );
    if (!session || session.status !== 'active') {
      throw new UnauthorizedException({
        code: 'SESSION_INVALID_OR_REVOKED',
        message:
          'Your session has ended or been revoked. Please sign in again.',
      });
    }

    const now = Date.now();
    // Max lifetime check
    if (now > session.expiresAt) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has reached its maximum lifetime.',
      });
    }

    return session;
  }

  async touchSession(sessionId: string): Promise<void> {
    const session = await this.cache.get<SessionData>(
      this.getSessionKey(sessionId),
    );
    if (session && session.status === 'active') {
      session.lastActiveAt = Date.now();
      await this.cache.set(
        this.getSessionKey(sessionId),
        session,
        this.inactivityTtl,
      );
    }
  }

  async updateSessionInstitution(
    sessionId: string,
    institutionId: string,
  ): Promise<void> {
    const key = this.getSessionKey(sessionId);
    const session = await this.cache.get<SessionData>(key);
    if (session) {
      session.institutionId = institutionId;
      await this.cache.set(key, session, this.inactivityTtl);
    }
  }

  async rotateRefreshToken(
    sessionId: string,
    presentedRefreshToken: string,
  ): Promise<RotatedTokens> {
    const session = await this.validateSession(sessionId);
    const presentedHash = this.hashToken(presentedRefreshToken);

    // Grace Window Recovery: allow concurrent refresh requests within 10 seconds of rotation
    if (session.graceTokenHash && session.graceTokenHash === presentedHash) {
      const elapsed = Date.now() - (session.graceRotatedAt || 0);
      if (
        elapsed < 10000 &&
        session.graceAccessToken &&
        session.graceRefreshToken
      ) {
        this.logger.log(
          `[SESSIONS_SERVICE] Grace recovery: concurrent refresh on session ${sessionId} (${elapsed}ms elapsed)`,
        );
        return {
          accessToken: session.graceAccessToken,
          refreshToken: session.graceRefreshToken,
          session,
        };
      } else {
        this.logger.warn(
          `[SECURITY ALERT] Refresh token reuse after grace window for session ${sessionId} (family: ${session.tokenFamilyId}). Revoking session family!`,
        );
        await this.revokeSession(sessionId);
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_REUSE_DETECTED',
          message:
            'A security anomaly occurred. All sessions in this family have been terminated for your protection.',
        });
      }
    }

    // Reuse Detection: check if token was already used in this family!
    if (session.usedTokenHashes.includes(presentedHash)) {
      this.logger.warn(
        `[SECURITY ALERT] Refresh token reuse detected for session ${sessionId} (family: ${session.tokenFamilyId}). Revoking session family immediately!`,
      );
      await this.revokeSession(sessionId);
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSE_DETECTED',
        message:
          'A security anomaly occurred. All sessions in this family have been terminated for your protection.',
      });
    }

    if (session.currentRefreshTokenHash !== presentedHash) {
      this.logger.warn(
        `Invalid refresh token presented for session ${sessionId}`,
      );
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token presented.',
      });
    }

    // Atomic rotation
    const newRefreshToken = `s_${sessionId}_${randomBytes(32).toString('hex')}`;
    const newHash = this.hashToken(newRefreshToken);

    const accessToken = this.generateAccessToken(
      session.userId,
      sessionId,
      session.role,
    );

    session.usedTokenHashes.push(presentedHash);
    session.graceTokenHash = presentedHash;
    session.graceRotatedAt = Date.now();
    session.graceAccessToken = accessToken;
    session.graceRefreshToken = newRefreshToken;
    session.currentRefreshTokenHash = newHash;
    session.lastActiveAt = Date.now();
    session.version += 1;

    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      this.inactivityTtl,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      session,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.cache.get<SessionData>(
      this.getSessionKey(sessionId),
    );
    if (session) {
      session.status = 'revoked';
      await this.cache.set(this.getSessionKey(sessionId), session, 60); // brief tombstone
      await this.cache.del(this.getSessionKey(sessionId));

      // Remove from user's active session list
      const userSessionsKey = this.getUserSessionsKey(session.userId);
      const list = (await this.cache.get<string[]>(userSessionsKey)) || [];
      const updated = list.filter((id) => id !== sessionId);
      await this.cache.set(userSessionsKey, updated, this.maxLifetime);
    }
  }

  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    const sessionIds = (await this.cache.get<string[]>(userSessionsKey)) || [];

    for (const sid of sessionIds) {
      if (sid !== exceptSessionId) {
        await this.revokeSession(sid);
      }
    }
  }

  async listUserSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    const sessionIds = (await this.cache.get<string[]>(userSessionsKey)) || [];

    const activeSessions: SessionData[] = [];
    for (const sid of sessionIds) {
      const sess = await this.cache.get<SessionData>(this.getSessionKey(sid));
      if (sess && sess.status === 'active') {
        activeSessions.push(sess);
      }
    }
    return activeSessions;
  }

  async setMfaVerified(sessionId: string): Promise<void> {
    const session = await this.validateSession(sessionId);
    session.mfaVerified = true;
    session.lastActiveAt = Date.now();
    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      this.inactivityTtl,
    );
  }

  async setStepUp(
    sessionId: string,
    durationSeconds: number = 600,
  ): Promise<void> {
    const session = await this.validateSession(sessionId);
    session.stepUpUntil = Date.now() + durationSeconds * 1000;
    await this.cache.set(
      this.getSessionKey(sessionId),
      session,
      this.inactivityTtl,
    );
  }

  async isStepUpValid(sessionId: string): Promise<boolean> {
    const session = await this.cache.get<SessionData>(
      this.getSessionKey(sessionId),
    );
    if (!session || !session.stepUpUntil) return false;
    return Date.now() < session.stepUpUntil;
  }
}
