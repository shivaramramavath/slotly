// Configuration factory for OAuth social login providers (Google, GitHub).
import { registerAs, ConfigType } from '@nestjs/config';
import { DEFAULT_CONFIG } from './defaults';

/** OAuth namespace configuration factory. Providers are enabled only when both clientId and clientSecret are set. */
export const oauthConfig = registerAs('oauth', () => {
  const googleId = process.env['GOOGLE_CLIENT_ID'] || '';
  const googleSecret = process.env['GOOGLE_CLIENT_SECRET'] || '';
  const githubId = process.env['GITHUB_CLIENT_ID'] || '';
  const githubSecret = process.env['GITHUB_CLIENT_SECRET'] || '';

  return {
    callbackBaseUrl:
      process.env['OAUTH_CALLBACK_BASE_URL'] ||
      DEFAULT_CONFIG.oauth.callbackBaseUrl,
    google: {
      clientId: googleId,
      clientSecret: googleSecret,
      enabled: Boolean(googleId && googleSecret),
    },
    github: {
      clientId: githubId,
      clientSecret: githubSecret,
      enabled: Boolean(githubId && githubSecret),
    },
  };
});

/** Inferred TypeScript type for oauth namespace configuration. */
export type OAuthConfig = ConfigType<typeof oauthConfig>;
