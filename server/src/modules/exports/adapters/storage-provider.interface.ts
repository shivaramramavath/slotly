// Adapter interface for pluggable export storage providers.

/** Adapter interface defining storage contracts for export file artifacts. */
export interface IStorageProvider {
  /** Saves a buffer to storage and returns the stored path or reference key. */
  save(key: string, buffer: Buffer, mimeType: string): Promise<string>;

  /** Retrieves a stored file buffer and its MIME type. */
  get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;

  /** Deletes an artifact from storage. */
  delete(key: string): Promise<boolean>;
}

/** Injection token for IStorageProvider. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
