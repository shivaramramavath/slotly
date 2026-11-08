// Unit tests for OAuthService covering start, callback linking, onboarding, and connection lifecycles.
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditEventNames } from '@slotly/contracts';
import { OAuthService } from '../services/oauth.service';
import type { OAuthProviderRegistry } from '../strategies/oauth-provider.registry';
import type { OAuthStateService } from '../services/oauth-state.service';
import type { AccountLinkingService } from '../services/account-linking.service';
import type { OAuthIdentityRepository } from '../repositories/oauth-identity.repository';
import type { UserRepository } from '../../users/repositories/user.repository';
import type { InstitutionRepository } from '../../institutions/repositories/institution.repository';
import type { User } from '../../users/schemas/user.schema';
import type { Institution } from '../../institutions/schemas/institution.schema';
import type { AuthSessionService } from '../services/auth-session.service';
import type { SessionsService } from '../services/sessions.service';
import type { EmailAdapter } from '../adapters/email.adapter';
import type { AuditService } from '../../../common/audit/audit.service';
import type {
  OAuthProvider,
  ProviderIdentity,
} from '../strategies/oauth-provider.interface';

describe('OAuthService', () => {
  let service: OAuthService;
  let mockRegistry: jest.Mocked<OAuthProviderRegistry>;
  let mockStateService: jest.Mocked<OAuthStateService>;
  let mockLinkingService: jest.Mocked<AccountLinkingService>;
  let mockIdentityRepo: jest.Mocked<OAuthIdentityRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockInstitutionRepo: jest.Mocked<InstitutionRepository>;
  let mockAuthSessionService: jest.Mocked<AuthSessionService>;
  let mockSessionsService: jest.Mocked<SessionsService>;
  let mockEmailAdapter: jest.Mocked<EmailAdapter>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockProvider: jest.Mocked<OAuthProvider>;

  beforeEach(() => {
    mockProvider = {
      key: 'google',
      name: 'Google',
      isEnabled: jest.fn().mockReturnValue(true),
      getAuthorizationUrl: jest
        .fn()
        .mockReturnValue('https://accounts.google.com/auth?state=s1'),
      exchangeCode: jest.fn(),
    };

    mockRegistry = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      listProviders: jest.fn().mockReturnValue([
        { key: 'google', name: 'Google', enabled: true },
        { key: 'github', name: 'GitHub', enabled: false },
      ]),
      register: jest.fn(),
    } as unknown as jest.Mocked<OAuthProviderRegistry>;

    mockStateService = {
      createState: jest.fn().mockResolvedValue({
        state: 'st-123',
        binding: 'b-123',
        codeChallenge: 'ch-123',
        codeVerifier: 'cv-123',
        nonce: 'n-123',
      }),
      consumeState: jest.fn(),
    } as unknown as jest.Mocked<OAuthStateService>;

    mockLinkingService = {
      decide: jest.fn(),
    };

    mockIdentityRepo = {
      create: jest.fn(),
      findByProviderAndId: jest.fn(),
      findByUserId: jest.fn(),
      findByUserAndProvider: jest.fn(),
      deleteByUserAndProvider: jest.fn(),
      countByUserId: jest.fn(),
    } as unknown as jest.Mocked<OAuthIdentityRepository>;

    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      countByInstitution: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockInstitutionRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<InstitutionRepository>;

    mockAuthSessionService = {
      issueSession: jest.fn().mockResolvedValue({
        session: { sessionId: 'ses_1', userId: 'u1' },
        accessToken: 'acc_1',
        refreshToken: 'ref_1',
        user: {
          id: 'u1',
          email: 'u@example.com',
          role: 'DESIGNER',
          status: 'active',
          isEmailVerified: true,
          mfaEnabled: false,
          name: 'User',
        },
      }),
      issueMfaChallenge: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionService>;

    mockSessionsService = {
      revokeAllUserSessions: jest.fn(),
      updateSessionInstitution: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    mockEmailAdapter = {
      sendOtp: jest.fn(),
      sendSecurityAlert: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    service = new OAuthService(
      'http://localhost:4000',
      mockRegistry,
      mockStateService,
      mockLinkingService,
      mockIdentityRepo,
      mockUserRepo,
      mockInstitutionRepo,
      mockAuthSessionService,
      mockSessionsService,
      mockEmailAdapter,
      mockAuditService,
    );
  });

  describe('listProviders', () => {
    it('returns available providers with enabled status', () => {
      const result = service.listProviders();
      expect(result.providers).toHaveLength(2);
      expect(result.providers[0]).toEqual({
        key: 'google',
        name: 'Google',
        enabled: true,
      });
    });
  });

  describe('start', () => {
    it('throws BadRequestException if provider is disabled', async () => {
      mockProvider.isEnabled.mockReturnValueOnce(false);
      await expect(service.start({ provider: 'google' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('generates state and constructs authorization URL with clean next target', async () => {
      const result = await service.start({
        provider: 'google',
        mode: 'login',
        next: '/projects/new',
      });

      expect(result.bindingCookie).toBe('b-123');
      expect(result.authorizationUrl).toBe(
        'https://accounts.google.com/auth?state=s1',
      );
      expect(mockStateService.createState).toHaveBeenCalledWith({
        provider: 'google',
        mode: 'login',
        next: '/projects/new',
        userId: undefined,
      });
    });
  });

  describe('handleCallback', () => {
    const meta = { ip: '127.0.0.1', browser: 'Chrome', device: 'Linux' };

    it('returns error redirect when state is invalid or expired', async () => {
      mockStateService.consumeState.mockResolvedValueOnce(null);

      const result = await service.handleCallback({
        provider: 'google',
        code: 'bad-code',
        state: 'invalid-state',
        meta,
      });

      expect(result.redirectUrl).toBe('/login?error=oauth_state_invalid');
    });

    it('handles CreateUser by creating pending_onboarding user and issuing session', async () => {
      mockStateService.consumeState.mockResolvedValueOnce({
        state: 'st-1',
        provider: 'google',
        mode: 'login',
        next: '/dashboard',
        binding: 'b-1',
        createdAt: Date.now(),
      });

      const identity: ProviderIdentity = {
        provider: 'google',
        providerUserId: 'gid-1',
        email: 'newuser@example.com',
        emailVerified: true,
        name: 'New User',
      };
      mockProvider.exchangeCode.mockResolvedValueOnce(identity);
      mockIdentityRepo.findByProviderAndId.mockResolvedValueOnce(null);
      mockUserRepo.findByEmail.mockResolvedValueOnce(null);

      mockLinkingService.decide.mockReturnValueOnce({
        decision: 'CreateUser',
        email: identity.email,
        name: identity.name,
      });

      const createdUserId = new Types.ObjectId();
      mockUserRepo.create.mockResolvedValueOnce({
        _id: createdUserId,
        id: createdUserId.toString(),
        email: identity.email,
        name: 'New User',
        status: 'pending_onboarding',
        role: 'DESIGNER',
        isEmailVerified: true,
        mfaEnabled: false,
      } as unknown as User);

      const result = await service.handleCallback({
        provider: 'google',
        code: 'code-1',
        state: 'st-1',
        bindingCookie: 'b-1',
        meta,
      });

      expect(result.redirectUrl).toBe('/onboarding');
      expect(result.refreshToken).toBe('ref_1');
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          status: 'pending_onboarding',
        }),
      );
      expect(mockIdentityRepo.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        AuditEventNames.AUTH_OAUTH_SIGNUP,
        createdUserId.toString(),
        expect.any(Object),
        expect.any(Object),
        '127.0.0.1',
      );
    });

    it('handles TakeOverUnverifiedAndLink with session revocation and security alert', async () => {
      mockStateService.consumeState.mockResolvedValueOnce({
        state: 'st-2',
        provider: 'google',
        mode: 'login',
        next: '/dashboard',
        binding: 'b-2',
        createdAt: Date.now(),
      });

      const identity: ProviderIdentity = {
        provider: 'google',
        providerUserId: 'gid-2',
        email: 'unverified@example.com',
        emailVerified: true,
      };
      mockProvider.exchangeCode.mockResolvedValueOnce(identity);
      mockIdentityRepo.findByProviderAndId.mockResolvedValueOnce(null);

      const existingUser = {
        _id: new Types.ObjectId(),
        id: 'u-unverified',
        email: 'unverified@example.com',
        status: 'active',
        role: 'DESIGNER',
        isEmailVerified: false,
      };
      mockUserRepo.findByEmail.mockResolvedValueOnce(
        existingUser as unknown as User,
      );
      mockUserRepo.findById.mockResolvedValue(existingUser as unknown as User);

      mockLinkingService.decide.mockReturnValueOnce({
        decision: 'TakeOverUnverifiedAndLink',
        userId: 'u-unverified',
      });

      const result = await service.handleCallback({
        provider: 'google',
        code: 'code-2',
        state: 'st-2',
        bindingCookie: 'b-2',
        meta,
      });

      expect(mockSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'u-unverified',
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith('u-unverified', {
        isEmailVerified: true,
        passwordHash: '',
        passwordHistory: [],
      });
      expect(mockEmailAdapter.sendSecurityAlert).toHaveBeenCalledWith(
        'unverified@example.com',
        'oauth_account_takeover',
        expect.any(Object),
      );
      expect(result.redirectUrl).toBe('/dashboard');
    });
  });

  describe('completeOnboarding', () => {
    it('creates institution when institutionName is provided and sets user as ADMIN', async () => {
      const user = {
        _id: new Types.ObjectId(),
        id: 'u-pending',
        email: 'p@example.com',
        status: 'pending_onboarding',
        name: 'Principal',
        role: 'DESIGNER',
      };
      mockUserRepo.findById.mockResolvedValue(user as unknown as User);

      const instId = new Types.ObjectId();
      mockInstitutionRepo.create.mockResolvedValueOnce({
        _id: instId,
        id: instId.toString(),
        name: 'Apex Academy',
        code: 'APEX',
      } as unknown as Institution);

      const result = await service.completeOnboarding(
        'u-pending',
        { institutionName: 'Apex Academy', institutionCode: 'APEX' },
        'ses_123',
      );

      expect(mockInstitutionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Apex Academy', code: 'APEX' }),
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'u-pending',
        expect.objectContaining({
          status: 'active',
          role: 'ADMIN',
          institutionId: instId,
        }),
      );
      expect(mockSessionsService.updateSessionInstitution).toHaveBeenCalledWith(
        'ses_123',
        instId.toString(),
      );
      expect(result.user.status).toBe('active');
    });

    it('rejects onboarding if user is not in pending_onboarding status', async () => {
      mockUserRepo.findById.mockResolvedValueOnce({
        id: 'u-active',
        status: 'active',
      } as unknown as User);

      await expect(
        service.completeOnboarding('u-active', { institutionName: 'School' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unlinkConnection', () => {
    it('rejects unlinking if user has no password and only one provider', async () => {
      mockUserRepo.findById.mockResolvedValueOnce({
        id: 'u-oauth-only',
        passwordHash: '',
      } as unknown as User);
      mockIdentityRepo.countByUserId.mockResolvedValueOnce(1);

      await expect(
        service.unlinkConnection('u-oauth-only', 'google'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows unlinking when user has a set password', async () => {
      mockUserRepo.findById.mockResolvedValueOnce({
        id: 'u-pass-user',
        passwordHash: 'hashed_password_value',
      } as unknown as User);
      mockIdentityRepo.countByUserId.mockResolvedValueOnce(1);
      mockIdentityRepo.deleteByUserAndProvider.mockResolvedValueOnce(true);

      const res = await service.unlinkConnection('u-pass-user', 'google');
      expect(res.success).toBe(true);
      expect(mockIdentityRepo.deleteByUserAndProvider).toHaveBeenCalledWith(
        'u-pass-user',
        'google',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        AuditEventNames.AUTH_OAUTH_UNLINKED,
        'u-pass-user',
        expect.any(Object),
        { provider: 'google' },
      );
    });
  });
});
