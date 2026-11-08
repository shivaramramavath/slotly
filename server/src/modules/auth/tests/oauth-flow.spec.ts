// End-to-end integration test validating Google and GitHub OAuth flows against a local mock HTTP provider.
import * as http from 'http';
import { AddressInfo } from 'net';
import { Types } from 'mongoose';
import { FetchHttpClient } from '../adapters/http-client.adapter';
import { GoogleProvider } from '../strategies/google.provider';
import { GithubProvider } from '../strategies/github.provider';
import { OAuthProviderRegistry } from '../strategies/oauth-provider.registry';
import { OAuthStateService } from '../services/oauth-state.service';
import { AccountLinkingService } from '../services/account-linking.service';
import { AuthSessionService } from '../services/auth-session.service';
import { OAuthService } from '../services/oauth.service';
import { InMemoryCacheService } from '../../../common/cache/in-memory-cache.service';
import type { OAuthIdentity } from '../schemas/oauth-identity.schema';
import type { User } from '../../users/schemas/user.schema';
import type { Institution } from '../../institutions/schemas/institution.schema';
import type { UserRepository } from '../../users/repositories/user.repository';
import type { OAuthIdentityRepository } from '../repositories/oauth-identity.repository';
import type { InstitutionRepository } from '../../institutions/repositories/institution.repository';
import type { SessionsService } from '../services/sessions.service';
import type { EmailAdapter } from '../adapters/email.adapter';
import type { AuditService } from '../../../common/audit/audit.service';

describe('OAuth Integration Flow with Local Mock Provider', () => {
  let mockServer: http.Server;
  let serverBaseUrl: string;

  // In-memory state and mock dependencies
  let cache: InMemoryCacheService;
  let stateService: OAuthStateService;
  let linkingService: AccountLinkingService;
  let authSessionService: AuthSessionService;
  let oauthService: OAuthService;
  let providerRegistry: OAuthProviderRegistry;

  // In-memory repositories
  const usersStore = new Map<string, User>();
  const identityStore = new Map<string, OAuthIdentity>();
  const institutionsStore = new Map<
    string,
    { id: string; code: string; name: string }
  >();
  const auditLogs: unknown[] = [];
  const sentEmails: unknown[] = [];

  const mockUserRepo: jest.Mocked<UserRepository> = {
    findById: jest.fn((id: string) =>
      Promise.resolve(usersStore.get(id) ?? null),
    ),
    findByEmail: jest.fn((email: string) => {
      const lower = email.toLowerCase().trim();
      for (const u of usersStore.values()) {
        if (u.email.toLowerCase() === lower) return Promise.resolve(u);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn((data: Partial<User>) => {
      const id = data.id || new Types.ObjectId().toString();
      const user = { ...data, id, _id: id } as User;
      usersStore.set(id, user);
      return Promise.resolve(user);
    }),
    update: jest.fn((id: string, update: Partial<User>) => {
      const existing = usersStore.get(id);
      if (!existing) return Promise.resolve(null);
      const updated = { ...existing, ...update };
      usersStore.set(id, updated);
      return Promise.resolve(updated);
    }),
    countByInstitution: jest.fn(() => Promise.resolve(usersStore.size)),
  } as unknown as jest.Mocked<UserRepository>;

  const mockIdentityRepo: jest.Mocked<OAuthIdentityRepository> = {
    create: jest.fn((data: Partial<OAuthIdentity>) => {
      const id = new Types.ObjectId().toString();
      const record = {
        ...data,
        id,
        _id: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OAuthIdentity;
      identityStore.set(
        `${data.provider || ''}:${data.providerUserId || ''}`,
        record,
      );
      return Promise.resolve(record);
    }),
    findByProviderAndId: jest.fn((provider: string, providerUserId: string) => {
      return Promise.resolve(
        identityStore.get(`${provider}:${providerUserId}`) ?? null,
      );
    }),
    findByUserId: jest.fn((userId: string) => {
      const results: OAuthIdentity[] = [];
      for (const id of identityStore.values()) {
        if (id.userId.toString() === userId.toString()) results.push(id);
      }
      return Promise.resolve(results);
    }),
    deleteByUserAndProvider: jest.fn((userId: string, provider: string) => {
      for (const [key, id] of identityStore.entries()) {
        if (
          id.userId.toString() === userId.toString() &&
          id.provider === provider
        ) {
          identityStore.delete(key);
          return Promise.resolve(true);
        }
      }
      return Promise.resolve(false);
    }),
    countByUserId: jest.fn((userId: string) => {
      let count = 0;
      for (const id of identityStore.values()) {
        if (id.userId.toString() === userId.toString()) count++;
      }
      return Promise.resolve(count);
    }),
  } as unknown as jest.Mocked<OAuthIdentityRepository>;

  const mockInstitutionRepo: jest.Mocked<InstitutionRepository> = {
    create: jest.fn((data: Partial<Institution>) => {
      const id = new Types.ObjectId().toString();
      const inst = { ...data, id, _id: id } as unknown as Institution;
      institutionsStore.set(id, {
        id,
        code: data.code || '',
        name: data.name || '',
      });
      return Promise.resolve(inst);
    }),
    findOne: jest.fn((filter: { code?: string }) => {
      if (filter.code) {
        for (const inst of institutionsStore.values()) {
          if (inst.code === filter.code) {
            return Promise.resolve(inst as unknown as Institution);
          }
        }
      }
      return Promise.resolve(null);
    }),
  } as unknown as jest.Mocked<InstitutionRepository>;

  const mockSessionsService: jest.Mocked<SessionsService> = {
    createSession: jest.fn(
      (
        userId: string,
        role: string,
        meta: { ip?: string; userAgent?: string },
      ) =>
        Promise.resolve({
          session: {
            sessionId: `ses_${userId}_${Date.now()}`,
            userId,
            role,
            ip: meta?.ip || '',
            userAgent: meta?.userAgent || '',
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
          },
          accessToken: `mock_jwt_${userId}`,
          refreshToken: `s_ses_${userId}_refresh_random`,
        }),
    ),
    revokeAllUserSessions: jest.fn(() => Promise.resolve()),
    updateSessionInstitution: jest.fn(() => Promise.resolve()),
  } as unknown as jest.Mocked<SessionsService>;

  const mockEmailAdapter: jest.Mocked<EmailAdapter> = {
    sendOtp: jest.fn(
      (email: string, code: string, type: 'verify' | 'recovery') => {
        sentEmails.push({ email, code, type });
        return Promise.resolve();
      },
    ),
    sendSecurityAlert: jest.fn(
      (email: string, event: string, details: Record<string, unknown>) => {
        sentEmails.push({ email, event, details });
        return Promise.resolve();
      },
    ),
  };

  const mockAuditService: jest.Mocked<AuditService> = {
    log: jest.fn(
      (
        action: string,
        actorId: string,
        target?: { type: string; id: string },
        meta?: Record<string, unknown>,
        ip?: string,
      ) => {
        auditLogs.push({ action, actorId, target, meta, ip });
        return Promise.resolve();
      },
    ),
  } as unknown as jest.Mocked<AuditService>;

  beforeAll(async () => {
    // Start local HTTP server mocking Google & GitHub endpoints
    mockServer = http.createServer((req, res) => {
      const url = new URL(
        req.url || '/',
        `http://${req.headers.host || 'localhost'}`,
      );
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk;
      });

      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');

        // Mock Google token endpoint
        if (url.pathname === '/mock/google/token') {
          const params = new URLSearchParams(rawBody);
          const code = params.get('code');
          if (code === 'valid-google-code') {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const header = Buffer.from(
              JSON.stringify({ alg: 'RS256' }),
            ).toString('base64url');
            const payload = Buffer.from(
              JSON.stringify({
                iss: 'https://accounts.google.com',
                aud: 'google-client-mock',
                sub: 'google-sub-42',
                email: 'scholar@institution.edu',
                email_verified: true,
                name: 'Professor Scholar',
                exp,
              }),
            ).toString('base64url');
            const idToken = `${header}.${payload}.sig`;

            res.writeHead(200);
            return res.end(
              JSON.stringify({
                access_token: 'mock-google-access-token',
                id_token: idToken,
                token_type: 'Bearer',
              }),
            );
          }
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'invalid_grant' }));
        }

        // Mock GitHub token endpoint
        if (url.pathname === '/mock/github/token') {
          res.writeHead(200);
          return res.end(
            JSON.stringify({
              access_token: 'mock-github-access-token',
              token_type: 'bearer',
              scope: 'read:user user:email',
            }),
          );
        }

        // Mock GitHub user endpoint
        if (url.pathname === '/mock/github/user') {
          res.writeHead(200);
          return res.end(
            JSON.stringify({
              id: 998877,
              login: 'gitdev',
              name: 'Git Developer',
              avatar_url: 'https://github.com/avatar.png',
            }),
          );
        }

        // Mock GitHub user emails endpoint
        if (url.pathname === '/mock/github/user/emails') {
          res.writeHead(200);
          return res.end(
            JSON.stringify([
              {
                email: 'scholar@institution.edu',
                primary: true,
                verified: true,
              },
            ]),
          );
        }

        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'Not found' }));
      });
    });

    await new Promise<void>((resolve) => {
      mockServer.listen(0, '127.0.0.1', () => resolve());
    });

    const port = (mockServer.address() as AddressInfo).port;
    serverBaseUrl = `http://127.0.0.1:${port}`;

    // Wire real application services with in-memory stores and local mock URLs
    const httpClient = new FetchHttpClient();

    const googleProvider = new GoogleProvider(
      {
        clientId: 'google-client-mock',
        clientSecret: 'google-secret-mock',
        authUrl: `${serverBaseUrl}/mock/google/auth`,
        tokenUrl: `${serverBaseUrl}/mock/google/token`,
        userinfoUrl: `${serverBaseUrl}/mock/google/userinfo`,
      },
      httpClient,
    );

    const githubProvider = new GithubProvider(
      {
        clientId: 'github-client-mock',
        clientSecret: 'github-secret-mock',
        authUrl: `${serverBaseUrl}/mock/github/auth`,
        tokenUrl: `${serverBaseUrl}/mock/github/token`,
        userUrl: `${serverBaseUrl}/mock/github/user`,
        emailsUrl: `${serverBaseUrl}/mock/github/user/emails`,
      },
      httpClient,
    );

    providerRegistry = new OAuthProviderRegistry(
      googleProvider,
      githubProvider,
    );
    cache = new InMemoryCacheService();
    stateService = new OAuthStateService(cache);
    linkingService = new AccountLinkingService();
    authSessionService = new AuthSessionService(
      mockSessionsService,
      mockAuditService,
      mockEmailAdapter,
      mockUserRepo,
    );

    oauthService = new OAuthService(
      'http://localhost:4000',
      providerRegistry,
      stateService,
      linkingService,
      mockIdentityRepo,
      mockUserRepo,
      mockInstitutionRepo,
      authSessionService,
      mockSessionsService,
      mockEmailAdapter,
      mockAuditService,
    );
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  it('runs complete new user signup flow via Google OAuth and Onboarding', async () => {
    // 1. Client initiates Google OAuth
    const startResult = await oauthService.start({
      provider: 'google',
      mode: 'login',
      next: '/dashboard',
    });

    expect(startResult.authorizationUrl).toContain(
      `${serverBaseUrl}/mock/google/auth`,
    );
    expect(startResult.bindingCookie).toBeDefined();

    // Parse state from auth URL
    const authUrlParsed = new URL(startResult.authorizationUrl);
    const state = authUrlParsed.searchParams.get('state')!;

    // 2. Google redirects back with code and state
    const callbackResult = await oauthService.handleCallback({
      provider: 'google',
      code: 'valid-google-code',
      state,
      bindingCookie: startResult.bindingCookie,
      meta: { ip: '127.0.0.1', browser: 'Chrome', device: 'Linux' },
    });

    // Should create pending user and redirect to /onboarding
    expect(callbackResult.redirectUrl).toBe('/onboarding');
    expect(callbackResult.refreshToken).toBeDefined();

    const createdUser = await mockUserRepo.findByEmail(
      'scholar@institution.edu',
    );
    expect(createdUser).not.toBeNull();
    expect(createdUser?.status).toBe('pending_onboarding');
    expect(createdUser?.name).toBe('Professor Scholar');

    // Verify identity link exists
    const identity = await mockIdentityRepo.findByProviderAndId(
      'google',
      'google-sub-42',
    );
    expect(identity).not.toBeNull();
    expect(identity?.email).toBe('scholar@institution.edu');

    // 3. User completes onboarding
    const userId = createdUser?.id ?? '';
    const onboardingResult = await oauthService.completeOnboarding(
      userId,
      { institutionName: 'Cambridge University', institutionCode: 'CAMB' },
      'mock_session_id',
    );

    expect(onboardingResult.user.status).toBe('active');
    expect(onboardingResult.user.role).toBe('ADMIN');
  });

  it('authenticates existing linked Google user directly to target destination', async () => {
    // Initiate second login for the already onboarded user
    const startResult = await oauthService.start({
      provider: 'google',
      mode: 'login',
      next: '/projects/active',
    });

    const state = new URL(startResult.authorizationUrl).searchParams.get(
      'state',
    )!;

    const callbackResult = await oauthService.handleCallback({
      provider: 'google',
      code: 'valid-google-code',
      state,
      bindingCookie: startResult.bindingCookie,
      meta: { ip: '127.0.0.1', browser: 'Chrome', device: 'Linux' },
    });

    expect(callbackResult.redirectUrl).toBe('/projects/active');
    expect(callbackResult.refreshToken).toBeDefined();
  });

  it('links a secondary GitHub provider to existing user in link mode', async () => {
    const existingUser = await mockUserRepo.findByEmail(
      'scholar@institution.edu',
    );
    const userId = existingUser?.id ?? '';

    const startResult = await oauthService.start({
      provider: 'github',
      mode: 'link',
      userId,
    });

    const state = new URL(startResult.authorizationUrl).searchParams.get(
      'state',
    )!;

    const callbackResult = await oauthService.handleCallback({
      provider: 'github',
      code: 'valid-gh-code',
      state,
      bindingCookie: startResult.bindingCookie,
      meta: { ip: '127.0.0.1', browser: 'Chrome', device: 'Linux' },
    });

    expect(callbackResult.redirectUrl).toBe(
      '/users/me/security?tab=connected&success=linked',
    );

    // User now has 2 connected providers (Google + GitHub)
    const connections = await oauthService.getConnections(userId);
    expect(connections).toHaveLength(2);
    expect(connections.map((c) => c.provider)).toEqual(
      expect.arrayContaining(['google', 'github']),
    );
  });

  it('prevents unlinking when account has no password and only one OAuth provider left', async () => {
    const user = await mockUserRepo.findByEmail('scholar@institution.edu');
    const userId = user?.id ?? '';

    // Unlink GitHub first (Google remains, count = 2 -> 1)
    await oauthService.unlinkConnection(userId, 'github');

    const connectionsAfterOne = await oauthService.getConnections(userId);
    expect(connectionsAfterOne).toHaveLength(1);

    // Attempt to unlink the last provider (Google) without a set password -> should throw
    await expect(
      oauthService.unlinkConnection(userId, 'google'),
    ).rejects.toThrow('Cannot disconnect your only sign-in method');
  });
});
