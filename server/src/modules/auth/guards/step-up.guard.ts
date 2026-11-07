// Route guard controlling access for step-up.guard.
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { SESSIONS_SERVICE } from '../services/sessions.service';
import type { SessionsService } from '../services/sessions.service';
import type { RequestUser } from './auth.guard';

/** Constant representing require step up key. */
export const REQUIRE_STEP_UP_KEY = 'requireStepUp';

/** Injectable service providing step up guard logic. */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(
    @Inject(SESSIONS_SERVICE) private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user?.sessionId) {
      throw new ForbiddenException({
        code: 'STEP_UP_REQUIRED',
        message: 'Recent authentication is required for this sensitive action.',
      });
    }

    const isValid = await this.sessionsService.isStepUpValid(user.sessionId);
    if (!isValid) {
      throw new ForbiddenException({
        code: 'STEP_UP_REQUIRED',
        message:
          'Please re-authenticate with your password or MFA to confirm this sensitive action.',
      });
    }

    return true;
  }
}
