// Unit tests for GoogleProvider strategy verifying authorization URL construction and token exchange.
import { HttpClient } from '../adapters/http-client.adapter';
import { GoogleProvider } from '../strategies/google.provider';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;
  let httpClientMock: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClientMock = {
      get: jest.fn(),
      post: jest.fn(),
    };

    provider = new GoogleProvider(
      {
        clientId: 'google-client-id-test',
        clientSecret: 'google-client-secret-test',
      },
      httpClientMock,
    );
  });

  it('reports isEnabled() as true when both client id and secret are present', () => {
    expect(provider.isEnabled()).toBe(true);
  });

  it('reports isEnabled() as false when client id or secret is empty', () => {
    const disabled = new GoogleProvider(
      {
        clientId: '',
        clientSecret: '',
      },
      httpClientMock,
    );
    expect(disabled.isEnabled()).toBe(false);
  });

  it('constructs correct authorization URL with PKCE and nonce', () => {
    const authUrl = provider.getAuthorizationUrl({
      redirectUri: 'http://localhost:4000/auth/oauth/google/callback',
      state: 'state-123',
      codeChallenge: 'challenge-xyz',
      nonce: 'nonce-abc',
    });

    const parsed = new URL(authUrl);
    expect(parsed.origin).toBe('https://accounts.google.com');
    expect(parsed.searchParams.get('client_id')).toBe('google-client-id-test');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'http://localhost:4000/auth/oauth/google/callback',
    );
    expect(parsed.searchParams.get('state')).toBe('state-123');
    expect(parsed.searchParams.get('code_challenge')).toBe('challenge-xyz');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    expect(parsed.searchParams.get('nonce')).toBe('nonce-abc');
  });

  it('exchanges code and verifies ID token claims', async () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString(
      'base64url',
    );
    const payload = Buffer.from(
      JSON.stringify({
        iss: 'https://accounts.google.com',
        aud: 'google-client-id-test',
        sub: '10987654321',
        email: 'Scholar@Example.com',
        email_verified: true,
        name: 'Scholar User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        exp: validExp,
        nonce: 'nonce-abc',
      }),
    ).toString('base64url');
    const fakeIdToken = `${header}.${payload}.fakesignature`;

    httpClientMock.post.mockResolvedValueOnce({
      access_token: 'google-access-token',
      id_token: fakeIdToken,
      token_type: 'Bearer',
    });

    const identity = await provider.exchangeCode({
      code: 'auth-code-123',
      redirectUri: 'http://localhost:4000/auth/oauth/google/callback',
      codeVerifier: 'verifier-123',
      nonce: 'nonce-abc',
    });

    expect(identity).toEqual({
      provider: 'google',
      providerUserId: '10987654321',
      email: 'scholar@example.com',
      emailVerified: true,
      name: 'Scholar User',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    });
  });

  it('rejects ID token with mismatched audience', async () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString(
      'base64url',
    );
    const payload = Buffer.from(
      JSON.stringify({
        iss: 'https://accounts.google.com',
        aud: 'wrong-client-id',
        sub: '10987654321',
        email: 'user@example.com',
        email_verified: true,
        exp: validExp,
      }),
    ).toString('base64url');

    httpClientMock.post.mockResolvedValueOnce({
      access_token: 'google-access-token',
      id_token: `${header}.${payload}.sig`,
      token_type: 'Bearer',
    });

    await expect(
      provider.exchangeCode({
        code: 'code',
        redirectUri: 'http://localhost:4000/callback',
      }),
    ).rejects.toThrow('ID token audience mismatch');
  });
});
