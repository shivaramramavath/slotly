// OAuth provider abstraction and identity contract for third-party authentication strategies.
import type { OAuthProviderKey } from '@slotly/contracts';

/** Standardized identity returned by an OAuth provider after code exchange. */
export interface ProviderIdentity {
  provider: OAuthProviderKey;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name?: string | undefined;
  avatarUrl?: string | undefined;
}

/** Parameters required to generate an authorization URL. */
export interface AuthorizationUrlParams {
  redirectUri: string;
  state: string;
  codeChallenge?: string | undefined;
  nonce?: string | undefined;
}

/** Parameters required to exchange an authorization code for an identity. */
export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  codeVerifier?: string | undefined;
  nonce?: string | undefined;
}

/** Contract implemented by third-party OAuth provider strategies. */
export interface OAuthProvider {
  readonly key: OAuthProviderKey;
  readonly name: string;
  isEnabled(): boolean;
  getAuthorizationUrl(params: AuthorizationUrlParams): string;
  exchangeCode(params: ExchangeCodeParams): Promise<ProviderIdentity>;
}
