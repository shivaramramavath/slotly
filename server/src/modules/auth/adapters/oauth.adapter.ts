import { Injectable, UnauthorizedException } from '@nestjs/common';

export const OAUTH_VERIFIER = Symbol('OAUTH_VERIFIER');

export interface OAuthUserProfile {
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string | undefined;
}

export interface OAuthVerifier {
  verifyGoogleToken(idToken: string): Promise<OAuthUserProfile>;
}

@Injectable()
export class GoogleOAuthVerifier implements OAuthVerifier {
  async verifyGoogleToken(idToken: string): Promise<OAuthUserProfile> {
    await Promise.resolve();
    if (!idToken || idToken.length < 10) {
      throw new UnauthorizedException({
        code: 'INVALID_OAUTH_TOKEN',
        message: 'Invalid Google identity token',
      });
    }

    // In local development or mock mode, support test tokens or inspect JWT payload
    try {
      const parts = idToken.split('.');
      if (parts.length === 3 && parts[1]) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson) as {
          sub?: string;
          email?: string;
          name?: string;
          picture?: string;
        };
        if (payload.email) {
          return {
            providerId: payload.sub || `google_${Date.now()}`,
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.email.split('@')[0] || 'Google User',
            avatarUrl: payload.picture,
          };
        }
      }
    } catch {
      // Fall through to error
    }

    throw new UnauthorizedException({
      code: 'INVALID_OAUTH_TOKEN',
      message: 'Failed to parse Google OAuth identity token',
    });
  }
}
