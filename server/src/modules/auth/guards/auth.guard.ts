import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SESSIONS_SERVICE } from '../services/sessions.service';
import type { SessionsService } from '../services/sessions.service';
import { USER_REPOSITORY } from '../../users/repositories/user.repository';
import type { UserRepository } from '../../users/repositories/user.repository';
import type { UserRole } from '@slotly/contracts';

export interface RequestUser {
  id: string;
  role: UserRole;
  sessionId: string;
  institutionId?: string | undefined;
  email?: string | undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
    @Optional()
    @Inject(USER_REPOSITORY)
    private readonly userRepo?: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: RequestUser;
    }>();

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header.',
      });
    }

    const token = authHeader.substring(7).trim();
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid JWT structure.',
      });
    }

    // Verify signature
    const [header, payload, signature] = parts;
    const secret =
      process.env['JWT_ACCESS_SECRET'] ||
      'slotly-dev-super-secure-access-token-secret-32-chars';
    const expectedSig = createHash('sha256')
      .update(`${header}.${payload}.${secret}`)
      .digest('base64url');

    if (signature !== expectedSig) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN_SIGNATURE',
        message: 'Token signature verification failed.',
      });
    }

    let parsedPayload: {
      sub: string;
      sid: string;
      role: UserRole;
      exp: number;
    };
    try {
      parsedPayload = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8'),
      ) as {
        sub: string;
        sid: string;
        role: UserRole;
        exp: number;
      };
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN_PAYLOAD',
        message: 'Invalid token payload JSON.',
      });
    }

    if (Date.now() >= parsedPayload.exp * 1000) {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Please refresh your token.',
      });
    }

    // Mandatory Redis session validation: a valid JWT alone is NEVER enough!
    const session = await this.sessionsService.validateSession(
      parsedPayload.sid,
    );
    await this.sessionsService.touchSession(parsedPayload.sid);

    let institutionId = session.institutionId;
    if (!institutionId && this.userRepo) {
      const user = await this.userRepo.findById(session.userId);
      if (user?.institutionId) {
        institutionId = user.institutionId.toString();
        await this.sessionsService.updateSessionInstitution(
          session.sessionId,
          institutionId,
        );
      }
    }

    request.user = {
      id: session.userId,
      role: session.role,
      sessionId: session.sessionId,
      institutionId,
    };

    return true;
  }
}
