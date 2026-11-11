// In-memory Redis test double supporting key-value, expiry, increment, and atomic Lua script execution.
import type Redis from 'ioredis';

/** In-memory Redis mock implementing core Redis operations and Lua script emulation for unit tests. */
export class MockRedis {
  public store = new Map<
    string,
    { value: string; expiresAt?: number | undefined }
  >();
  public shouldFail = false;

  private isExpired(entry?: {
    value: string;
    expiresAt?: number | undefined;
  }): boolean {
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.shouldFail) throw new Error('Redis connection error');
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(
    key: string,
    value: string,
    ...args: (string | number)[]
  ): Promise<'OK'> {
    if (this.shouldFail) throw new Error('Redis connection error');
    let ttlSeconds: number | undefined;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'EX' && typeof args[i + 1] === 'number') {
        ttlSeconds = args[i + 1] as number;
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    if (this.shouldFail) throw new Error('Redis connection error');
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async exists(...keys: string[]): Promise<number> {
    if (this.shouldFail) throw new Error('Redis connection error');
    let count = 0;
    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry && !this.isExpired(entry)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    if (this.shouldFail) throw new Error('Redis connection error');
    const current = await this.get(key);
    const num = current ? parseInt(current, 10) + 1 : 1;
    this.store.set(key, { value: String(num) });
    return num;
  }

  async eval(
    script: string,
    _numkeys: number,
    ...args: (string | number)[]
  ): Promise<unknown> {
    if (this.shouldFail) throw new Error('Redis connection error');
    const key = String(args[0]);

    // 1. ADD_TO_LIST_LUA
    if (script.includes('table.insert')) {
      const itemJson = String(args[1]);
      const ttl = Number(args[2]);
      const entry = this.store.get(key);
      let list: unknown[] = [];
      if (entry && !this.isExpired(entry)) {
        try {
          const parsed = JSON.parse(entry.value);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          // ignore
        }
      }
      list.push(JSON.parse(itemJson));
      const serialized = JSON.stringify(list);
      const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
      this.store.set(key, { value: serialized, expiresAt });
      return serialized;
    }

    // 2. UPDATE_FIELDS_LUA
    if (script.includes('updates = cjson.decode')) {
      const entry = this.store.get(key);
      if (!entry || this.isExpired(entry)) return 0;
      const obj = JSON.parse(entry.value);
      const updates = JSON.parse(String(args[1]));
      Object.assign(obj, updates);
      this.store.set(key, {
        value: JSON.stringify(obj),
        expiresAt: entry.expiresAt,
      });
      return 1;
    }

    // 3. SET_FIELD_LUA
    if (script.includes('obj[ARGV[1]]')) {
      const entry = this.store.get(key);
      if (!entry || this.isExpired(entry)) return 0;
      const obj = JSON.parse(entry.value);
      const field = String(args[1]);
      const value = JSON.parse(String(args[2]));
      obj[field] = value;
      this.store.set(key, {
        value: JSON.stringify(obj),
        expiresAt: entry.expiresAt,
      });
      return 1;
    }

    return null;
  }
}

/** Factory returning a MockRedis typed as a Redis client. */
export function createMockRedis(): Redis {
  return new MockRedis() as unknown as Redis;
}
