// Interface defining serialization strategy for cached values and reviving dates.

/** Interface defining serialization strategy for cached values and reviving dates. */
export interface ICacheSerializer {
  /** Serializes a typed value to a string representation, rejecting invalid values. */
  serialize<T>(value: T): string;

  /** Deserializes a cached string back into a typed object with optional date revivers. */
  deserialize<T>(data: string, dateFields?: (keyof T)[]): T;
}
