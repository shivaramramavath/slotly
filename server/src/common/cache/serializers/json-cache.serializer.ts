// JSON serializer implementation reviving Date objects and rejecting invalid types.
import { Injectable } from '@nestjs/common';
import type { ICacheSerializer } from '../interfaces/cache-serializer.interface';

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Custom exception thrown when cache data cannot be deserialized cleanly. */
export class DeserializationException extends Error {
  constructor(
    message: string,
    public readonly rawData?: string,
  ) {
    super(message);
    this.name = 'DeserializationException';
  }
}

/** JSON serializer reviving ISO timestamp strings to Date instances. */
@Injectable()
export class JsonCacheSerializer implements ICacheSerializer {
  /** Serializes a typed object into a JSON string, rejecting circular or invalid types. */
  serialize<T>(value: T): string {
    if (value === undefined) {
      throw new TypeError('Cannot serialize undefined value for cache storage');
    }
    try {
      return JSON.stringify(value, (_key, val: unknown) => {
        if (typeof val === 'bigint') {
          throw new TypeError('BigInt values cannot be serialized to JSON');
        }
        if (typeof val === 'function') {
          throw new TypeError('Functions cannot be serialized to JSON');
        }
        return val;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new TypeError(`Cache serialization failed: ${msg}`);
    }
  }

  /** Deserializes a stored JSON string, restoring Date instances for declared or detected date fields. */
  deserialize<T>(data: string, dateFields?: (keyof T)[]): T {
    if (data === null || data === undefined || data === '') {
      throw new DeserializationException(
        'Cannot deserialize empty cache payload',
      );
    }

    try {
      const declaredSet = dateFields
        ? new Set<string>(dateFields.map((f) => String(f)))
        : null;

      return JSON.parse(data, (key, value: unknown) => {
        if (typeof value === 'string') {
          if (declaredSet && declaredSet.has(key)) {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? value : parsed;
          }
          if (ISO_DATE_REGEX.test(value)) {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? value : parsed;
          }
        }
        return value;
      }) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new DeserializationException(`JSON parse error: ${msg}`, data);
    }
  }
}
