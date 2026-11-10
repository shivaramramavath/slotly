// Unit tests verifying landing page authentication redirect resolver logic and behavior.
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { getLandingAuthRedirect } from '@/features/auth/services/session-validator';

describe('Landing Page Auth Redirect', () => {
  it('returns null (no redirect, 200 landing page) when session cookie is absent or empty', async () => {
    assert.strictEqual(await getLandingAuthRedirect(null), null);
    assert.strictEqual(await getLandingAuthRedirect(undefined), null);
    assert.strictEqual(await getLandingAuthRedirect(''), null);
  });

  it('returns /dashboard (307 redirect) when session is active and valid in Redis', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({ valid: true, sessionId: 'ses_active123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    try {
      const redirectUrl = await getLandingAuthRedirect('ses_active123');
      assert.strictEqual(redirectUrl, '/dashboard');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns null (no redirect, 200 landing page) when session is expired or revoked (401)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({ statusCode: 401, message: 'SESSION_EXPIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    try {
      const redirectUrl = await getLandingAuthRedirect('ses_expired123');
      assert.strictEqual(redirectUrl, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns null (no redirect, 200 landing page) when session cookie is malformed or boolean flag', async () => {
    const redirectUrl = await getLandingAuthRedirect('1');
    assert.strictEqual(redirectUrl, null);
  });

  it('returns null (no redirect, 200 landing page) when network error occurs during verification', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => {
      throw new Error('Connection refused');
    });

    try {
      const redirectUrl = await getLandingAuthRedirect('ses_network_error');
      assert.strictEqual(redirectUrl, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
