// Factory creating standardized cache key prefixes, tenant-scoped keys, and namespace counters.
import { Injectable, Optional, Inject } from '@nestjs/common';
import type { ICacheKeyFactory } from '../interfaces/cache-key-factory.interface';
import { cacheConfig } from '../../../config';
import type { CacheConfig } from '../../../config';

/** Factory generating scoped keys and versioned namespace keys. */
@Injectable()
export class CacheKeyFactory implements ICacheKeyFactory {
  private readonly env: string;
  private readonly defaultSchemaVersion: number;

  constructor(
    @Optional()
    @Inject(cacheConfig.KEY)
    private readonly config?: CacheConfig,
  ) {
    this.env = this.config?.keyPrefixEnv || 'development';
    this.defaultSchemaVersion = this.config?.schemaVersion || 1;
  }

  /** Builds the standardized cache prefix incorporating environment and schema version. */
  buildPrefix(entity: string, schemaVersion?: number): string {
    const version = schemaVersion ?? this.defaultSchemaVersion;
    return `slotly:${this.env}:${entity}:v${version}`;
  }

  /** Constructs a full cache key combining prefix, optional tenant scope, and id. */
  buildKey(prefix: string, id: string, scope?: string): string {
    const sanitizedId = id.trim();
    if (scope && scope.trim() !== '') {
      return `${prefix}:${scope.trim()}:${sanitizedId}`;
    }
    return `${prefix}:${sanitizedId}`;
  }

  /** Generates the namespace version counter key for group invalidation. */
  buildNamespaceKey(prefix: string, scope: string): string {
    return `${prefix}:ns:${scope.trim()}:ver`;
  }
}
