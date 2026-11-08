// Pure state-machine deciding account linking, login, signup, and pre-hijack takeover actions.
import { Injectable } from '@nestjs/common';
import type { OAuthErrorCode, OAuthProviderKey } from '@slotly/contracts';
import type { ProviderIdentity } from '../strategies/oauth-provider.interface';

/** User context passed into account linking evaluation. */
export interface LinkingUserCandidate {
  id: string;
  email: string;
  isEmailVerified: boolean;
  status: 'active' | 'suspended' | 'deactivated' | 'pending_onboarding';
}

/** Existing OAuth link record found in database. */
export interface ExistingOAuthIdentity {
  id: string;
  userId: string;
  provider: OAuthProviderKey;
  providerUserId: string;
}

/** Input parameters evaluated by the account linking engine. */
export interface AccountLinkingInput {
  mode: 'login' | 'link';
  providerIdentity: ProviderIdentity;
  currentUser?: LinkingUserCandidate | null | undefined;
  existingIdentity?: ExistingOAuthIdentity | null | undefined;
  userByEmail?: LinkingUserCandidate | null | undefined;
}

/** Distinct decisions emitted by the account linking engine. */
export type AccountLinkingDecision =
  | { decision: 'LoginExisting'; userId: string }
  | { decision: 'LinkAndLogin'; userId: string }
  | { decision: 'TakeOverUnverifiedAndLink'; userId: string }
  | {
      decision: 'CreateUser';
      email: string;
      name?: string | undefined;
      avatarUrl?: string | undefined;
    }
  | { decision: 'LinkToCurrentUser'; userId: string }
  | { decision: 'AlreadyLinked'; userId: string }
  | {
      decision: 'RejectConflict';
      reason: Extract<
        OAuthErrorCode,
        'link_conflict' | 'oauth_account_conflict'
      >;
    }
  | { decision: 'RejectUnverifiedEmail'; reason: 'oauth_email_unverified' }
  | { decision: 'RejectSuspended'; reason: 'account_suspended' }
  | { decision: 'RejectUnauthorized'; reason: 'oauth_denied' };

/** Pure domain service evaluating OAuth account resolution logic. */
@Injectable()
export class AccountLinkingService {
  /** Evaluates linking scenario and returns unambiguous resolution decision. */
  decide(input: AccountLinkingInput): AccountLinkingDecision {
    const {
      mode,
      providerIdentity,
      currentUser,
      existingIdentity,
      userByEmail,
    } = input;

    // 1. Provider email must be verified
    if (!providerIdentity.emailVerified) {
      return {
        decision: 'RejectUnverifiedEmail',
        reason: 'oauth_email_unverified',
      };
    }

    // 2. Link mode (attaching OAuth identity to an existing authenticated user)
    if (mode === 'link') {
      if (!currentUser) {
        return {
          decision: 'RejectUnauthorized',
          reason: 'oauth_denied',
        };
      }

      if (
        currentUser.status === 'suspended' ||
        currentUser.status === 'deactivated'
      ) {
        return {
          decision: 'RejectSuspended',
          reason: 'account_suspended',
        };
      }

      if (existingIdentity) {
        if (existingIdentity.userId === currentUser.id) {
          return {
            decision: 'AlreadyLinked',
            userId: currentUser.id,
          };
        }
        return {
          decision: 'RejectConflict',
          reason: 'link_conflict',
        };
      }

      // Check if another account owns the verified email of this provider
      if (userByEmail && userByEmail.id !== currentUser.id) {
        return {
          decision: 'RejectConflict',
          reason: 'link_conflict',
        };
      }

      return {
        decision: 'LinkToCurrentUser',
        userId: currentUser.id,
      };
    }

    // 3. Login mode (authenticating or signing up)
    if (existingIdentity) {
      if (
        userByEmail &&
        userByEmail.id === existingIdentity.userId &&
        (userByEmail.status === 'suspended' ||
          userByEmail.status === 'deactivated')
      ) {
        return {
          decision: 'RejectSuspended',
          reason: 'account_suspended',
        };
      }

      return {
        decision: 'LoginExisting',
        userId: existingIdentity.userId,
      };
    }

    // No existing identity linked with this (provider, providerUserId)
    if (userByEmail) {
      if (
        userByEmail.status === 'suspended' ||
        userByEmail.status === 'deactivated'
      ) {
        return {
          decision: 'RejectSuspended',
          reason: 'account_suspended',
        };
      }

      if (userByEmail.isEmailVerified) {
        return {
          decision: 'LinkAndLogin',
          userId: userByEmail.id,
        };
      }

      // Pre-hijack prevention: unverified local account overtaken by trusted OAuth identity
      return {
        decision: 'TakeOverUnverifiedAndLink',
        userId: userByEmail.id,
      };
    }

    // Brand new user registration
    return {
      decision: 'CreateUser',
      email: providerIdentity.email,
      name: providerIdentity.name,
      avatarUrl: providerIdentity.avatarUrl,
    };
  }
}
