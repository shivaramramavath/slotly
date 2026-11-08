// Orchestration service managing OAuth flows, account linking, onboarding, and connection lifecycles.
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ConnectedAccountDto,
  OAuthProviderKey,
  OAuthProvidersResponse,
  OnboardingDto,
  UserDto,
} from '@slotly/contracts';
import { AuditEventNames } from '@slotly/contracts';
import { Types } from 'mongoose';
import { AuditService } from '../../../common/audit/audit.service';
import { INSTITUTION_REPOSITORY } from '../../institutions/repositories/institution.repository';
import type { InstitutionRepository } from '../../institutions/repositories/institution.repository';
import { USER_REPOSITORY } from '../../users/repositories/user.repository';
import type { UserRepository } from '../../users/repositories/user.repository';
import { User } from '../../users/schemas/user.schema';
import { EMAIL_ADAPTER } from '../adapters/email.adapter';
import type { EmailAdapter } from '../adapters/email.adapter';
import { OAUTH_IDENTITY_REPOSITORY } from '../repositories/oauth-identity.repository';
import type { OAuthIdentityRepository } from '../repositories/oauth-identity.repository';
import { OAuthProviderRegistry } from '../strategies/oauth-provider.registry';
import { sanitizeNext } from '../utils/redirect-sanitizer';
import { AccountLinkingService } from './account-linking.service';
import { AuthSessionService, ClientMeta } from './auth-session.service';
import { OAuthStateService } from './oauth-state.service';
import { SESSIONS_SERVICE } from './sessions.service';
import type { SessionsService } from './sessions.service';

/** Result returned after initiating an OAuth authorization flow. */
export interface StartOAuthResult {
  authorizationUrl: string;
  bindingCookie: string;
}

/** Result returned after processing an OAuth redirect callback. */
export interface HandleCallbackResult {
  redirectUrl: string;
  refreshToken?: string | undefined;
}

/** Service managing OAuth provider authentication and connection operations. */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly callbackBaseUrl: string,
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly oauthStateService: OAuthStateService,
    private readonly accountLinkingService: AccountLinkingService,
    @Inject(OAUTH_IDENTITY_REPOSITORY)
    private readonly oauthIdentityRepo: OAuthIdentityRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepo: InstitutionRepository,
    private readonly authSessionService: AuthSessionService,
    @Inject(SESSIONS_SERVICE)
    private readonly sessionsService: SessionsService,
    @Inject(EMAIL_ADAPTER)
    private readonly emailAdapter: EmailAdapter,
    private readonly auditService: AuditService,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    return Types.ObjectId.isValid(id)
      ? new Types.ObjectId(id)
      : (id as unknown as Types.ObjectId);
  }

  private getCallbackUrl(provider: OAuthProviderKey): string {
    const base = (this.callbackBaseUrl || 'http://localhost:4000').replace(
      /\/+$/,
      '',
    );
    return `${base}/auth/oauth/${provider}/callback`;
  }

  private toUserDto(user: User): UserDto {
    const id = (user.id || (user as { _id?: unknown })._id)?.toString() || '';
    return {
      id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId?.toString(),
      departmentId: user.departmentId?.toString(),
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      status: user.status || 'active',
    };
  }

  /** Lists all configured OAuth providers with their enabled status. */
  listProviders(): OAuthProvidersResponse {
    return {
      providers: this.providerRegistry.listProviders(),
    };
  }

  /** Initiates an OAuth authorization flow, generating state and binding secret. */
  async start(params: {
    provider: OAuthProviderKey;
    mode?: 'login' | 'link' | undefined;
    next?: string | undefined;
    userId?: string | undefined;
  }): Promise<StartOAuthResult> {
    const provider = this.providerRegistry.getProvider(params.provider);
    if (!provider.isEnabled()) {
      throw new BadRequestException({
        code: 'oauth_disabled',
        message: `OAuth provider ${params.provider} is not enabled`,
      });
    }

    const mode = params.mode === 'link' ? 'link' : 'login';
    const cleanNext = sanitizeNext(params.next);

    const stateResult = await this.oauthStateService.createState({
      provider: params.provider,
      mode,
      next: cleanNext,
      userId: params.userId,
    });

    const redirectUri = this.getCallbackUrl(params.provider);
    const authorizationUrl = provider.getAuthorizationUrl({
      redirectUri,
      state: stateResult.state,
      codeChallenge: stateResult.codeChallenge,
      nonce: stateResult.nonce,
    });

    return {
      authorizationUrl,
      bindingCookie: stateResult.binding,
    };
  }

  /** Handles OAuth callback from provider, enforcing linking and session rules. */
  async handleCallback(params: {
    provider: OAuthProviderKey;
    code: string;
    state: string;
    bindingCookie?: string | undefined;
    meta: ClientMeta;
  }): Promise<HandleCallbackResult> {
    const { provider: providerKey, code, state, bindingCookie, meta } = params;

    const statePayload = await this.oauthStateService.consumeState(
      state,
      bindingCookie,
    );

    if (!statePayload || statePayload.provider !== providerKey) {
      this.logger.warn(
        `Invalid or expired OAuth state for provider ${providerKey}`,
      );
      return {
        redirectUrl: `/login?error=oauth_state_invalid`,
      };
    }

    const provider = this.providerRegistry.getProvider(providerKey);
    const redirectUri = this.getCallbackUrl(providerKey);

    let identity;
    try {
      identity = await provider.exchangeCode({
        code,
        redirectUri,
        codeVerifier: statePayload.pkceVerifier,
        nonce: statePayload.nonce,
      });
    } catch (err) {
      this.logger.error(`OAuth code exchange error for ${providerKey}`, err);
      const target =
        statePayload.mode === 'link'
          ? `/users/me/security?tab=connected&error=oauth_provider_error`
          : `/login?error=oauth_provider_error`;
      return { redirectUrl: target };
    }

    // Load candidate users from database
    const existingIdentity = await this.oauthIdentityRepo.findByProviderAndId(
      providerKey,
      identity.providerUserId,
    );

    const userByEmail = await this.userRepo.findByEmail(identity.email);
    const currentUser = statePayload.userId
      ? await this.userRepo.findById(statePayload.userId)
      : null;

    const decision = this.accountLinkingService.decide({
      mode: statePayload.mode,
      providerIdentity: identity,
      currentUser: currentUser
        ? {
            id:
              (
                currentUser.id || (currentUser as { _id?: unknown })._id
              )?.toString() || '',
            email: currentUser.email,
            isEmailVerified: currentUser.isEmailVerified,
            status: currentUser.status,
          }
        : null,
      existingIdentity: existingIdentity
        ? {
            id:
              (
                existingIdentity.id ||
                (existingIdentity as { _id?: unknown })._id
              )?.toString() || '',
            userId: existingIdentity.userId.toString(),
            provider: existingIdentity.provider,
            providerUserId: existingIdentity.providerUserId,
          }
        : null,
      userByEmail: userByEmail
        ? {
            id:
              (
                userByEmail.id || (userByEmail as { _id?: unknown })._id
              )?.toString() || '',
            email: userByEmail.email,
            isEmailVerified: userByEmail.isEmailVerified,
            status: userByEmail.status,
          }
        : null,
    });

    switch (decision.decision) {
      case 'RejectUnverifiedEmail':
      case 'RejectSuspended':
      case 'RejectUnauthorized':
      case 'RejectConflict': {
        const errorParam = `error=${decision.reason}`;
        const errorRedirect =
          statePayload.mode === 'link'
            ? `/users/me/security?tab=connected&${errorParam}`
            : `/login?${errorParam}`;

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LOGIN_FAILED,
          currentUser?.id || userByEmail?.id || 'anonymous',
          { type: 'OAuth', id: providerKey },
          {
            provider: providerKey,
            reason: decision.reason,
            email: identity.email,
          },
          meta.ip,
        );

        return { redirectUrl: errorRedirect };
      }

      case 'AlreadyLinked': {
        return {
          redirectUrl: `/users/me/security?tab=connected&info=already_linked`,
        };
      }

      case 'LinkToCurrentUser': {
        await this.oauthIdentityRepo.create({
          userId: this.toObjectId(decision.userId),
          provider: providerKey,
          providerUserId: identity.providerUserId,
          email: identity.email,
          name: identity.name,
          avatarUrl: identity.avatarUrl,
        });

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LINKED,
          decision.userId,
          {
            type: 'OAuthIdentity',
            id: `${providerKey}:${identity.providerUserId}`,
          },
          { provider: providerKey, email: identity.email },
          meta.ip,
        );

        return {
          redirectUrl: `/users/me/security?tab=connected&success=linked`,
        };
      }

      case 'LoginExisting': {
        const user = await this.userRepo.findById(decision.userId);
        if (!user) {
          return { redirectUrl: `/login?error=oauth_denied` };
        }

        const sessionResult = await this.authSessionService.issueSession(
          user,
          meta,
        );
        const rawUserId =
          user.id || (user as { _id?: unknown })._id?.toString() || '';

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LOGIN_SUCCESS,
          rawUserId,
          { type: 'User', id: rawUserId },
          { provider: providerKey, mode: 'existing' },
          meta.ip,
        );

        const target =
          user.status === 'pending_onboarding'
            ? '/onboarding'
            : statePayload.next;
        return {
          redirectUrl: target,
          refreshToken: sessionResult.refreshToken,
        };
      }

      case 'LinkAndLogin': {
        const user = await this.userRepo.findById(decision.userId);
        if (!user) {
          return { redirectUrl: `/login?error=oauth_denied` };
        }

        const rawUserId =
          user.id || (user as { _id?: unknown })._id?.toString() || '';

        await this.oauthIdentityRepo.create({
          userId: this.toObjectId(rawUserId),
          provider: providerKey,
          providerUserId: identity.providerUserId,
          email: identity.email,
          name: identity.name,
          avatarUrl: identity.avatarUrl,
        });

        const sessionResult = await this.authSessionService.issueSession(
          user,
          meta,
        );

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LINKED,
          rawUserId,
          {
            type: 'OAuthIdentity',
            id: `${providerKey}:${identity.providerUserId}`,
          },
          { provider: providerKey, email: identity.email },
          meta.ip,
        );

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LOGIN_SUCCESS,
          rawUserId,
          { type: 'User', id: rawUserId },
          { provider: providerKey, mode: 'linked' },
          meta.ip,
        );

        const target =
          user.status === 'pending_onboarding'
            ? '/onboarding'
            : statePayload.next;
        return {
          redirectUrl: target,
          refreshToken: sessionResult.refreshToken,
        };
      }

      case 'TakeOverUnverifiedAndLink': {
        const user = await this.userRepo.findById(decision.userId);
        if (!user) {
          return { redirectUrl: `/login?error=oauth_denied` };
        }

        const rawUserId =
          user.id || (user as { _id?: unknown })._id?.toString() || '';

        // Pre-hijack defense: invalidate password, history, and active sessions
        await this.sessionsService.revokeAllUserSessions(rawUserId);

        await this.userRepo.update(rawUserId, {
          isEmailVerified: true,
          passwordHash: '',
          passwordHistory: [],
        });

        await this.oauthIdentityRepo.create({
          userId: this.toObjectId(rawUserId),
          provider: providerKey,
          providerUserId: identity.providerUserId,
          email: identity.email,
          name: identity.name,
          avatarUrl: identity.avatarUrl,
        });

        await this.emailAdapter.sendSecurityAlert(
          user.email,
          'oauth_account_takeover',
          { provider: providerKey },
        );

        const updatedUser = (await this.userRepo.findById(rawUserId)) || user;
        const sessionResult = await this.authSessionService.issueSession(
          updatedUser,
          meta,
        );

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LINKED,
          rawUserId,
          {
            type: 'OAuthIdentity',
            id: `${providerKey}:${identity.providerUserId}`,
          },
          { provider: providerKey, preHijackTakeover: true },
          meta.ip,
        );

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_LOGIN_SUCCESS,
          rawUserId,
          { type: 'User', id: rawUserId },
          { provider: providerKey, mode: 'takeover' },
          meta.ip,
        );

        const target =
          updatedUser.status === 'pending_onboarding'
            ? '/onboarding'
            : statePayload.next;
        return {
          redirectUrl: target,
          refreshToken: sessionResult.refreshToken,
        };
      }

      case 'CreateUser': {
        const fallbackName =
          identity.name || identity.email.split('@')[0] || 'User';
        const newUser = await this.userRepo.create({
          email: identity.email,
          name: fallbackName,
          isEmailVerified: true,
          mfaEnabled: false,
          status: 'pending_onboarding',
          role: 'DESIGNER',
        });

        const rawUserId =
          newUser.id || (newUser as { _id?: unknown })._id?.toString() || '';

        await this.oauthIdentityRepo.create({
          userId: this.toObjectId(rawUserId),
          provider: providerKey,
          providerUserId: identity.providerUserId,
          email: identity.email,
          name: identity.name,
          avatarUrl: identity.avatarUrl,
        });

        const sessionResult = await this.authSessionService.issueSession(
          newUser,
          meta,
        );

        await this.auditService.log(
          AuditEventNames.AUTH_OAUTH_SIGNUP,
          rawUserId,
          { type: 'User', id: rawUserId },
          { provider: providerKey, email: identity.email },
          meta.ip,
        );

        return {
          redirectUrl: '/onboarding',
          refreshToken: sessionResult.refreshToken,
        };
      }
    }
  }

  /** Completes onboarding setup by establishing institution association for pending users. */
  async completeOnboarding(
    userId: string,
    dto: OnboardingDto,
    sessionId?: string,
  ): Promise<{ user: UserDto }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'pending_onboarding') {
      throw new BadRequestException('User has already completed onboarding');
    }

    let institution;
    let assignedRole = user.role || 'DESIGNER';

    if (dto.joinCode) {
      institution = await this.institutionRepo.findOne({
        code: dto.joinCode.toUpperCase().trim(),
        isDeleted: false,
      });
      if (!institution) {
        throw new NotFoundException(
          'Institution with provided join code was not found',
        );
      }
      assignedRole = 'DESIGNER';
    } else {
      const instName =
        dto.institutionName?.trim() || `${user.name}'s Institution`;
      const instCode = (
        dto.institutionCode ||
        instName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) ||
        'INST'
      ).toUpperCase();

      institution = await this.institutionRepo.create({
        name: instName,
        code: instCode,
        workingDays: [1, 2, 3, 4, 5],
        defaultPeriodConfig: {
          startTime: '09:00',
          periodDuration: 50,
          periodsPerDay: 7,
          breaks: [],
        },
        isComplete: true,
      });
      assignedRole = 'ADMIN';
    }

    const institutionId =
      institution.id ||
      (institution as { _id?: unknown })._id?.toString() ||
      '';

    await this.userRepo.update(userId, {
      status: 'active',
      role: assignedRole,
      institutionId: this.toObjectId(institutionId),
    });

    if (sessionId) {
      await this.sessionsService.updateSessionInstitution(
        sessionId,
        institutionId,
      );
    }

    const updated = await this.userRepo.findById(userId);
    const resolvedUser =
      updated && updated.status === 'active'
        ? updated
        : {
            ...user,
            status: 'active' as const,
            role: assignedRole,
            institutionId: this.toObjectId(institutionId),
          };

    return { user: this.toUserDto(resolvedUser) };
  }

  /** Retrieves list of connected OAuth accounts for a user. */
  async getConnections(userId: string): Promise<ConnectedAccountDto[]> {
    const identities = await this.oauthIdentityRepo.findByUserId(userId);
    return identities.map((id) => ({
      provider: id.provider,
      email: id.email,
      displayName: id.name || undefined,
      avatarUrl: id.avatarUrl || undefined,
      linkedAt: (id.createdAt || new Date()).toISOString(),
      lastLoginAt: (id.updatedAt || id.createdAt || new Date()).toISOString(),
    }));
  }

  /** Disconnects an OAuth identity link, enforcing last sign-in method security. */
  async unlinkConnection(
    userId: string,
    provider: OAuthProviderKey,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const identitiesCount = await this.oauthIdentityRepo.countByUserId(userId);
    const hasPassword = Boolean(
      user.passwordHash && user.passwordHash.trim().length > 0,
    );

    // Guard against leaving account with no sign-in mechanism
    if (identitiesCount <= 1 && !hasPassword) {
      throw new BadRequestException({
        code: 'oauth_account_conflict',
        message:
          'Cannot disconnect your only sign-in method. Please set a password or connect another provider first.',
      });
    }

    const deleted = await this.oauthIdentityRepo.deleteByUserAndProvider(
      userId,
      provider,
    );
    if (!deleted) {
      throw new NotFoundException(
        `No connected ${provider} account found to unlink`,
      );
    }

    const rawUserId =
      user.id || (user as { _id?: unknown })._id?.toString() || '';
    await this.auditService.log(
      AuditEventNames.AUTH_OAUTH_UNLINKED,
      rawUserId,
      { type: 'OAuthIdentity', id: `${provider}:${rawUserId}` },
      { provider },
    );

    return { success: true };
  }
}
