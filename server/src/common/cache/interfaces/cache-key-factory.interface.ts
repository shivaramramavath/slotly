// Interface defining standard key generation and namespace versioning strategy.

/** Interface defining standard key generation and namespace versioning strategy. */
export interface ICacheKeyFactory {
  /** Builds the standardized cache prefix incorporating environment and schema version. */
  buildPrefix(entity: string, schemaVersion?: number): string;

  /** Constructs a full cache key combining prefix, optional tenant scope, and id. */
  buildKey(prefix: string, id: string, scope?: string): string;

  /** Generates the namespace version counter key for group invalidation. */
  buildNamespaceKey(prefix: string, scope: string): string;
}
