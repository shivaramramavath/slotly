// Types and configuration models for OAuth strategies and state management.
import type { OAuthProviderKey } from '@slotly/contracts';

/** Configuration options for Google OAuth strategy. */
export interface GoogleProviderConfig {
  clientId: string;
  clientSecret: string;
  authUrl?: string | undefined;
  tokenUrl?: string | undefined;
  userinfoUrl?: string | undefined;
  expectedIssuer?: string | undefined;
}

/** Configuration options for GitHub OAuth strategy. */
export interface GithubProviderConfig {
  clientId: string;
  clientSecret: string;
  authUrl?: string | undefined;
  tokenUrl?: string | undefined;
  userUrl?: string | undefined;
  emailsUrl?: string | undefined;
}

/** Parameters required to initiate a new OAuth state challenge. */
export interface CreateOAuthStateParams {
  provider: OAuthProviderKey;
  mode: 'login' | 'link';
  next: string;
  userId?: string | undefined;
}

/** Result returned after generating and persisting an OAuth state. */
export interface CreateOAuthStateResult {
  state: string;
  binding: string;
  codeChallenge: string;
  codeVerifier: string;
  nonce: string;
}
