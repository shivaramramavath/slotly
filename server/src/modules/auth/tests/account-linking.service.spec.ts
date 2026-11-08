// Unit tests validating all decision branches of AccountLinkingService state machine.
import { AccountLinkingService } from '../services/account-linking.service';

describe('AccountLinkingService', () => {
  let service: AccountLinkingService;

  beforeEach(() => {
    service = new AccountLinkingService();
  });

  const baseProviderIdentity = {
    provider: 'google' as const,
    providerUserId: 'google-uid-123',
    email: 'user@example.com',
    emailVerified: true,
    name: 'Test User',
    avatarUrl: 'https://example.com/photo.jpg',
  };

  describe('Unverified email handling', () => {
    it('rejects login when provider email is unverified', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: { ...baseProviderIdentity, emailVerified: false },
      });

      expect(result).toEqual({
        decision: 'RejectUnverifiedEmail',
        reason: 'oauth_email_unverified',
      });
    });

    it('rejects link when provider email is unverified', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: { ...baseProviderIdentity, emailVerified: false },
        currentUser: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'RejectUnverifiedEmail',
        reason: 'oauth_email_unverified',
      });
    });
  });

  describe('Link mode', () => {
    it('rejects unauthorized when currentUser is absent', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: null,
      });

      expect(result).toEqual({
        decision: 'RejectUnauthorized',
        reason: 'oauth_denied',
      });
    });

    it('rejects when currentUser is suspended', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'suspended',
        },
      });

      expect(result).toEqual({
        decision: 'RejectSuspended',
        reason: 'account_suspended',
      });
    });

    it('returns AlreadyLinked when identity is already linked to currentUser', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
        existingIdentity: {
          id: 'id-1',
          userId: 'u-1',
          provider: 'google',
          providerUserId: 'google-uid-123',
        },
      });

      expect(result).toEqual({
        decision: 'AlreadyLinked',
        userId: 'u-1',
      });
    });

    it('rejects conflict when identity is linked to a different user', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
        existingIdentity: {
          id: 'id-2',
          userId: 'u-999',
          provider: 'google',
          providerUserId: 'google-uid-123',
        },
      });

      expect(result).toEqual({
        decision: 'RejectConflict',
        reason: 'link_conflict',
      });
    });

    it('rejects conflict when provider email belongs to another existing user', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: {
          id: 'u-1',
          email: 'user1@example.com',
          isEmailVerified: true,
          status: 'active',
        },
        userByEmail: {
          id: 'u-2',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'RejectConflict',
        reason: 'link_conflict',
      });
    });

    it('approves LinkToCurrentUser on clean match', () => {
      const result = service.decide({
        mode: 'link',
        providerIdentity: baseProviderIdentity,
        currentUser: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
        userByEmail: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'LinkToCurrentUser',
        userId: 'u-1',
      });
    });
  });

  describe('Login mode', () => {
    it('returns LoginExisting when identity is already linked', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: baseProviderIdentity,
        existingIdentity: {
          id: 'id-1',
          userId: 'u-1',
          provider: 'google',
          providerUserId: 'google-uid-123',
        },
        userByEmail: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'LoginExisting',
        userId: 'u-1',
      });
    });

    it('rejects suspended user even if identity exists', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: baseProviderIdentity,
        existingIdentity: {
          id: 'id-1',
          userId: 'u-1',
          provider: 'google',
          providerUserId: 'google-uid-123',
        },
        userByEmail: {
          id: 'u-1',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'suspended',
        },
      });

      expect(result).toEqual({
        decision: 'RejectSuspended',
        reason: 'account_suspended',
      });
    });

    it('returns LinkAndLogin when user with verified email exists but not yet linked', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: baseProviderIdentity,
        existingIdentity: null,
        userByEmail: {
          id: 'u-2',
          email: 'user@example.com',
          isEmailVerified: true,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'LinkAndLogin',
        userId: 'u-2',
      });
    });

    it('returns TakeOverUnverifiedAndLink when user exists with unverified email (pre-hijack defense)', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: baseProviderIdentity,
        existingIdentity: null,
        userByEmail: {
          id: 'u-unverified',
          email: 'user@example.com',
          isEmailVerified: false,
          status: 'active',
        },
      });

      expect(result).toEqual({
        decision: 'TakeOverUnverifiedAndLink',
        userId: 'u-unverified',
      });
    });

    it('returns CreateUser when no matching identity or email exists', () => {
      const result = service.decide({
        mode: 'login',
        providerIdentity: baseProviderIdentity,
        existingIdentity: null,
        userByEmail: null,
      });

      expect(result).toEqual({
        decision: 'CreateUser',
        email: 'user@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/photo.jpg',
      });
    });
  });
});
