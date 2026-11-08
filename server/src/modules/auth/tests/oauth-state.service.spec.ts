// Unit tests for OAuthStateService verifying state generation, TTL storage, single-use deletion, and binding check.
import { CacheService } from '../../../common/cache/cache.interface';
import { OAuthStateService } from '../services/oauth-state.service';

describe('OAuthStateService', () => {
  let service: OAuthStateService;
  let cacheStore: Map<string, unknown>;
  let cacheMock: CacheService;

  beforeEach(() => {
    cacheStore = new Map<string, unknown>();
    cacheMock = {
      get: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(cacheStore.get(key) ?? null),
        ),
      set: jest.fn().mockImplementation((key: string, val: unknown) => {
        cacheStore.set(key, val);
        return Promise.resolve();
      }),
      del: jest.fn().mockImplementation((key: string) => {
        cacheStore.delete(key);
        return Promise.resolve();
      }),
      remember: jest.fn(),
      invalidateTag: jest.fn(),
    };

    service = new OAuthStateService(cacheMock);
  });

  it('generates state, PKCE challenge, and stores payload with 10 min TTL', async () => {
    const result = await service.createState({
      provider: 'google',
      mode: 'login',
      next: '/projects',
    });

    expect(result.state).toBeDefined();
    expect(result.binding).toBeDefined();
    expect(result.codeChallenge).toBeDefined();
    expect(result.codeVerifier).toBeDefined();
    expect(result.nonce).toBeDefined();

    expect(cacheMock.set).toHaveBeenCalledWith(
      `slotly:oauth:state:${result.state}`,
      expect.objectContaining({
        state: result.state,
        provider: 'google',
        mode: 'login',
        next: '/projects',
        binding: result.binding,
      }),
      600,
    );
  });

  it('consumes state successfully when binding matches and deletes on read (single-use)', async () => {
    const created = await service.createState({
      provider: 'github',
      mode: 'link',
      next: '/users/me/security',
      userId: 'user-42',
    });

    const consumed = await service.consumeState(created.state, created.binding);
    expect(consumed).not.toBeNull();
    expect(consumed?.provider).toBe('github');
    expect(consumed?.mode).toBe('link');
    expect(consumed?.userId).toBe('user-42');

    // Second read must return null because it was deleted on first read
    const secondRead = await service.consumeState(
      created.state,
      created.binding,
    );
    expect(secondRead).toBeNull();
  });

  it('rejects state consumption if cookie binding does not match', async () => {
    const created = await service.createState({
      provider: 'google',
      mode: 'login',
      next: '/dashboard',
    });

    const consumed = await service.consumeState(
      created.state,
      'forged-binding-token',
    );
    expect(consumed).toBeNull();
  });

  it('returns null when state is not found or empty', async () => {
    const consumed = await service.consumeState(
      'non-existent-state',
      'binding',
    );
    expect(consumed).toBeNull();
  });
});
