// Registry holding configured OAuth provider strategies following Open/Closed principle.
import { Injectable, NotFoundException } from '@nestjs/common';
import { OAuthProviderInfo, OAuthProviderKey } from '@slotly/contracts';
import { GithubProvider } from './github.provider';
import { GoogleProvider } from './google.provider';
import { OAuthProvider } from './oauth-provider.interface';

/** Registry maintaining supported OAuth provider implementations. */
@Injectable()
export class OAuthProviderRegistry {
  private readonly providers = new Map<OAuthProviderKey, OAuthProvider>();

  constructor(
    private readonly googleProvider: GoogleProvider,
    private readonly githubProvider: GithubProvider,
  ) {
    this.register(this.googleProvider);
    this.register(this.githubProvider);
  }

  /** Registers an OAuth provider strategy in the registry. */
  register(provider: OAuthProvider): void {
    this.providers.set(provider.key, provider);
  }

  /** Retrieves a provider by key or throws NotFoundException if unsupported. */
  getProvider(key: OAuthProviderKey): OAuthProvider {
    const provider = this.providers.get(key);
    if (!provider) {
      throw new NotFoundException(`Unsupported OAuth provider: ${key}`);
    }
    return provider;
  }

  /** Lists metadata and enabled status for all registered OAuth providers. */
  listProviders(): OAuthProviderInfo[] {
    const results: OAuthProviderInfo[] = [];
    for (const provider of this.providers.values()) {
      results.push({
        key: provider.key,
        name: provider.name,
        enabled: provider.isEnabled(),
      });
    }
    return results;
  }
}
