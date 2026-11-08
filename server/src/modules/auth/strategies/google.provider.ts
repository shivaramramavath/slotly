// Google OAuth 2.0 and OpenID Connect authentication strategy.
import { Inject, Injectable } from '@nestjs/common';
import type { OAuthProviderKey } from '@slotly/contracts';
import { HTTP_CLIENT } from '../adapters/http-client.adapter';
import type { HttpClient } from '../adapters/http-client.adapter';
import type { GoogleProviderConfig } from '../types/oauth.types';
import type {
  AuthorizationUrlParams,
  ExchangeCodeParams,
  OAuthProvider,
  ProviderIdentity,
} from './oauth-provider.interface';

export type { GoogleProviderConfig } from '../types/oauth.types';

/** Dependency injection token for Google provider configuration. */
export const GOOGLE_PROVIDER_CONFIG = Symbol('GOOGLE_PROVIDER_CONFIG');

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string | undefined;
  token_type: string;
  expires_in?: number | undefined;
}

interface GoogleIdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean | string;
  name?: string | undefined;
  picture?: string | undefined;
  exp: number;
  nonce?: string | undefined;
}

interface GoogleUserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean | string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

/** Implementation of Google OAuth 2.0 provider strategy. */
@Injectable()
export class GoogleProvider implements OAuthProvider {
  readonly key: OAuthProviderKey = 'google';
  readonly name = 'Google';

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly userinfoUrl: string;
  private readonly expectedIssuer?: string | undefined;

  constructor(
    @Inject(GOOGLE_PROVIDER_CONFIG) config: GoogleProviderConfig,
    @Inject(HTTP_CLIENT) private readonly httpClient: HttpClient,
  ) {
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.authUrl =
      config.authUrl || 'https://accounts.google.com/o/oauth2/v2/auth';
    this.tokenUrl = config.tokenUrl || 'https://oauth2.googleapis.com/token';
    this.userinfoUrl =
      config.userinfoUrl || 'https://openidconnect.googleapis.com/v1/userinfo';
    this.expectedIssuer = config.expectedIssuer;
  }

  /** Checks whether Google OAuth is configured and enabled. */
  isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** Constructs Google authorization URL with PKCE and state parameters. */
  getAuthorizationUrl(params: AuthorizationUrlParams): string {
    const url = new URL(this.authUrl);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', params.state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');

    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    if (params.nonce) {
      url.searchParams.set('nonce', params.nonce);
    }

    return url.toString();
  }

  /** Exchanges code for tokens and extracts verified user identity. */
  async exchangeCode(params: ExchangeCodeParams): Promise<ProviderIdentity> {
    const body: Record<string, string> = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: params.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri,
    };

    if (params.codeVerifier) {
      body.code_verifier = params.codeVerifier;
    }

    const tokenResponse = await this.httpClient.post<GoogleTokenResponse>(
      this.tokenUrl,
      body,
      { 'Content-Type': 'application/x-www-form-urlencoded' },
    );

    if (!tokenResponse?.access_token && !tokenResponse?.id_token) {
      throw new Error('Google token exchange returned invalid payload');
    }

    if (tokenResponse.id_token) {
      const claims = this.verifyIdTokenClaims(
        tokenResponse.id_token,
        params.nonce,
      );
      return {
        provider: this.key,
        providerUserId: claims.sub,
        email: claims.email.toLowerCase().trim(),
        emailVerified:
          claims.email_verified === true || claims.email_verified === 'true',
        name: claims.name,
        avatarUrl: claims.picture,
      };
    }

    const userInfo = await this.httpClient.get<GoogleUserInfoResponse>(
      this.userinfoUrl,
      { Authorization: `Bearer ${tokenResponse.access_token}` },
    );

    return {
      provider: this.key,
      providerUserId: userInfo.sub,
      email: userInfo.email.toLowerCase().trim(),
      emailVerified:
        userInfo.email_verified === true || userInfo.email_verified === 'true',
      name: userInfo.name,
      avatarUrl: userInfo.picture,
    };
  }

  private verifyIdTokenClaims(
    idToken: string,
    expectedNonce?: string,
  ): GoogleIdTokenClaims {
    const parts = idToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      throw new Error('Invalid ID token format');
    }

    let payload: GoogleIdTokenClaims;
    try {
      payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      ) as GoogleIdTokenClaims;
    } catch {
      throw new Error('Failed to parse ID token claims');
    }

    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (this.expectedIssuer) {
      validIssuers.push(this.expectedIssuer);
    }

    if (!validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid ID token issuer: ${payload.iss}`);
    }

    if (payload.aud !== this.clientId) {
      throw new Error(
        `ID token audience mismatch: expected ${this.clientId}, got ${payload.aud}`,
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const clockSkewSeconds = 60;
    if (payload.exp && payload.exp + clockSkewSeconds < nowSeconds) {
      throw new Error('ID token has expired');
    }

    if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
      throw new Error('ID token nonce mismatch');
    }

    if (!payload.email) {
      throw new Error('ID token does not contain an email address');
    }

    return payload;
  }
}
