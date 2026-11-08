// GitHub OAuth 2.0 authentication strategy.
import { Inject, Injectable } from '@nestjs/common';
import type { OAuthProviderKey } from '@slotly/contracts';
import { HTTP_CLIENT } from '../adapters/http-client.adapter';
import type { HttpClient } from '../adapters/http-client.adapter';
import type { GithubProviderConfig } from '../types/oauth.types';
import type {
  AuthorizationUrlParams,
  ExchangeCodeParams,
  OAuthProvider,
  ProviderIdentity,
} from './oauth-provider.interface';

export type { GithubProviderConfig } from '../types/oauth.types';

/** Dependency injection token for GitHub provider configuration. */
export const GITHUB_PROVIDER_CONFIG = Symbol('GITHUB_PROVIDER_CONFIG');

interface GitHubTokenResponse {
  access_token?: string | undefined;
  token_type?: string | undefined;
  scope?: string | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name?: string | undefined;
  avatar_url?: string | undefined;
  email?: string | null | undefined;
}

interface GitHubEmailEntry {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string | null | undefined;
}

/** Implementation of GitHub OAuth 2.0 provider strategy. */
@Injectable()
export class GithubProvider implements OAuthProvider {
  readonly key: OAuthProviderKey = 'github';
  readonly name = 'GitHub';

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly tokenUrl: string;
  private readonly userUrl: string;
  private readonly emailsUrl: string;

  constructor(
    @Inject(GITHUB_PROVIDER_CONFIG) config: GithubProviderConfig,
    @Inject(HTTP_CLIENT) private readonly httpClient: HttpClient,
  ) {
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.authUrl = config.authUrl || 'https://github.com/login/oauth/authorize';
    this.tokenUrl =
      config.tokenUrl || 'https://github.com/login/oauth/access_token';
    this.userUrl = config.userUrl || 'https://api.github.com/user';
    this.emailsUrl = config.emailsUrl || 'https://api.github.com/user/emails';
  }

  /** Checks whether GitHub OAuth is configured and enabled. */
  isEnabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** Constructs GitHub authorization URL with required scopes and state. */
  getAuthorizationUrl(params: AuthorizationUrlParams): string {
    const url = new URL(this.authUrl);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', params.state);

    return url.toString();
  }

  /** Exchanges code for tokens and extracts verified primary user identity. */
  async exchangeCode(params: ExchangeCodeParams): Promise<ProviderIdentity> {
    const tokenResponse = await this.httpClient.post<GitHubTokenResponse>(
      this.tokenUrl,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: params.code,
        redirect_uri: params.redirectUri,
      },
      {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    );

    if (!tokenResponse?.access_token || tokenResponse.error) {
      throw new Error(
        tokenResponse?.error_description ||
          tokenResponse?.error ||
          'GitHub token exchange failed',
      );
    }

    const authHeader = {
      Authorization: `Bearer ${tokenResponse.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Slotly-OAuth',
    };

    const userProfile = await this.httpClient.get<GitHubUserResponse>(
      this.userUrl,
      authHeader,
    );

    let emails: GitHubEmailEntry[] = [];
    try {
      emails = await this.httpClient.get<GitHubEmailEntry[]>(
        this.emailsUrl,
        authHeader,
      );
    } catch {
      // Continue with userProfile fallback if emails endpoint is unreachable
    }

    const primaryVerified = emails.find((e) => e.primary && e.verified);
    const anyVerified = emails.find((e) => e.verified);
    const resolvedEmail =
      primaryVerified?.email || anyVerified?.email || userProfile.email || '';
    const isEmailVerified = Boolean(
      primaryVerified?.verified || anyVerified?.verified,
    );

    if (!resolvedEmail) {
      throw new Error(
        'GitHub account does not have an associated email address',
      );
    }

    return {
      provider: this.key,
      providerUserId: String(userProfile.id),
      email: resolvedEmail.toLowerCase().trim(),
      emailVerified: isEmailVerified,
      name: userProfile.name || userProfile.login,
      avatarUrl: userProfile.avatar_url || undefined,
    };
  }
}
