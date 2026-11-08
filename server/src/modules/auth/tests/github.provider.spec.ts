// Unit tests for GithubProvider strategy verifying authorization URL construction and primary email fetching.
import { HttpClient } from '../adapters/http-client.adapter';
import { GithubProvider } from '../strategies/github.provider';

describe('GithubProvider', () => {
  let provider: GithubProvider;
  let httpClientMock: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
    };

    provider = new GithubProvider(
      {
        clientId: 'github-client-id-test',
        clientSecret: 'github-client-secret-test',
      },
      httpClientMock,
    );
  });

  it('reports isEnabled() as true when both client id and secret are present', () => {
    expect(provider.isEnabled()).toBe(true);
  });

  it('reports isEnabled() as false when client id or secret is empty', () => {
    const disabled = new GithubProvider(
      {
        clientId: '',
        clientSecret: '',
      },
      httpClientMock,
    );
    expect(disabled.isEnabled()).toBe(false);
  });

  it('constructs correct authorization URL with required scopes', () => {
    const authUrl = provider.getAuthorizationUrl({
      redirectUri: 'http://localhost:4000/auth/oauth/github/callback',
      state: 'state-gh-123',
    });

    const parsed = new URL(authUrl);
    expect(parsed.origin).toBe('https://github.com');
    expect(parsed.searchParams.get('client_id')).toBe('github-client-id-test');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/auth/oauth/github/callback',
    );
    expect(parsed.searchParams.get('scope')).toBe('read:user user:email');
    expect(parsed.searchParams.get('state')).toBe('state-gh-123');
  });

  it('exchanges code, retrieves user, and extracts primary verified email', async () => {
    httpClientMock.post.mockResolvedValueOnce({
      access_token: 'gh-access-token-123',
      token_type: 'bearer',
    });

    httpClientMock.get.mockImplementation((url: string) => {
      if (url.includes('/user/emails')) {
        return Promise.resolve([
          { email: 'secondary@github.com', primary: false, verified: true },
          { email: 'Primary@github.com', primary: true, verified: true },
          { email: 'unverified@github.com', primary: false, verified: false },
        ]);
      }
      if (url.includes('/user')) {
        return Promise.resolve({
          id: 54321,
          login: 'octocat',
          name: 'Mona Lisa Octocat',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
        });
      }
      return Promise.reject(new Error(`Unexpected URL ${url}`));
    });

    const identity = await provider.exchangeCode({
      code: 'gh-code-123',
      redirectUri: 'http://localhost:4000/auth/oauth/github/callback',
    });

    expect(identity).toEqual({
      provider: 'github',
      providerUserId: '54321',
      email: 'primary@github.com',
      emailVerified: true,
      name: 'Mona Lisa Octocat',
      avatarUrl: 'https://github.com/images/error/octocat_happy.gif',
    });
  });
});
