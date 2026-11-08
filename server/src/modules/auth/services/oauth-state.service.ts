// Service managing OAuth state, PKCE code challenges, and CSRF binding secrets in cache.
import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type { OAuthProviderKey } from '@slotly/contracts';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import type { CacheService } from '../../../common/cache/cache.interface';
import type {
  CreateOAuthStateParams,
  CreateOAuthStateResult,
} from '../types/oauth.types';

export type {
  CreateOAuthStateParams,
  CreateOAuthStateResult,
} from '../types/oauth.types';

/** State payload preserved across OAuth redirect cycles. */
export interface OAuthStatePayload {
  state: string;
  provider: OAuthProviderKey;
  mode: 'login' | 'link';
  pkceVerifier?: string | undefined;
  nonce?: string | undefined;
  next: string;
  userId?: string | undefined;
  binding: string;
  createdAt: number;
}

/** Service managing transient OAuth state and CSRF validation. */
@Injectable()
export class OAuthStateService {
  private readonly stateTtlSeconds = 600; // 10 minutes

  constructor(@Inject(CACHE_SERVICE) private readonly cache: CacheService) {}

  private getStateKey(state: string): string {
    return `slotly:oauth:state:${state}`;
  }

  /** Generates and persists a single-use OAuth state record with PKCE and binding token. */
  async createState(
    params: CreateOAuthStateParams,
  ): Promise<CreateOAuthStateResult> {
    const state = randomBytes(24).toString('base64url');
    const binding = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const nonce = randomBytes(16).toString('base64url');

    const payload: OAuthStatePayload = {
      state,
      provider: params.provider,
      mode: params.mode,
      pkceVerifier: codeVerifier,
      nonce,
      next: params.next,
      userId: params.userId,
      binding,
      createdAt: Date.now(),
    };

    await this.cache.set(
      this.getStateKey(state),
      payload,
      this.stateTtlSeconds,
    );

    return {
      state,
      binding,
      codeChallenge,
      codeVerifier,
      nonce,
    };
  }

  /**
   * Consumes an OAuth state record, verifying existence and binding cookie match.
   * Immediately deletes the record to enforce single-use semantics.
   */
  async consumeState(
    state: string,
    cookieBinding?: string,
  ): Promise<OAuthStatePayload | null> {
    if (!state || !cookieBinding) {
      return null;
    }

    const key = this.getStateKey(state);
    const payload = await this.cache.get<OAuthStatePayload>(key);
    if (!payload) {
      return null;
    }

    // Atomic / immediate deletion on first access
    await this.cache.del(key);

    if (payload.binding !== cookieBinding) {
      return null;
    }

    return payload;
  }
}
